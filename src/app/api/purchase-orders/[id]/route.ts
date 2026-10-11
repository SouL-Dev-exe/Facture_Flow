import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const po = db.getPurchaseOrderById(params.id);
  if (!po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
  return NextResponse.json(po);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userRole = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id') || undefined;

  if (!['admin', 'manager'].includes(userRole || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  if (body.action === 'receive') {
    const updated = db.receivePurchaseOrder(params.id, userId);
    if (!updated) return NextResponse.json({ error: 'PO not found or already received' }, { status: 404 });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userRole = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id') || undefined;

  if (!['admin', 'manager'].includes(userRole || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const success = db.deletePurchaseOrder(params.id);
  if (!success) {
    return NextResponse.json({ error: 'PO not found or cannot be deleted (already received)' }, { status: 400 });
  }

  db.logAudit({ userId, action: 'DELETE_PURCHASE_ORDER', entityType: 'purchase_order', entityId: params.id });
  return NextResponse.json({ success: true });
}
