import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  await db.syncFromSupabase();
  return NextResponse.json(db.getPurchaseOrders());
}

export async function POST(req: NextRequest) {
  const userRole = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id') || undefined;

  if (!['admin', 'manager'].includes(userRole || '')) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const body = await req.json();

  if (!body.supplierId) {
    return NextResponse.json({ error: 'supplierId is required' }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
  }

  const po = db.createPurchaseOrder(
    {
      supplierId: body.supplierId,
      invoiceReference: body.invoiceReference,
      notes: body.notes,
      items: body.items,
    },
    userId
  );

  return NextResponse.json(po, { status: 201 });
}
