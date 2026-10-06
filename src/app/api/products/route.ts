import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    const products = db.getProducts(search, categoryId);
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sku,
      barcode,
      name,
      categoryId,
      unitCost,
      sellingPrice,
      quantitySellable,
      quantityDamaged = 0,
      minStockThreshold = 5,
      taxRate = 20,
      imageUrl,
      actorUserId,
    } = body;

    if (!sku || !name || sellingPrice === undefined) {
      return NextResponse.json(
        { success: false, message: 'SKU, name, and selling price are mandatory' },
        { status: 400 }
      );
    }

    // Check duplicate SKU
    const existingSku = db.products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
    if (existingSku) {
      return NextResponse.json(
        { success: false, message: `Product with SKU "${sku}" already exists` },
        { status: 400 }
      );
    }

    const product = db.createProduct(
      {
        sku,
        barcode: barcode || null,
        name,
        categoryId: categoryId || null,
        unitCost: Number(unitCost) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        quantitySellable: Number(quantitySellable) || 0,
        quantityDamaged: Number(quantityDamaged) || 0,
        minStockThreshold: Number(minStockThreshold) || 5,
        taxRate: Number(taxRate) || 0,
        imageUrl: imageUrl || null,
      },
      actorUserId
    );

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, deltaQty, unitCost, sellingPrice, actorUserId } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });
    }

    const current = db.getProductById(id);
    if (!current) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const updates: any = {};
    if (deltaQty !== undefined) {
      updates.quantitySellable = Math.max(0, current.quantitySellable + Number(deltaQty));
    }
    if (unitCost !== undefined) {
      updates.unitCost = Number(unitCost);
    }
    if (sellingPrice !== undefined) {
      updates.sellingPrice = Number(sellingPrice);
    }

    const updated = db.updateProduct(id, updates, actorUserId);
    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
