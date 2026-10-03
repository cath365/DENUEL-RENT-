import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch agent/landlord clients (people who applied to their properties)
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Get unique users who have applied to this agent's properties
    const applications = await prisma.application.findMany({
      where: {
        property: {
          ownerId: user.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        appliedAt: "desc",
      },
    });

    // Deduplicate users and count properties they've applied to
    const clientsMap = new Map();
    
    applications.forEach((app) => {
      const userId = app.user.id;
      if (clientsMap.has(userId)) {
        const existing = clientsMap.get(userId);
        existing.properties += 1;
      } else {
        clientsMap.set(userId, {
          id: app.user.id,
          name: app.user.name,
          email: app.user.email,
          phone: app.user.phone,
          properties: 1,
          createdAt: app.user.createdAt,
        });
      }
    });

    const clients = Array.from(clientsMap.values());

    return NextResponse.json({ clients });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch clients" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
