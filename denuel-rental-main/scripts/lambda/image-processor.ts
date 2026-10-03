import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const { default: sharp } = await import('sharp');
  const region = process.env.AWS_REGION;
  for (const record of event.Records || []) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      console.log('Processing', bucket, key);

      const get = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const body = await streamToBuffer(get.Body as any);

      const sizes = [400, 800, 1200];
      const uploaded: any[] = [];

      for (const w of sizes) {
        const resized = await sharp(body).resize({ width: w }).toBuffer();
        const ext = 'jpg';
        const destKey = `${key}@w_${w}.${ext}`;
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: destKey, Body: resized, ContentType: 'image/jpeg' }));
        uploaded.push({ key: destKey, url: `https://${bucket}.s3.${region}.amazonaws.com/${destKey}` });
      }

      console.log('Uploaded variants:', uploaded);
    } catch (e) {
      console.error('Error processing record', e);
    }
  }
  return { statusCode: 200 };
};

async function streamToBuffer(stream: any) {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf: any[] = [];
    stream.on('data', (chunk: any) => _buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buf)));
    stream.on('error', (err: any) => reject(err));
  });
}
