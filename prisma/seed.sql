-- ==============================================================================
-- FACTUREFLOW COMPLETE PRODUCTION DATABASE SEED DATA (PostgreSQL)
-- ==============================================================================

-- 1. SEED USERS (Password hashes are bcrypt representations, demo PINs included)
INSERT INTO users (id, full_name, email, password_hash, pin_code, role, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'Sarah Connor', 'admin@factureflow.com', '$2a$12$eX8mJ5...dummy_hash', '1234', 'admin', NOW() - INTERVAL '90 days'),
('a0000000-0000-0000-0000-000000000002', 'Alex Vance', 'manager@factureflow.com', '$2a$12$eX8mJ5...dummy_hash', '9999', 'manager', NOW() - INTERVAL '60 days'),
('a0000000-0000-0000-0000-000000000003', 'John Doe', 'cashier@factureflow.com', '$2a$12$eX8mJ5...dummy_hash', '0000', 'cashier', NOW() - INTERVAL '30 days')
ON CONFLICT (email) DO NOTHING;

-- 2. SEED CATEGORIES
INSERT INTO categories (id, name, description) VALUES
('b0000000-0000-0000-0000-000000000001', 'Laptops & Computers', 'Ultrabooks, workstations and accessories'),
('b0000000-0000-0000-0000-000000000002', 'Smartphones & Tablets', 'Mobile devices, cases and chargers'),
('b0000000-0000-0000-0000-000000000003', 'Audio & Acoustics', 'Studio monitors, noise-canceling headphones'),
('b0000000-0000-0000-0000-000000000004', 'Gaming Peripherals', 'Mechanical keyboards, gaming mice, controllers'),
('b0000000-0000-0000-0000-000000000005', 'Office & Networking', 'Routers, printers, thermal papers and cables')
ON CONFLICT (name) DO NOTHING;

