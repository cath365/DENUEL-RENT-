import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getConfig() {
  const region = process.env.AWS_REGION;
  const bucket = process.env.S3_BUCKET;

  if (!region || !bucket) {
    throw new Error('S3 storage is not configured');
  }

  return { region, bucket };
}

function getS3Client(region: string) {
  return new S3Client({ region });
}

export async function createPresignedUploadUrl(
  key: string,
  contentType = 'application/octet-stream',
  expiresIn = 900
) {
  const { region, bucket } = getConfig();
  const s3 = getS3Client(region);
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, cmd, { expiresIn });
  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return { url, publicUrl, key };
}

export async function verifyObject(key: string) {
  const { region, bucket } = getConfig();
  const s3 = getS3Client(region);
  const cmd = new HeadObjectCommand({ Bucket: bucket, Key: key });
  const res = await s3.send(cmd);
  const contentType = res.ContentType || '';
  const size = Number(res.ContentLength || 0);
  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return { contentType, size, publicUrl };
}

export async function deleteObject(key: string) {
  const { region, bucket } = getConfig();
  const s3 = getS3Client(region);
  const cmd = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  await s3.send(cmd);
  return true;
}
