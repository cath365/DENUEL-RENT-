import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function processImageKey(key: string) {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket) throw new Error('S3 not configured');
  const { default: sharp } = await import('sharp');
  const get = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = await streamToBuffer(get.Body as any);

  const sizes = [400, 800, 1200];
  const variants: any[] = [];

  for (const w of sizes) {
    const out = await sharp(body).resize({ width: w }).jpeg({ quality: 80 }).toBuffer();
    const destKey = `${key}@w_${w}.jpg`;
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: destKey, Body: out, ContentType: 'image/jpeg' }));
    variants.push({ key: destKey, publicUrl: `https://${bucket}.s3.${region}.amazonaws.com/${destKey}`, width: w });
  }

  return variants;
}

async function streamToBuffer(stream: any) {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf: any[] = [];
    stream.on('data', (chunk: any) => _buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buf)));
    stream.on('error', (err: any) => reject(err));
  });
}

export default processImageKey;
