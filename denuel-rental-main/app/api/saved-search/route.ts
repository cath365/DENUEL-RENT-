import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { z } from 'zod';

const CreateSchema = z.object({ queryJson: z.any() });

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const items = await prisma.savedSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ items });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const parsed = CreateSchema.parse(body);
    const row = await prisma.savedSearch.create({ data: { userId: user.id, queryJson: parsed.queryJson } });
    return NextResponse.json({ item: row });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 422 });
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}