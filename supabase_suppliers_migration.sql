-- ============================================================
-- Supplier Directory & Purchase Orders Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS suppliers (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  contact_person   TEXT,
  phone            TEXT,
  email            TEXT,
  address          TEXT,
  nif              TEXT,
  nis              TEXT,
  payment_terms    TEXT NOT NULL DEFAULT 'net_30'
                   CHECK (payment_terms IN ('immediate', 'net_30', 'net_60', 'net_90')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                 TEXT PRIMARY KEY,
  po_number          TEXT NOT NULL UNIQUE,
  supplier_id        TEXT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  invoice_reference  TEXT,
  total_amount       NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'received')),
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at        TIMESTAMPTZ
);

-- 3. PURCHASE ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                  TEXT PRIMARY KEY,
  purchase_order_id   TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id          TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_cost           NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_cost          NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier   ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status     ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_items_order             ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product           ON purchase_order_items(product_id);

-- 5. ROW LEVEL SECURITY (Optional — disable for development)
-- ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_orders    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Done! Tables created successfully.
