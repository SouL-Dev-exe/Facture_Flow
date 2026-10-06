import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const logs = db.getDamagedLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, userId, quantityWrittenOff, reason, notes } = body;

    if (!productId || !quantityWrittenOff || quantityWrittenOff <= 0 || !reason) {
      return NextResponse.json(
        { success: false, message: 'Product ID, valid positive quantity, and reason are required' },
        { status: 400 }
      );
    }

    const log = db.writeOffDamaged({
      productId,
      userId,
      quantityWrittenOff: Number(quantityWrittenOff),
      reason,
      notes,
    });

    return NextResponse.json({ success: true, log }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
