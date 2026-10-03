import { NextResponse } from 'next/server';
import { verifyJwt } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/denuel_token=([^;]+)/);
    if (!match) return NextResponse.json({ user: null });
    const token = match[1];
    const decoded = verifyJwt<{ id: string }>(token);
    if (!decoded) return NextResponse.json({ user: null });
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ user: null });
    // remove password
    // @ts-ignore
    delete user.password;
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ user: null });
  }
}