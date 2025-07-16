import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateApartmentVerificationCode } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userEmail } = body;

    // Validate required fields
    if (!roomId || !userEmail) {
      return NextResponse.json(
        { message: 'Room ID and user email are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: userEmail },
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

    // Check if email is verified
    if (!user.emailVerification?.isVerified) {
      return NextResponse.json(
        { message: 'Email must be verified before selecting a room' },
        { status: 400 }
      );
    }

    // Check if room exists and is active
    const room = await db.room.findUnique({
      where: { id: roomId },
    });

    if (!room || !room.isActive) {
      return NextResponse.json(
        { message: 'Room not found or not available' },
        { status: 404 }
      );
    }

    // Generate apartment verification code
    const verificationCode = generateApartmentVerificationCode();
    
    // Update user's room and create tenant verification
    await db.$transaction(async (prisma) => {
      await prisma.user.update({
        where: { id: user.id },
        data: { roomId },
      });

      await prisma.tenantVerification.create({
        data: {
          userId: user.id,
          verificationCode,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    });

    // TODO: Send physical verification code to apartment mailbox
    console.log(`Apartment verification code for ${user.email} (${room.building} ${room.number}): ${verificationCode}`);

    return NextResponse.json(
      { message: 'Room selected successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Room selection error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}