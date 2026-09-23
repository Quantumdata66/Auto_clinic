-- ============================================================================
-- AUTO CLINIC — ATOMIC ORDER PLACEMENT & DATABASE IDEMPOTENCY MIGRATION
-- Migration: 20260923000001_atomic_order_and_idempotency.sql
-- ============================================================================

-- 1. Add unique idempotency_key to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);

-- 2. Atomic Order Placement Stored Procedure with Row-Level Inventory Locking
-- Prevents race conditions, overselling, and partial-failure inconsistencies.
CREATE OR REPLACE FUNCTION place_order_atomic(
  p_order_id UUID,
  p_order_number VARCHAR(100),
  p_idempotency_key VARCHAR(100),
  p_customer_first_name VARCHAR(100),
  p_customer_last_name VARCHAR(100),
  p_customer_email VARCHAR(255),
  p_customer_phone VARCHAR(50),
  p_customer_whatsapp VARCHAR(50),
  p_channel VARCHAR(50),
  p_fulfilment_type VARCHAR(50),
  p_currency VARCHAR(10),
  p_subtotal_cents BIGINT,
  p_shipping_cents BIGINT,
  p_tax_cents BIGINT,
  p_total_cents BIGINT,
  p_shipping_address JSONB,
  p_customer_notes TEXT,
  p_items JSONB -- Array of { productId, skuSnapshot, productNameSnapshot, unitPriceCentsSnapshot, quantity, lineTotalCents }
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_order orders%ROWTYPE;
  v_customer_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
  v_inv_on_hand INTEGER;
  v_inv_reserved INTEGER;
  v_allow_backorder BOOLEAN;
  v_prod_active BOOLEAN;
  v_prod_price BIGINT;
  v_calculated_subtotal BIGINT := 0;
  v_returned_order JSONB;
BEGIN
  -- 1. Idempotency Check: Return existing order if key was already processed
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_order
    FROM orders
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'order_status', v_existing_order.order_status,
        'payment_status', v_existing_order.payment_status,
        'is_idempotent_replay', true
      );
    END IF;
  END IF;

  -- 2. Validate Items Array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'ORDER_EMPTY: Order must contain at least one item.';
  END IF;

  -- 3. Row-Level Inventory Locking & Stock Validation
  -- Lock inventory rows in deterministic order (by product_id) to prevent deadlocks
  FOR v_item IN
    SELECT value FROM jsonb_array_elements(p_items) ORDER BY (value->>'productId')
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_qty := (v_item->>'quantity')::INTEGER;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY: Item quantity must be greater than zero.';
    END IF;

    -- Verify product is active and lock inventory row FOR UPDATE
    SELECT is_active, price_cents INTO v_prod_active, v_prod_price
    FROM products
    WHERE id = v_product_id;

    IF NOT FOUND OR v_prod_active IS NOT TRUE THEN
      RAISE EXCEPTION 'PRODUCT_UNAVAILABLE: Product % is not available.', v_product_id;
    END IF;

    SELECT quantity_on_hand, quantity_reserved, allow_backorder
    INTO v_inv_on_hand, v_inv_reserved, v_allow_backorder
    FROM inventory
    WHERE product_id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVENTORY_NOT_FOUND: Inventory record missing for product %.', v_product_id;
    END IF;

    -- Stock Invariant Check
    IF (v_inv_on_hand - v_inv_reserved) < v_qty AND v_allow_backorder IS NOT TRUE THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: Insufficient stock for product %. Available: %, Requested: %',
        v_product_id, (v_inv_on_hand - v_inv_reserved), v_qty;
    END IF;

    v_calculated_subtotal := v_calculated_subtotal + (v_prod_price * v_qty);
  END LOOP;

  -- 4. Upsert Customer Record
  INSERT INTO customers (
    email,
    phone,
    whatsapp_number,
    first_name,
    last_name,
    is_guest
  )
  VALUES (
    LOWER(TRIM(p_customer_email)),
    TRIM(p_customer_phone),
    NULLIF(TRIM(p_customer_whatsapp), ''),
    TRIM(p_customer_first_name),
    TRIM(p_customer_last_name),
    true
  )
  RETURNING id INTO v_customer_id;

  -- 5. Insert Orders Record
  INSERT INTO orders (
    id,
    order_number,
    idempotency_key,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    channel,
    fulfilment_type,
    currency,
    subtotal_cents,
    shipping_cents,
    tax_cents,
    total_cents,
    shipping_address,
    order_status,
    payment_status,
    customer_notes
  )
  VALUES (
    COALESCE(p_order_id, gen_random_uuid()),
    p_order_number,
    p_idempotency_key,
    v_customer_id,
    TRIM(p_customer_first_name) || ' ' || TRIM(p_customer_last_name),
    LOWER(TRIM(p_customer_email)),
    TRIM(p_customer_phone),
    COALESCE(p_channel, 'ONLINE_CHECKOUT'),
    COALESCE(p_fulfilment_type, 'DELIVERY'),
    COALESCE(p_currency, 'NGN'),
    v_calculated_subtotal,
    COALESCE(p_shipping_cents, 0),
    COALESCE(p_tax_cents, 0),
    v_calculated_subtotal + COALESCE(p_shipping_cents, 0) + COALESCE(p_tax_cents, 0),
    p_shipping_address,
    'PENDING',
    'UNPAID',
    p_customer_notes
  );

  -- 6. Insert Order Items & Update Inventory Reservations
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_qty := (v_item->>'quantity')::INTEGER;

    -- Insert snapshot item
    INSERT INTO order_items (
      id,
      order_id,
      product_id,
      sku_snapshot,
      product_name_snapshot,
      unit_price_cents_snapshot,
      quantity,
      line_total_cents
    )
    VALUES (
      gen_random_uuid(),
      COALESCE(p_order_id, (SELECT id FROM orders WHERE order_number = p_order_number)),
      v_product_id,
      v_item->>'skuSnapshot',
      v_item->>'productNameSnapshot',
      (v_item->>'unitPriceCentsSnapshot')::BIGINT,
      v_qty,
      (v_item->>'unitPriceCentsSnapshot')::BIGINT * v_qty
    );

    -- Increment quantity_reserved atomically
    UPDATE inventory
    SET quantity_reserved = quantity_reserved + v_qty,
        updated_at = now()
    WHERE product_id = v_product_id;
  END LOOP;

  -- 7. Return Result
  RETURN jsonb_build_object(
    'success', true,
    'order_number', p_order_number,
    'order_status', 'PENDING',
    'payment_status', 'UNPAID',
    'total_cents', v_calculated_subtotal + COALESCE(p_shipping_cents, 0) + COALESCE(p_tax_cents, 0),
    'is_idempotent_replay', false
  );
END;
$$;

-- Restrict RPC execution: Do not grant EXECUTE to public/anon.
REVOKE EXECUTE ON FUNCTION place_order_atomic FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION place_order_atomic FROM anon;
GRANT EXECUTE ON FUNCTION place_order_atomic TO service_role;
