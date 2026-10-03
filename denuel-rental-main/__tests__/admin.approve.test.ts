import prisma from '../lib/prisma';
import { POST } from '../app/api/admin/properties/[id]/approve/route';
import { signJwt } from '../lib/auth';

jest.mock('../lib/prisma', () => ({
  property: {
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  }
}));

describe('admin approve endpoint', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 403 for non-admin user', async () => {
    const token = signJwt({ id: 'u1', role: 'USER' }, '1h');
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', role: 'USER', password: 'x' });
    const req = new Request('http://localhost/api/admin/properties/abc/approve', { method: 'POST', headers: { cookie: `denuel_token=${token}` }, body: JSON.stringify({ status: 'APPROVED' }) });
    const res = await POST(req as any, { params: { id: 'abc' } } as any);
    expect((res as Response).status).toBe(403);
  });

  it('allows admin to approve and returns property', async () => {
    const token = signJwt({ id: 'admin1', role: 'ADMIN' }, '1h');
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'admin1', role: 'ADMIN', password: 'x' });
    (prisma.property.update as jest.Mock).mockResolvedValue({ id: 'abc', status: 'APPROVED' });
    const req = new Request('http://localhost/api/admin/properties/abc/approve', { method: 'POST', headers: { cookie: `denuel_token=${token}` }, body: JSON.stringify({ status: 'APPROVED' }) });
    const res = await POST(req as any, { params: { id: 'abc' } } as any);
    const json = await (res as Response).json();
    expect(json.property).toBeTruthy();
    expect(json.property.status).toBe('APPROVED');
  });
});