import { issueTokens } from '../lib/auth';
import prisma from '../lib/prisma';
import { NextResponse } from 'next/server';

jest.mock('../lib/prisma', () => ({
  refreshToken: {
    create: jest.fn().mockResolvedValue({ id: 'rt1' }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
}));

describe('auth cookies', () => {
  it('issueTokens sets access and refresh cookies on response', async () => {
    const user = { id: 'user1', role: 'USER' } as any;
    const res = NextResponse.json({});
    const out = await issueTokens(res, user);
    const header = out.headers.get('Set-Cookie') || out.headers.get('set-cookie') || '';
    expect(header).toBeTruthy();
    // Because we append multiple cookies, header should include access, refresh, and csrf cookies
    expect(header.includes('denuel_token=') || header.includes('denuel_refresh=') || header.includes('denuel_csrf=')).toBe(true);
    expect(header.includes('denuel_csrf=')).toBe(true);
  });
});