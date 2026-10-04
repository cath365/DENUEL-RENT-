import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyPassword, issueTokens } from '../../../../lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anon';
    const { checkRate } = await import('../../../../lib/rateLimiter');
    const ok = await checkRate(ip);
    if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await req.json();
    const parsed = LoginSchema.parse(body);
    const email = parsed.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const pwOk = verifyPassword(parsed.password, user.password);
    if (!pwOk) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    await issueTokens(res, user);
    return res;
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 });
  }
}

