import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const prop = await prisma.property.findUnique({ where: { id }, include: { images: true } });
    if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const recentViews = await prisma.propertyView.findMany({ where: { propertyId: id }, orderBy: { createdAt: 'desc' }, take: 20 });
    return NextResponse.json({ viewCount: prop.viewCount, saveCount: prop.saveCount, recentViews });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}