-- 3. SEED PRODUCTS
INSERT INTO products (id, sku, barcode, name, category_id, unit_cost, selling_price, quantity_sellable, quantity_damaged, min_stock_threshold, tax_rate, image_url, created_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'LAP-MBP-14', '89345001', 'MacBook Pro 14" M3 Pro 18GB/512GB Space Black', 'b0000000-0000-0000-0000-000000000001', 1650.00, 1999.00, 18, 1, 5, 20.00, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60', NOW() - INTERVAL '45 days'),
('c0000000-0000-0000-0000-000000000002', 'LAP-DELL-XPS15', '89345002', 'Dell XPS 15 OLED Core i7 32GB/1TB SSD', 'b0000000-0000-0000-0000-000000000001', 1400.00, 1749.00, 8, 0, 4, 20.00, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60', NOW() - INTERVAL '40 days'),
('c0000000-0000-0000-0000-000000000003', 'PHN-IPH15-PRO', '89345003', 'iPhone 15 Pro Max 256GB Natural Titanium', 'b0000000-0000-0000-0000-000000000002', 920.00, 1199.00, 24, 2, 10, 20.00, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60', NOW() - INTERVAL '35 days'),
('c0000000-0000-0000-0000-000000000004', 'PHN-SGS24-ULT', '89345004', 'Samsung Galaxy S24 Ultra 512GB Titanium Gray', 'b0000000-0000-0000-0000-000000000002', 950.00, 1249.00, 14, 0, 6, 20.00, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60', NOW() - INTERVAL '30 days'),
('c0000000-0000-0000-0000-000000000005', 'AUD-SONY-WH1000', '89345005', 'Sony WH-1000XM5 Wireless Noise Canceling Headphones', 'b0000000-0000-0000-0000-000000000003', 260.00, 379.00, 3, 1, 5, 20.00, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60', NOW() - INTERVAL '25 days'),
('c0000000-0000-0000-0000-000000000006', 'AUD-AP-PRO2', '89345006', 'Apple AirPods Pro 2nd Gen USB-C MagSafe', 'b0000000-0000-0000-0000-000000000003', 175.00, 249.00, 32, 0, 8, 20.00, 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=60', NOW() - INTERVAL '20 days'),
('c0000000-0000-0000-0000-000000000007', 'GAM-KEY-LOGI-G915', '89345007', 'Logitech G915 LIGHTSPEED Wireless RGB Mechanical Keyboard', 'b0000000-0000-0000-0000-000000000004', 140.00, 219.00, 0, 2, 5, 20.00, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60', NOW() - INTERVAL '15 days'),
('c0000000-0000-0000-0000-000000000008', 'GAM-MOU-LOGI-GPX', '89345008', 'Logitech G PRO X Superlight 2 Wireless Gaming Mouse', 'b0000000-0000-0000-0000-000000000004', 95.00, 159.00, 19, 0, 6, 20.00, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60', NOW() - INTERVAL '12 days'),
('c0000000-0000-0000-0000-000000000009', 'OFF-ROU-UBI-UDR', '89345009', 'Ubiquiti UniFi Dream Router WiFi 6 PoE Gateway', 'b0000000-0000-0000-0000-000000000005', 145.00, 219.00, 7, 0, 3, 20.00, 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=60', NOW() - INTERVAL '10 days'),
('c0000000-0000-0000-0000-000000000010', 'OFF-THM-PAP-80MM', '89345010', 'Thermal Receipt Paper Roll 80mm x 80m (Box of 20)', 'b0000000-0000-0000-0000-000000000005', 18.00, 34.50, 45, 1, 15, 20.00, 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60', NOW() - INTERVAL '8 days')
ON CONFLICT (sku) DO NOTHING;

-- 4. SEED CLIENTS
INSERT INTO clients (id, name, phone, email, address, tax_number, balance, created_at) VALUES
('d0000000-0000-0000-0000-000000000001', 'Atlas Digital Solutions SARL', '+212 522 984 321', 'contact@atlasdigital.ma', 'Boulevard d’Anfa, Casablanca, Morocco', 'IF-40192834-ICE-002938172000094', 0.00, NOW() - INTERVAL '60 days'),
('d0000000-0000-0000-0000-000000000002', 'Apex Retail Group Ltd', '+33 1 42 68 55 00', 'procurement@apexretail.eu', '14 Rue de la Paix, 75002 Paris, France', 'FR-84930291039', 450.00, NOW() - INTERVAL '45 days'),
('d0000000-0000-0000-0000-000000000003', 'OmniTech Logistics', '+1 415 890 2314', 'billing@omnitechlogistics.io', '400 Market Street, San Francisco, CA 94105', 'US-EIN-94-3829102', 0.00, NOW() - INTERVAL '30 days'),
('d0000000-0000-0000-0000-000000000004', 'Comptoir / Walk-in Customer', NULL, 'walkin@factureflow.local', 'Direct POS Retail Counter', NULL, 0.00, NOW() - INTERVAL '90 days')
ON CONFLICT (id) DO NOTHING;

-- 5. SEED FACTURES (INVOICES)
INSERT INTO factures (id, invoice_number, client_id, user_id, subtotal, discount_amount, tax_amount, total_amount, status, payment_method, notes, created_at) VALUES
('e0000000-0000-0000-0000-000000000001', 'FAC-2024-00101', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 3998.00, 100.00, 779.60, 4677.60, 'paid', 'bank_transfer', 'Order dispatched with courier insurance.', NOW() - INTERVAL '5 days'),
('e0000000-0000-0000-0000-000000000002', 'FAC-2024-00102', 'd0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 379.00, 0.00, 75.80, 454.80, 'returned', 'cash', 'In-store POS counter checkout.', NOW() - INTERVAL '2 days'),
('e0000000-0000-0000-0000-000000000003', 'FAC-2024-00103', 'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2447.00, 50.00, 479.40, 2876.40, 'paid', 'card', 'Includes expedited warranty handling.', NOW() - INTERVAL '1 days')
ON CONFLICT (invoice_number) DO NOTHING;

-- 6. SEED FACTURE ITEMS
INSERT INTO facture_items (id, facture_id, product_id, quantity, unit_cost, unit_price, discount, total_price) VALUES
('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 2, 1650.00, 1999.00, 100.00, 3898.00),
('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 1, 260.00, 379.00, 0.00, 379.00),
('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 2, 920.00, 1199.00, 50.00, 2348.00),
('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', 1, 175.00, 249.00, 0.00, 249.00)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED CREDIT NOTES (AVOIR)
INSERT INTO credit_notes (id, credit_note_number, facture_id, client_id, approved_by_user_id, total_refund_amount, reason, created_at) VALUES
('10000000-0000-0000-0000-000000000001', 'AVR-2024-0001', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 454.80, 'Customer returned unopened headphones for store credit.', NOW() - INTERVAL '1 days')
ON CONFLICT (credit_note_number) DO NOTHING;

-- 8. SEED CREDIT NOTE ITEMS
INSERT INTO credit_note_items (id, credit_note_id, product_id, quantity_returned, unit_refund_price, restock_destination, total_refund) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 1, 379.00, 'sellable', 379.00)
ON CONFLICT (id) DO NOTHING;

-- 9. SEED DAMAGED STOCK LOGS
INSERT INTO damaged_stock_logs (id, product_id, user_id, quantity_written_off, cost_loss_value, reason, notes, created_at) VALUES
('30000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 1, 1650.00, 'Water spill during storage rack maintenance', 'Inspected and certified unusable. Sent to scrap recycling.', NOW() - INTERVAL '15 days'),
('30000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 2, 280.00, 'Internal PCB short circuit / Supplier defect', 'Claim submitted to vendor warranty portal.', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- 10. SEED AUDIT LOGS
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at) VALUES
('40000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'ROOT', NULL, '{"version": "1.0.0", "status": "ready"}', '127.0.0.1', NOW() - INTERVAL '90 days'),
('40000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'APPROVE_RETURN', 'CREDIT_NOTE', 'AVR-2024-0001', '{"facture": "FAC-2024-00102", "status": "paid"}', '{"refund": 454.80, "destination": "sellable"}', '192.168.1.45', NOW() - INTERVAL '1 days'),
('40000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'WRITE_OFF_DAMAGED', 'PRODUCT', 'LAP-MBP-14', '{"quantitySellable": 19, "quantityDamaged": 0}', '{"quantitySellable": 18, "quantityDamaged": 1, "lossValue": 1650.00}', '192.168.1.45', NOW() - INTERVAL '15 days'),
('40000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'PRICE_OVERRIDE', 'POS_CART_ITEM', 'LAP-MBP-14', '{"standardPrice": 1999.00}', '{"approvedDiscount": 100.00, "overridePrice": 1899.00}', '192.168.1.45', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 11. SEED DAILY HISTORICAL SNAPSHOTS (YoY & Month-over-Month Baseline)
INSERT INTO daily_stock_snapshots (id, snapshot_date, total_items_count, total_stock_qty, total_cost_valuation, total_retail_valuation, created_at) VALUES
('50000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '365 days', 7, 85, 48500.00, 64200.00, NOW() - INTERVAL '365 days'),
('50000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '30 days', 9, 110, 72100.00, 95400.00, NOW() - INTERVAL '30 days'),
('50000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '7 days', 10, 135, 86400.00, 115200.00, NOW() - INTERVAL '7 days'),
('50000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '1 days', 10, 142, 90210.00, 120890.00, NOW() - INTERVAL '1 days'),
('50000000-0000-0000-0000-000000000005', CURRENT_DATE, 10, 145, 92840.00, 124350.00, NOW())
ON CONFLICT (snapshot_date) DO NOTHING;
