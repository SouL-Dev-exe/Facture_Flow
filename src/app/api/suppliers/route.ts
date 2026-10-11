import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  await db.syncFromSupabase();
  return NextResponse.json(db.getSuppliers());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = req.headers.get('x-user-id') || undefined;
  const userRole = req.headers.get('x-user-role');

  if (!['admin', 'manager'].includes(userRole || '')) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
  }

  const supplier = db.createSupplier({
    name: body.name.trim(),
    contactPerson: body.contactPerson || null,
    phone: body.phone || null,
    email: body.email || null,
    address: body.address || null,
    nif: body.nif || null,
    nis: body.nis || null,
    paymentTerms: body.paymentTerms || 'net_30',
    notes: body.notes || null,
  });

  db.logAudit({
    userId,
    action: 'CREATE_SUPPLIER',
    entityType: 'supplier',
    entityId: supplier.id,
    newValues: { name: supplier.name },
  });

  return NextResponse.json(supplier, { status: 201 });
}
