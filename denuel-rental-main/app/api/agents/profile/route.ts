import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';
import { publicServerError } from '@/lib/publicError';

const ProfileSchema = z.object({
  bio: z.string().trim().max(4000).optional().nullable(),
  specialties: z.array(z.string().trim().min(1)).max(20).optional(),
  areasServed: z.array(z.string().trim().min(1)).max(30).optional(),
  licenseNumber: z.string().trim().max(120).optional().nullable(),
  yearsExperience: z.number().int().min(0).max(80).optional().nullable(),
  languages: z.array(z.string().trim().min(1)).max(20).optional(),
  profilePhotoUrl: z.string().url().optional().nullable(),
  coverPhotoUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  facebookUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  publicEmail: z.string().email().optional().nullable(),
  publicPhone: z.string().trim().max(80).optional().nullable(),
  whatsappNumber: z.string().trim().max(80).optional().nullable(),
});

function completion(profile: any) {
  const checks = [
    profile?.bio,
    Array.isArray(profile?.specialties) && profile.specialties.length > 0,
    Array.isArray(profile?.areasServed) && profile.areasServed.length > 0,
    profile?.yearsExperience !== null && profile?.yearsExperience !== undefined,
    Array.isArray(profile?.languages) && profile.languages.length > 0,
    profile?.profilePhotoUrl,
    profile?.publicEmail || profile?.publicPhone || profile?.whatsappNumber,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const userId = searchParams.get('userId');
    const me = searchParams.get('me') === 'true';
    const city = searchParams.get('city');
    const area = searchParams.get('area');
    const specialty = searchParams.get('specialty');
    const verified = searchParams.get('verified') === 'true';
    const sortBy = searchParams.get('sortBy') || 'rating';
    const page = Math.max(1, Number(searchParams.get('page') || 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20) || 20));

    const where: any = {};

    if (me) {
      const user = await requireAuth(req, ['AGENT', 'ADMIN']);
      where.userId = user.id;
    } else if (agentId) {
      where.id = agentId;
    } else if (userId) {
      where.userId = userId;
    }

    if (verified) {
      where.user = {
        ...(where.user || {}),
        OR: [
          { isIdVerified: true },
          { isBusinessVerified: true },
        ],
      };
    }

    if (city || area) {
      where.areasServed = {
        path: '$',
        array_contains: area || city,
      };
    }

    if (specialty) {
      where.specialties = {
        path: '$',
        array_contains: specialty,
      };
    }

    let orderBy: any = { ratingAvg: 'desc' };
    if (sortBy === 'reviews') orderBy = { ratingCount: 'desc' };
    else if (sortBy === 'experience') orderBy = { yearsExperience: 'desc' };
    else if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

    const include = {
      user: {
        select: {
          id: true,
          name: true,
          companyName: true,
          profileImage: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isIdVerified: true,
          isBusinessVerified: true,
          trustScore: true,
          properties: {
            where: { status: 'APPROVED' as const },
            select: { id: true },
          },
        },
      },
      reviews: {
        take: 3,
        orderBy: { createdAt: 'desc' as const },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      transactions: {
        orderBy: { closedAt: 'desc' as const },
        take: 10,
      },
    };

    if (me || agentId || userId) {
      const agent = await prisma.agentProfile.findFirst({
        where,
        include,
      });

      if (!agent) {
        return NextResponse.json(
          { error: 'Agent profile not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        agent: {
          ...agent,
          approvedListingCount: agent.user.properties.length,
          profileCompletion: completion(agent),
        },
      });
    }

    const [agents, total] = await Promise.all([
      prisma.agentProfile.findMany({
        where,
        include,
        orderBy: [{ isFeatured: 'desc' }, orderBy],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agentProfile.count({ where }),
    ]);

    return NextResponse.json({
      agents: agents.map((agent) => ({
        ...agent,
        approvedListingCount: agent.user.properties.length,
        profileCompletion: completion(agent),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Fetch agents error:', error);
    const safe = publicServerError(error, 'Unable to load agent profiles.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['AGENT', 'ADMIN']);
    requireCsrf(req);

    const parsed = ProfileSchema.parse(await req.json());

    const profile = await prisma.agentProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: parsed.bio ?? null,
        specialties: parsed.specialties ?? [],
        areasServed: parsed.areasServed ?? [],
        licenseNumber: parsed.licenseNumber ?? null,
        yearsExperience: parsed.yearsExperience ?? null,
        languages: parsed.languages ?? [],
        profilePhotoUrl: parsed.profilePhotoUrl ?? null,
        coverPhotoUrl: parsed.coverPhotoUrl ?? null,
        website: parsed.website ?? null,
        facebookUrl: parsed.facebookUrl ?? null,
        linkedinUrl: parsed.linkedinUrl ?? null,
        instagramUrl: parsed.instagramUrl ?? null,
        publicEmail: parsed.publicEmail ?? null,
        publicPhone: parsed.publicPhone ?? null,
        whatsappNumber: parsed.whatsappNumber ?? null,
      },
      create: {
        userId: user.id,
        bio: parsed.bio ?? null,
        specialties: parsed.specialties ?? [],
        areasServed: parsed.areasServed ?? [],
        licenseNumber: parsed.licenseNumber ?? null,
        yearsExperience: parsed.yearsExperience ?? null,
        languages: parsed.languages ?? [],
        profilePhotoUrl: parsed.profilePhotoUrl ?? null,
        coverPhotoUrl: parsed.coverPhotoUrl ?? null,
        website: parsed.website ?? null,
        facebookUrl: parsed.facebookUrl ?? null,
        linkedinUrl: parsed.linkedinUrl ?? null,
        instagramUrl: parsed.instagramUrl ?? null,
        publicEmail: parsed.publicEmail ?? null,
        publicPhone: parsed.publicPhone ?? null,
        whatsappNumber: parsed.whatsappNumber ?? null,
      },
    });

    return NextResponse.json({
      profile,
      profileCompletion: completion(profile),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Check the agent profile details.' },
        { status: 422 }
      );
    }
    if (error instanceof Response) return error;
    console.error('Save agent profile error:', error);
    const safe = publicServerError(error, 'Unable to save the agent profile.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
