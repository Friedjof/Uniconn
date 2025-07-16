import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
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

    // Get fresh user data
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        emailVerification: true,
        room: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Return user info without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        user: userWithoutPassword,
        isAuthenticated: true,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}