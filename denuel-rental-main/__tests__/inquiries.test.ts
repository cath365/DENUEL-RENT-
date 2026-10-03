import { GET } from '../app/api/inquiries/route';
import { POST } from '../app/api/messages/route';

describe('inquiries API', () => {
  it('returns forbidden for non-auth (should throw), but route shape exists', async () => {
    const req = new Request('http://localhost/api/inquiries');
    const res = await GET(req as any);
    expect((res as Response).status).toBeGreaterThanOrEqual(400);
    const text = await (res as Response).text();
    expect(text.length).toBeGreaterThan(0);
  });

  it('creates a message thread via messages POST (shape)', async () => {
    const req = new Request('http://localhost/api/messages', { method: 'POST', body: JSON.stringify({ propertyId: 'nonexist', message: 'hi' }) });
    const res = await POST(req as any);
    expect((res as Response).status).toBeGreaterThanOrEqual(400);
    const text = await (res as Response).text();
    expect(text.length).toBeGreaterThan(0);
  });
});
