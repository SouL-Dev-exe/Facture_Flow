import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, allowedRoles = ['admin', 'manager'] } = body;

    if (!pin) {
      return NextResponse.json({ success: false, message: 'PIN code is required' }, { status: 400 });
    }

    const verification = db.verifyPin(pin, allowedRoles);
    if (!verification.success) {
      return NextResponse.json({ success: false, message: verification.message }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: verification.user?.id,
        fullName: verification.user?.fullName,
        email: verification.user?.email,
        role: verification.user?.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
