import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supplier = db.getSupplierById(params.id);
  if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userRole = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id') || undefined;

  if (!['admin', 'manager'].includes(userRole || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const updated = db.updateSupplier(params.id, {
    name: body.name,
    contactPerson: body.contactPerson,
    phone: body.phone,
    email: body.email,
    address: body.address,
    nif: body.nif,
    nis: body.nis,
    paymentTerms: body.paymentTerms,
    notes: body.notes,
  });

  if (!updated) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

  db.logAudit({ userId, action: 'UPDATE_SUPPLIER', entityType: 'supplier', entityId: params.id, newValues: body });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userRole = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id') || undefined;

  if (!['admin', 'manager'].includes(userRole || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const success = db.deleteSupplier(params.id);
  if (!success) return NextResponse.json({ error: 'Supplier not found or has orders' }, { status: 404 });

  db.logAudit({ userId, action: 'DELETE_SUPPLIER', entityType: 'supplier', entityId: params.id });
  return NextResponse.json({ success: true });
}
