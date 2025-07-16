import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationCode } = body;

    // Validate required fields
    if (!verificationCode) {
      return NextResponse.json(
        { message: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Get user from session
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'No session found' },
        { status: 401 }
      );
    }

    const payload = verifyToken(sessionCookie.value);
    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid session' },
        { status: 401 }
      );
    }

    // Find user with tenant verification
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        tenantVerification: true,
        emailVerification: true,
        room: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.emailVerification?.isVerified) {
      return NextResponse.json(
        { message: 'Email must be verified first' },
        { status: 400 }
      );
    }

    // Check if user has selected a room
    if (!user.roomId) {
      return NextResponse.json(
        { message: 'Please select a room first' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.isTenantVerified) {
      return NextResponse.json(
        { message: 'Tenant is already verified' },
        { status: 400 }
      );
    }

    // Check if tenant verification exists
    if (!user.tenantVerification) {
      return NextResponse.json(
        { message: 'No tenant verification found. Please select a room first.' },
        { status: 404 }
      );
    }

    // Check if verification code has expired
    if (user.tenantVerification.expiresAt < new Date()) {
      return NextResponse.json(
        { message: 'Verification code has expired. Please contact building management.' },
        { status: 400 }
      );
    }

    // Verify code
    if (user.tenantVerification.verificationCode !== verificationCode.toUpperCase()) {
      return NextResponse.json(
        { message: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Mark tenant as verified
    await db.$transaction(async (prisma) => {
      await prisma.tenantVerification.update({
        where: { id: user.tenantVerification!.id },
        data: { isVerified: true },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { isTenantVerified: true },
      });
    });

    return NextResponse.json(
      { message: 'Tenant verified successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Tenant verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}