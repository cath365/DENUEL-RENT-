import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      name,
      phone,
      nrcNumber,
      businessName,
      category,
      description,
      city,
      area,
      yearsInBusiness,
      priceRange,
    } = body;

    // Validate required fields
    if (!email || !password || !name || !phone || !businessName || !category || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and service provider in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with SERVICE_PROVIDER role
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: 'SERVICE_PROVIDER',
        },
      });

      // Create service provider profile
      const serviceProvider = await tx.serviceProvider.create({
        data: {
          userId: user.id,
          businessName,
          category,
          description,
          phone,
          email,
          city,
          area,
          nrcNumber,
          yearsInBusiness,
          priceRange,
          isVerified: false,
          isActive: true,
          isAvailable: true,
        },
      });

      return { user, serviceProvider };
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.user.id, 
        email: result.user.email, 
        role: result.user.role,
        serviceProviderId: result.serviceProvider.id,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set auth cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      serviceProvider: {
        id: result.serviceProvider.id,
        businessName: result.serviceProvider.businessName,
        category: result.serviceProvider.category,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Service provider registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
