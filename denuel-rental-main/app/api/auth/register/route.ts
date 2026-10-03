import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { hashPassword, issueTokens } from '../../../../lib/auth';
import { z } from 'zod';

const RegisterSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(['USER', 'LANDLORD', 'AGENT', 'DRIVER', 'SERVICE_PROVIDER']).optional(),
  serviceType: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anon';
    
    let rateOk = true;
    try {
      const { checkRate } = await import('../../../../lib/rateLimiter');
      rateOk = await checkRate(ip);
    } catch {
      // Rate limiter not available, continue
    }
    if (!rateOk) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await req.json();
    const parsed = RegisterSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    const hashed = hashPassword(parsed.password);
    
    const user = await prisma.user.create({
      data: {
        name: parsed.name || null,
        email: parsed.email,
        phone: parsed.phone || null,
        password: hashed,
        role: parsed.role || 'USER',
      },
    });

    const response = NextResponse.json({ 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
    
    await issueTokens(response, user);
    return response;
  } catch (err) {
    // Safe error handling - don't log complex objects
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || 'Validation error' }, { status: 422 });
    }
    
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

