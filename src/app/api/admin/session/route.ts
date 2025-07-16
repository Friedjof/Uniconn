import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminSession = request.cookies.get('admin_session');
    console.log('Admin session cookie:', adminSession?.value);
    
    if (!adminSession) {
      console.log('No admin session cookie found');
      return NextResponse.json(
        { message: 'No admin session found' },
        { status: 401 }
      );
    }

    // Decode and validate session token
    try {
      const decoded = Buffer.from(adminSession.value, 'base64').toString('utf-8');
      const [username, timestamp] = decoded.split(':');
      console.log('Decoded session:', { username, timestamp });
      
      const adminUsername = process.env.ADMIN_USERNAME;
      console.log('Expected admin username:', adminUsername);
      
      if (!adminUsername || username !== adminUsername) {
        console.log('Username mismatch:', { username, adminUsername });
        return NextResponse.json(
          { message: 'Invalid admin session' },
          { status: 401 }
        );
      }

      // Check if session is expired (8 hours)
      const sessionTime = parseInt(timestamp);
      const now = Date.now();
      const maxAge = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      console.log('Session time check:', { sessionTime, now, maxAge, diff: now - sessionTime });

      if (now - sessionTime > maxAge) {
        console.log('Session expired');
        return NextResponse.json(
          { message: 'Admin session expired' },
          { status: 401 }
        );
      }

      console.log('Session validation successful');
      return NextResponse.json(
        {
          user: { username: adminUsername, role: 'admin' },
          isAuthenticated: true,
        },
        { status: 200 }
      );

    } catch (decodeError) {
      console.log('Session decode error:', decodeError);
      return NextResponse.json(
        { message: 'Invalid admin session format' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Admin session validation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}