import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get documents for a provider
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
      include: {
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ documents: provider.documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ message: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST - Upload document
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    const body = await req.json();
    const { type, name, fileUrl, fileSize, mimeType, expiresAt } = body;

    if (!type || !name || !fileUrl) {
      return NextResponse.json(
        { message: 'Type, name, and file URL are required' },
        { status: 400 }
      );
    }

    const document = await prisma.serviceDocument.create({
      data: {
        providerId: provider.id,
        type,
        name,
        fileUrl,
        fileSize,
        mimeType,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isVerified: false, // Documents need admin verification
      },
    });

    return NextResponse.json({
      message: 'Document uploaded successfully. It will be reviewed for verification.',
      document,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ message: 'Failed to upload document' }, { status: 500 });
  }
}

// DELETE - Remove document
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ message: 'Document ID required' }, { status: 400 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    // Verify ownership
    const document = await prisma.serviceDocument.findFirst({
      where: { id: docId, providerId: provider.id },
    });

    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    await prisma.serviceDocument.delete({
      where: { id: docId },
    });

    return NextResponse.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ message: 'Failed to delete document' }, { status: 500 });
  }
}
