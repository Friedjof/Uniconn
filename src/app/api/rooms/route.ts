import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all active rooms
    const rooms = await db.room.findMany({
      where: { isActive: true },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { number: 'asc' },
      ],
    });

    return NextResponse.json(rooms, { status: 200 });

  } catch (error) {
    console.error('Rooms fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}