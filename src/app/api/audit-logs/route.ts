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
          { success: false, message: 'Forbidden: Access denied to Audit Trail' },
          { status: 403 }
        );
      }
    }

    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');

    let logs = [...db.auditLogs];
    if (action && action !== 'all') {
      logs = logs.filter((l) => l.action === action);
    }
    if (entityType && entityType !== 'all') {
      logs = logs.filter((l) => l.entityType === entityType);
    }

    const logsWithUser = logs.map((l) => ({
      ...l,
      user: db.users.find((u) => u.id === l.userId) || null,
    }));

    return NextResponse.json({ success: true, logs: logsWithUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
