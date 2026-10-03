import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyPassword, issueTokens } from '../../../../lib/auth';
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
    console.log('login attempt for', parsed.email);

    console.log('DB url preview:', (process.env.DATABASE_URL || '').slice(0,50));
    const user = await prisma.user.findUnique({ where: { email: parsed.email } });
    console.log('user lookup result:', !!user, user ? user.email : null);
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    console.log('stored pw len:', user.password ? user.password.length : 'no-pass', 'hash prefix:', user.password ? user.password.slice(0, 10) : null, 'raw:', JSON.stringify(user.password), 'type:', typeof user.password);
    console.log('incoming pw len:', parsed.password.length, 'incoming prefix:', parsed.password.slice(0, 4), 'raw:', JSON.stringify(parsed.password), 'type:', typeof parsed.password);
    const bcrypt = (await import('bcryptjs')).default || (await import('bcryptjs'));
    const directCheck = bcrypt.compareSync(parsed.password, user.password);
    console.log('direct bcrypt.compareSync result:', directCheck);
    const pwOk = verifyPassword(parsed.password, user.password);
    console.log('password check:', pwOk);
    if (!pwOk) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    await issueTokens(res, user);
    return res;
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 });
  }
}

