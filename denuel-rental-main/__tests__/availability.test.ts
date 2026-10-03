import { GET, POST, DELETE } from '../app/api/properties/[id]/availability/route';

describe('availability API', () => {
  it('returns defined shape for GET (unauthenticated route will return error object)', async () => {
    const res = await GET(new Request('http://localhost/api/properties/prop1/availability') as any, { params: { id: 'prop1' } } as any);
    const json = await res.json();
    expect(json).toBeDefined();
  });

  it('POST returns unauthorized when not authenticated', async () => {
    const req = new Request('http://localhost/api/properties/prop1/availability', { method: 'POST', body: JSON.stringify({ startDate: '2025-01-01', endDate: '2024-12-01' }) });
    const res = await POST(req as any, { params: { id: 'prop1' } } as any);
    expect((res as Response).status).toBe(401);
    const text = await (res as Response).text();
    expect(text.length).toBeGreaterThan(0);
  });
});
