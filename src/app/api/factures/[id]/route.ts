import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/factures/[id] — Edit facture items, hasTva, recalculate totals
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { items, hasTva, discountAmount = 0, notes, actorUserId } = body;

    if (actorUserId) {
      const actor = db.users.find((u) => u.id === actorUserId);
      if (actor && actor.role === 'stocker') {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Stockers cannot edit or process factures' },
          { status: 403 }
        );
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invoice must have at least 1 item' },
        { status: 400 }
      );
    }

    const existing = db.getFactureById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Facture not found' }, { status: 404 });
    }

    // Validate stock: only check products whose qty INCREASED vs current items
    const oldQtyMap: Record<string, number> = {};
    for (const oi of existing.items) {
      oldQtyMap[oi.productId] = (oldQtyMap[oi.productId] || 0) + oi.quantity;
    }

    for (const item of items) {
      const prod = db.getProductById(item.productId);
      if (!prod) {
        return NextResponse.json(
          { success: false, message: `Product ID ${item.productId} does not exist` },
          { status: 400 }
        );
      }
      const oldQty = oldQtyMap[item.productId] || 0;
      const delta = item.quantity - oldQty; // how many MORE we need
      if (delta > 0 && prod.quantitySellable < delta) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for "${prod.name}". Available: ${prod.quantitySellable}, additional needed: ${delta}`,
          },
          { status: 400 }
        );
      }
    }

    // Recalculate totals server-side
    const TVA_RATE = 0.19;
    const subtotal = items.reduce((acc: number, it: any) => acc + it.totalPrice, 0);
    const taxAmount = hasTva ? Math.round(subtotal * TVA_RATE * 100) / 100 : 0;
    const totalAmount = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;

    const updated = db.updateFacture({
      id,
      hasTva: !!hasTva,
      subtotal,
      discountAmount: Number(discountAmount) || 0,
      taxAmount,
      totalAmount,
      notes,
      actorUserId,
      items: items.map((it: any) => ({
        productId: it.productId,
        quantity: Number(it.quantity),
        unitCost: Number(it.unitCost),
        unitPrice: Number(it.unitPrice),
        discount: Number(it.discount) || 0,
        totalPrice: Number(it.totalPrice),
      })),
    });

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, facture: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
