import { GET } from '../app/api/analytics/property/[id]/timeseries/route';
import prisma from '../lib/prisma';

jest.mock('../lib/prisma', () => ({
  propertyView: { findMany: jest.fn() },
}));

describe('timeseries API', () => {
  it('returns data shape', async () => {
    // @ts-ignore
    prisma.propertyView.findMany.mockResolvedValue([]);
    const req = new Request('http://localhost/api/analytics/property/p1/timeseries?days=7');
    const res = await GET(req as any, { params: { id: 'p1' } } as any);
    const json = await res.json();
    expect(json).toHaveProperty('data');
    expect(Array.isArray(json.data)).toBe(true);
  });
});
