import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { UserRole } from '@/generated/prisma';
import { generateToken } from '@/lib/jwt';
import { emailService } from '@/lib/email';
import { generateEmailVerificationCode } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, termsAccepted, privacyAccepted } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]).{16,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { message: 'Password must be at least 16 characters long and contain uppercase letters, digits, and special characters' },
        { status: 400 }
      );
    }

    // Validate terms acceptance
    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json(
        { message: 'You must accept the Terms of Service and Privacy Policy' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification code (6 digits)
    const verificationCode = generateEmailVerificationCode();

    // Create user and email verification in a transaction
    const user = await db.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: UserRole.USER,
          termsAccepted,
          privacyAccepted,
        },
      });

      await prisma.emailVerification.create({
        data: {
          userId: newUser.id,
          verificationCode,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      return newUser;
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      isEmailVerified: false,
      roomId: undefined,
      isTenantVerified: false,
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail({
        to: email,
        verificationCode,
        firstName,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    const response = NextResponse.json(
      { 
        message: 'Registration successful. Please check your email for verification.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      },
      { status: 201 }
    );

    // Set HttpOnly cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}