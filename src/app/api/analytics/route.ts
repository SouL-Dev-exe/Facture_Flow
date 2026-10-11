import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = req.headers.get('x-user-id') || searchParams.get('userId');
    if (userId) {
      const user = db.users.find((u) => u.id === userId);
      if (user && (user.role === 'cashier' || user.role === 'stocker')) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Access denied to Financial & Analytics Dashboard' },
          { status: 403 }
        );
      }
    }

    const timeframe = (searchParams.get('timeframe') as 'daily' | 'monthly' | 'yearly') || 'daily';
    const summary = db.getAnalyticsSummary(timeframe);
    return NextResponse.json({ success: true, analytics: summary });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
