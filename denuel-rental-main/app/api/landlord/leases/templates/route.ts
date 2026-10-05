import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TemplateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  content: z.string().trim().min(1).max(200000),
  variables: z.any().optional(),
  isDefault: z.boolean().optional(),
});

const TemplateUpdateSchema = TemplateSchema.partial().extend({
  id: z.string().cuid(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'ADMIN']);

    const templates = await prisma.leaseTemplate.findMany({
      where:
        user.role === 'ADMIN'
          ? {}
          : { landlordId: user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Fetch lease templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['LANDLORD']);
    requireCsrf(req);

    const parsed = TemplateSchema.parse(await req.json());

    const template = await prisma.$transaction(async (tx) => {
      if (parsed.isDefault) {
        await tx.leaseTemplate.updateMany({
          where: {
            landlordId: user.id,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      return tx.leaseTemplate.create({
        data: {
          landlordId: user.id,
          name: parsed.name,
          content: parsed.content,
          variables: parsed.variables,
          isDefault: Boolean(parsed.isDefault),
        },
      });
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    console.error('Create lease template error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['LANDLORD']);
    requireCsrf(req);

    const parsed = TemplateUpdateSchema.parse(await req.json());

    const template = await prisma.leaseTemplate.findFirst({
      where: {
        id: parsed.id,
        landlordId: user.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (parsed.isDefault) {
        await tx.leaseTemplate.updateMany({
          where: {
            landlordId: user.id,
            isDefault: true,
            id: { not: template.id },
          },
          data: { isDefault: false },
        });
      }

      return tx.leaseTemplate.update({
        where: { id: template.id },
        data: {
          ...(parsed.name !== undefined ? { name: parsed.name } : {}),
          ...(parsed.content !== undefined
            ? { content: parsed.content }
            : {}),
          ...(parsed.variables !== undefined
            ? { variables: parsed.variables }
            : {}),
          ...(parsed.isDefault !== undefined
            ? { isDefault: parsed.isDefault }
            : {}),
        },
      });
    });

    return NextResponse.json({ template: updated });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    console.error('Update lease template error:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['LANDLORD']);
    requireCsrf(req);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !z.string().cuid().safeParse(id).success) {
      return NextResponse.json(
        { error: 'Valid template ID is required' },
        { status: 400 }
      );
    }

    const inUse = await prisma.leaseAgreement.count({
      where: {
        templateId: id,
        landlordId: user.id,
      },
    });

    if (inUse > 0) {
      return NextResponse.json(
        {
          error:
            'This template is already referenced by a lease and cannot be deleted.',
        },
        { status: 409 }
      );
    }

    const deleted = await prisma.leaseTemplate.deleteMany({
      where: {
        id,
        landlordId: user.id,
      },
    });

    if (!deleted.count) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Delete lease template error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
