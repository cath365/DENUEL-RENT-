import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyPassword, issueTokens } from '../../../../lib/auth';
import { publicServerError } from '../../../../lib/publicError';
import { z } from 'zod';

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

    const user = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const pwOk = verifyPassword(parsed.password, user.password);
    if (!pwOk) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    await issueTokens(res, user);
    return res;
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || 'Invalid login details' },
        { status: 422 }
      );
    }

    console.error('Login failed', err);
    const safe = publicServerError(err, 'Unable to sign in. Please try again.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
