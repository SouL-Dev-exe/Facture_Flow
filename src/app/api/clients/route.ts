import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({ success: true, clients: db.clients });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, address, taxNumber } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Client name is required' }, { status: 400 });
    }

    const newClient = {
      id: `client-${Date.now()}`,
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      taxNumber: taxNumber || null,
      balance: 0.0,
      createdAt: new Date().toISOString(),
    };

    db.clients.unshift(newClient);
    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
