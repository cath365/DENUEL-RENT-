import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch all testimonials (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ["ADMIN"]);
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    const where: any = {};
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    const testimonials = await prisma.testimonial.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { featured: "desc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    const stats = {
      total: await prisma.testimonial.count(),
      pending: await prisma.testimonial.count({ where: { status: "PENDING" } }),
      approved: await prisma.testimonial.count({ where: { status: "APPROVED" } }),
      rejected: await prisma.testimonial.count({ where: { status: "REJECTED" } }),
      featured: await prisma.testimonial.count({ where: { featured: true } }),
    };

    return NextResponse.json({ testimonials, stats });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch testimonials" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// POST - Create new testimonial
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const { name, role, location, avatar, rating, title, content, propertyTitle } = body;

    if (!name || !rating || !content) {
      return NextResponse.json(
        { error: "Name, rating, and content are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        userId: user.id,
        name,
        role: role || "Renter",
        location,
        avatar,
        rating,
        title,
        content,
        propertyTitle,
        status: "PENDING", // Requires admin approval
      },
    });

    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create testimonial" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// PATCH - Update testimonial (approve/reject/feature)
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req, ["ADMIN"]);
    const body = await req.json();

    const { id, status, featured, order, rejectReason } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    
    if (status) {
      updateData.status = status.toUpperCase();
      if (status.toUpperCase() === "APPROVED") {
        updateData.approvedBy = user.id;
        updateData.approvedAt = new Date();
      }
    }

    if (featured !== undefined) {
      updateData.featured = featured;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ testimonial });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update testimonial" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// DELETE - Delete testimonial
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req, ["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.testimonial.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete testimonial" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
