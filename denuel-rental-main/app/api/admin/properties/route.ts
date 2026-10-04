import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';
import { publicServerError } from '../../../../lib/publicError';

export async function GET(req: Request) {
  try {
    await requireAuth(req, ['ADMIN']);

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q')?.trim();

    const where: any = {};
    if (status && ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { city: { contains: q } },
        { area: { contains: q } },
        { owner: { name: { contains: q } } },
        { owner: { email: { contains: q } } },
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ properties });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Admin property list failed', error);
    const safe = publicServerError(error, 'Unable to load property reviews.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
