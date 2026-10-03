import { processImageKey } from '../lib/imageProcessor';

describe('imageProcessor', () => {
  it('throws when S3 not configured', async () => {
    const originalBucket = process.env.S3_BUCKET;
    delete process.env.S3_BUCKET;
    await expect(processImageKey('some/key.jpg')).rejects.toThrow('S3 not configured');
    process.env.S3_BUCKET = originalBucket;
  });
});