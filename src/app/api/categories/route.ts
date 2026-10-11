import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/categories — return all categories sorted alphabetically
export async function GET() {
  try {
    const categories = db.getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/categories — create a new category and sync to Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      );
    }

    // Prevent duplicates (case-insensitive)
    const existing = db.getCategories().find(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Category "${name.trim()}" already exists`, category: existing },
        { status: 409 }
      );
    }

    const category = db.createCategory(name.trim(), description?.trim() || undefined);
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
