import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
  })),
}));

// import after mocking sharp (native bindings may be unavailable in CI/dev)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handler } = require('../../scripts/lambda/image-processor');

const s3Mock = mockClient(S3Client);

function makeS3Event(bucket: string, key: string) {
  return {
    Records: [
      {
        s3: {
          bucket: { name: bucket },
          object: { key }
        }
      }
    ]
  };
}

describe('image-processor lambda', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it('processes an image and uploads variants', async () => {
    const bucket = 'test-bucket';
    const key = 'user123/test.jpg';

    const buf = Buffer.from('fake-image-bytes');

    // mock getObject to return a readable stream of the buffer
    s3Mock.on(GetObjectCommand).resolves({ Body: Readable.from([buf]) } as any);

    const puts: any[] = [];
    s3Mock.on(PutObjectCommand).callsFake((input: any) => {
      puts.push(input);
      return {} as any;
    });

    const evt = makeS3Event(bucket, key);
    const res = await handler(evt as any);

    expect(res.statusCode).toBe(200);
    // expect multiple put calls (for each variant)
    expect(puts.length).toBeGreaterThanOrEqual(3);
    // put object was called with destination keys based on original key
    expect(puts[0].Bucket).toBe(bucket);
    expect(puts[0].Key).toMatch(new RegExp(`${key}@w_\\d+\\.jpg`));
  });
});
