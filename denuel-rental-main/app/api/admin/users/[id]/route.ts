import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req, ['ADMIN']);
    const { id } = params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        isIdVerified: true,
        profileImage: true,
        _count: {
          select: {
            properties: true,
            applications: true,
            bookings: true,
            favorites: true,
            inquiries: true,
          }
        },
        properties: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
            listingType: true,
            createdAt: true,
          }
        },
        bookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            property: {
              select: { title: true }
            }
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req, ['ADMIN']);
    const { id } = params;
    const body = await req.json();
    const { role, isIdVerified } = body;
    const data: Record<string, unknown> = {};

    if (role !== undefined) {
      if (!['USER', 'LANDLORD', 'AGENT', 'ADMIN', 'DRIVER', 'SERVICE_PROVIDER'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      data.role = role;
    }

    if (isIdVerified !== undefined) {
      data.isIdVerified = Boolean(isIdVerified);
      data.verifiedAt = isIdVerified ? new Date() : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No supported fields provided' }, { status: 400 });
    }

    const user = await prisma.user.update({ where: { id }, data });
    // @ts-ignore
    delete user.password;
    return NextResponse.json({ user });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req, ['ADMIN']);
    const { id } = params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}