import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch all support messages (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ["ADMIN"]);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isRead = searchParams.get("isRead");
    const isResolved = searchParams.get("isResolved");

    const where: any = {};

    if (category && category !== "all") {
      where.category = category;
    }

    if (isRead !== null && isRead !== "all") {
      where.isRead = isRead === "true";
    }

    if (isResolved !== null && isResolved !== "all") {
      where.isResolved = isResolved === "true";
    }

    const messages = await prisma.supportMessage.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: [
        { isResolved: "asc" },
        { isRead: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Get counts for dashboard
    const counts = await prisma.supportMessage.groupBy({
      by: ["isRead", "isResolved"],
      _count: true,
    });

    const stats = {
      total: messages.length,
      unread: counts.find((c) => !c.isRead && !c.isResolved)?._count || 0,
      pending: counts.find((c) => !c.isResolved)?._count || 0,
      resolved: counts.find((c) => c.isResolved)?._count || 0,
    };

    return NextResponse.json({ messages, stats });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// PATCH - Update message (mark as read/resolved, add admin notes)
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req, ["ADMIN"]);
    const body = await req.json();

    const { messageId, isRead, isResolved, adminNotes } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (typeof isRead === "boolean") {
      updateData.isRead = isRead;
    }

    if (typeof isResolved === "boolean") {
      updateData.isResolved = isResolved;
      if (isResolved) {
        updateData.resolvedAt = new Date();
      } else {
        updateData.resolvedAt = null;
      }
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const message = await prisma.supportMessage.update({
      where: { id: messageId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update message" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// DELETE - Delete message (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req, ["ADMIN"]);

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    await prisma.supportMessage.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete message" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
