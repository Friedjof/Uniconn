import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailService } from '@/lib/email';
import { generateEmailVerificationCode } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
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
        { message: 'No verification record found for this user' },
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

    // Generate new verification code (6 digits)
    const verificationCode = generateEmailVerificationCode();

    // Update verification code and expiry
    await db.emailVerification.update({
      where: { id: user.emailVerification.id },
      data: {
        verificationCode,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail({
        to: email,
        verificationCode,
        firstName: user.firstName,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { message: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Verification code sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}