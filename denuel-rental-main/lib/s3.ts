import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;

if (!REGION || !BUCKET) {
  console.warn('S3 not configured (missing AWS_REGION or S3_BUCKET)');
}

const s3 = new S3Client({ region: REGION });

export async function createPresignedUploadUrl(key: string, contentType = 'application/octet-stream', expiresIn = 900) {
  if (!BUCKET) throw new Error('S3 bucket not configured');
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, cmd, { expiresIn });
  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  return { url, publicUrl, key };
}

export async function verifyObject(key: string) {
  if (!BUCKET) throw new Error('S3 bucket not configured');
  const cmd = new HeadObjectCommand({ Bucket: BUCKET, Key: key });
  const res = await s3.send(cmd);
  const contentType = res.ContentType || '';
  const size = Number(res.ContentLength || 0);
  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  return { contentType, size, publicUrl };
}

export async function deleteObject(key: string) {
  if (!BUCKET) throw new Error('S3 bucket not configured');
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await s3.send(cmd);
  return true;
}

export default s3;