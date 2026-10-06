import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
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
