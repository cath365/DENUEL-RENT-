import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';
import { z } from 'zod';

const CreateSchema = z.object({ startDate: z.string(), endDate: z.string(), note: z.string().optional() });

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const items = await prisma.propertyAvailability.findMany({ where: { propertyId: id }, orderBy: { startDate: 'asc' } });
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req, ['LANDLORD','AGENT','ADMIN']);
    const { id } = params;
    // ensure ownership
    const prop = await prisma.property.findUnique({ where: { id } });
    if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (prop.ownerId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = CreateSchema.parse(body);
    const start = new Date(parsed.startDate);
    const end = new Date(parsed.endDate);
    if (start >= end) return NextResponse.json({ error: 'startDate must be before endDate' }, { status: 400 });

    const avail = await prisma.propertyAvailability.create({ data: { propertyId: id, startDate: start, endDate: end, note: parsed.note } });
    return NextResponse.json({ availability: avail }, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 422 });
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req, ['LANDLORD','AGENT','ADMIN']);
    const { id } = params; // note: this id is availability id
    const existing = await prisma.propertyAvailability.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const prop = await prisma.property.findUnique({ where: { id: existing.propertyId } });
    if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (prop.ownerId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.propertyAvailability.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}
