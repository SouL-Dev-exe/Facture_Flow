import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const creditNotes = db.getCreditNotes();
    return NextResponse.json({ success: true, creditNotes });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { factureId, clientId, approvedByUserId, reason, items } = body;

    if (!factureId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Facture ID and returned items are required' },
        { status: 400 }
      );
    }

    const creditNote = db.createCreditNote({
      factureId,
      clientId,
      approvedByUserId,
      reason,
      items,
    });

    return NextResponse.json({ success: true, creditNote }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
