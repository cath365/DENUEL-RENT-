/// <reference types="jest" />

import { requireAuth, signJwt } from '../lib/auth';
import prisma from '../lib/prisma';

jest.mock('../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

describe('requireAuth helper', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('throws 401 when no cookie present', async () => {
    const req = new Request('http://localhost/api/test');
    await expect(requireAuth(req)).rejects.toMatchObject({ status: 401 });
  });

  it('throws 401 when token invalid', async () => {
    const req = new Request('http://localhost/api/test', { headers: { cookie: 'denuel_token=badtoken' } });
    await expect(requireAuth(req)).rejects.toMatchObject({ status: 401 });
  });

  it('throws 403 when role not allowed', async () => {
    const token = signJwt({ id: 'user1', role: 'USER' }, '1h');
    // mock prisma to return a USER role
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1', role: 'USER', password: 'x' });
    const req = new Request('http://localhost/api/test', { headers: { cookie: `denuel_token=${token}` } });
    await expect(requireAuth(req, ['ADMIN'])).rejects.toMatchObject({ status: 403 });
  });

  it('returns user when authorized', async () => {
    const token = signJwt({ id: 'user2', role: 'LANDLORD' }, '1h');
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user2', role: 'LANDLORD', password: 'x' });
    const req = new Request('http://localhost/api/test', { headers: { cookie: `denuel_token=${token}` } });
    const user = await requireAuth(req, ['LANDLORD']);
    expect(user.id).toBe('user2');
    expect(user.password).toBeUndefined();
  });
});