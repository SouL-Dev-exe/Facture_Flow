import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, password, credential, targetRole, allowedRoles } = body;
    const inputCredential = credential || password || pin;

    if (!inputCredential) {
      return NextResponse.json(
        { success: false, message: 'Password or 4-digit PIN is required' },
        { status: 400 }
      );
    }

    if (targetRole) {
      const verification = db.verifyRoleCredentials(targetRole, inputCredential);
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
    }

    const verification = db.verifyPin(inputCredential, allowedRoles || ['admin', 'manager', 'cashier']);
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
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
