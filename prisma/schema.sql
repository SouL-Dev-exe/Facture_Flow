-- ==============================================================================
-- FACTUREFLOW COMPLETE PRODUCTION DATABASE DDL (PostgreSQL)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS & RBAC TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    pin_code VARCHAR(10), -- 4-digit PIN for manager authorization
    role VARCHAR(20) NOT NULL DEFAULT 'cashier', -- 'admin', 'manager', 'cashier'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 3. PRODUCTS & INVENTORY
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    quantity_sellable INT NOT NULL DEFAULT 0 CHECK (quantity_sellable >= 0),
    quantity_damaged INT NOT NULL DEFAULT 0 CHECK (quantity_damaged >= 0),
    min_stock_threshold INT DEFAULT 5,
    tax_rate DECIMAL(5,2) DEFAULT 20.00,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CLIENTS & B2B ACCOUNTS
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    address TEXT,
    tax_number VARCHAR(50), -- IF / ICE / VAT Number
    balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. FACTURES (INVOICES & POS TRANSACTIONS)
CREATE TABLE IF NOT EXISTS factures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'paid', -- 'draft', 'unpaid', 'partially_paid', 'paid', 'returned'
    payment_method VARCHAR(30) DEFAULT 'cash', -- 'cash', 'card', 'bank_transfer', 'cheque'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. FACTURE LINE ITEMS
CREATE TABLE IF NOT EXISTS facture_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facture_id UUID REFERENCES factures(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(12,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0.00,
    total_price DECIMAL(12,2) NOT NULL
);

-- 7. CREDIT NOTES / RETURNS (AVOIR)
CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_number VARCHAR(50) UNIQUE NOT NULL,
    facture_id UUID REFERENCES factures(id) ON DELETE RESTRICT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    total_refund_amount DECIMAL(12,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. CREDIT NOTE ITEMS (WITH SMART STOCK ROUTING)
CREATE TABLE IF NOT EXISTS credit_note_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_id UUID REFERENCES credit_notes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity_returned INT NOT NULL CHECK (quantity_returned > 0),
    unit_refund_price DECIMAL(12,2) NOT NULL,
    restock_destination VARCHAR(20) NOT NULL DEFAULT 'sellable', -- 'sellable' OR 'damaged'
    total_refund DECIMAL(12,2) NOT NULL
);

-- 9. DAMAGED GOODS & WRITE-OFF LOG
CREATE TABLE IF NOT EXISTS damaged_stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    quantity_written_off INT NOT NULL CHECK (quantity_written_off > 0),
    cost_loss_value DECIMAL(12,2) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. SYSTEM AUDIT LOGS (IMMUTABLE AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. DAILY HISTORICAL STOCK SNAPSHOTS (MIDNIGHT CRON RECORD)
CREATE TABLE IF NOT EXISTS daily_stock_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE UNIQUE NOT NULL,
    total_items_count INT NOT NULL,
    total_stock_qty INT NOT NULL,
    total_cost_valuation DECIMAL(15,2) NOT NULL,
    total_retail_valuation DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_factures_number ON factures(invoice_number);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_created ON factures(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_notes_facture ON credit_notes(facture_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON daily_stock_snapshots(snapshot_date);
