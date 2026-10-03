import { GET } from '../app/api/search/route';
import prisma from '../lib/prisma';

jest.mock('../lib/prisma', () => ({
  property: { count: jest.fn(), findMany: jest.fn() },
}));

describe('search API', () => {
  it('returns a result shape', async () => {
    // @ts-ignore
    prisma.property.count.mockResolvedValue(0);
    // @ts-ignore
    prisma.property.findMany.mockResolvedValue([]);

    const req = new Request('http://localhost/api/search?page=1&pageSize=1');
    const res = await GET(req as any);
    const json = await res.json();
    expect(json).toHaveProperty('items');
    expect(Array.isArray(json.items)).toBe(true);
  });
});
