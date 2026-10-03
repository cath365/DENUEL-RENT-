import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch user's support messages
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const messages = await prisma.supportMessage.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// POST - Create new support message
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const { category, subject, message, contactInfo } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    const supportMessage = await prisma.supportMessage.create({
      data: {
        userId: user.id,
        category: category || "GENERAL",
        subject,
        message,
        contactInfo,
      },
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

    return NextResponse.json(supportMessage, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create message" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
