import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { requireAuth } from '../../../../../../lib/auth';
import { z } from 'zod';

const BodySchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req, ['ADMIN']);
    const { id } = params;
    const body = await req.json();
    const { status } = BodySchema.parse(body);
    const property = await prisma.property.update({ where: { id }, data: { status } });
    return NextResponse.json({ property });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 422 });
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}
