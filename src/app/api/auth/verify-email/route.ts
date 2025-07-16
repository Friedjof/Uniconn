import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, verificationCode } = body;

    // Validate required fields
    if (!email || !verificationCode) {
      return NextResponse.json(
        { message: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Find user with email verification
    const user = await db.user.findUnique({
      where: { email },
      include: {
        emailVerification: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.emailVerification) {
      return NextResponse.json(
        { message: 'No verification code found for this user' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerification.isVerified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Check if verification code has expired
    if (user.emailVerification.expiresAt < new Date()) {
      return NextResponse.json(
        { message: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Verify code
    if (user.emailVerification.verificationCode !== verificationCode) {
      return NextResponse.json(
        { message: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Mark email as verified
    await db.emailVerification.update({
      where: { id: user.emailVerification.id },
      data: { isVerified: true },
    });

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}