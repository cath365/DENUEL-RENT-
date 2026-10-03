import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get all lenders or search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partnersOnly = searchParams.get('partnersOnly') === 'true';
    const loanType = searchParams.get('loanType');

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (partnersOnly) {
      where.isPartner = true;
    }

    const lenders = await prisma.mortgageLender.findMany({
      where,
      orderBy: [
        { isPartner: 'desc' },
        { currentRate: 'asc' },
      ],
    });

    // Filter by loan type if specified
    let filteredLenders = lenders;
    if (loanType) {
      filteredLenders = lenders.filter((lender) => {
        const types = lender.loanTypes as string[] | null;
        return types?.includes(loanType);
      });
    }

    return NextResponse.json(filteredLenders);
  } catch (error) {
    console.error('Fetch lenders error:', error);
    return NextResponse.json({ error: 'Failed to fetch lenders' }, { status: 500 });
  }
}

// POST - Add a new lender (admin only)
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMIN']);
    const body = await req.json();
    const {
      name,
      logoUrl,
      website,
      phone,
      currentRate,
      minDownPayment,
      loanTypes,
      isPartner,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Lender name is required' }, { status: 400 });
    }

    const lender = await prisma.mortgageLender.create({
      data: {
        name,
        logoUrl,
        website,
        phone,
        currentRate,
        minDownPayment,
        loanTypes,
        isPartner: isPartner || false,
      },
    });

    return NextResponse.json(lender, { status: 201 });
  } catch (error) {
    console.error('Create lender error:', error);
    return NextResponse.json({ error: 'Failed to create lender' }, { status: 500 });
  }
}
