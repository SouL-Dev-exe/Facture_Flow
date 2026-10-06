import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const facture = db.getFactureById(id);
      if (!facture) {
        return NextResponse.json({ success: false, message: 'Facture not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, facture });
    }

    const factures = db.getFactures();
    return NextResponse.json({ success: true, factures });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientId,
      userId,
      items,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentMethod = 'cash',
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Invoice must contain at least 1 item' }, { status: 400 });
    }

    // Safety check: Validate available sellable stock
    for (const item of items) {
      const prod = db.getProductById(item.productId);
      if (!prod) {
        return NextResponse.json({ success: false, message: `Product ID ${item.productId} does not exist` }, { status: 400 });
      }
      if (prod.quantitySellable < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for "${prod.name}". Available: ${prod.quantitySellable}, requested: ${item.quantity}`,
          },
          { status: 400 }
        );
      }
    }

    const facture = db.createFacture({
      clientId,
      userId,
      items,
      subtotal: Number(subtotal) || 0,
      discountAmount: Number(discountAmount) || 0,
      taxAmount: Number(taxAmount) || 0,
      totalAmount: Number(totalAmount) || 0,
      paymentMethod,
      notes,
    });

    return NextResponse.json({ success: true, facture }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
