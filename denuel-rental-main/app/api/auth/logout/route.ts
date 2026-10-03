import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/denuel_refresh=([^;]+)/);
    if (match) {
      const raw = match[1];
      try {
        const decoded = jwt.verify(raw, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET) as any;
        if (decoded?.jti) {
          await prisma.refreshToken.updateMany({ where: { jti: decoded.jti }, data: { isRevoked: true } });
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    // ignore
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', `denuel_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure=${process.env.NODE_ENV==='production'}`);
  res.headers.append('Set-Cookie', `denuel_refresh=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure=${process.env.NODE_ENV==='production'}`);
  return res;
}