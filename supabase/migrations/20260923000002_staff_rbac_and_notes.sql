-- ============================================================================
-- AUTO CLINIC — STAFF RBAC, AUDIT, & SECURE OPERATIONAL POLICIES (PHASE 5)
-- Migration: 20260923000002_staff_rbac_and_notes.sql
-- ============================================================================

-- 1. Helper function to check if a user possesses active staff privileges
CREATE OR REPLACE FUNCTION is_active_staff(p_auth_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE auth_user_id = p_auth_user_id
    AND is_active = true
    AND role IN ('SUPERADMIN', 'STAFF', 'TECHNICIAN')
  );
END;
$$;

-- 2. Diagnostic Enquiries RLS Policies for Staff
CREATE POLICY "Staff can view all diagnostic enquiries"
  ON diagnostic_enquiries FOR SELECT
  USING (
    is_active_staff(auth.uid())
  );

CREATE POLICY "Staff can update diagnostic enquiry status and notes"
  ON diagnostic_enquiries FOR UPDATE
  USING (
    is_active_staff(auth.uid())
  )
  WITH CHECK (
    is_active_staff(auth.uid())
  );

-- 3. Orders & Order Items RLS Policies for Staff
CREATE POLICY "Staff can view all orders"
  ON orders FOR SELECT
  USING (
    is_active_staff(auth.uid())
  );

CREATE POLICY "Staff can update order status and fulfilment"
  ON orders FOR UPDATE
  USING (
    is_active_staff(auth.uid())
  )
  WITH CHECK (
    is_active_staff(auth.uid())
  );

CREATE POLICY "Staff can view all order items"
  ON order_items FOR SELECT
  USING (
    is_active_staff(auth.uid())
  );

-- 4. Customer Records RLS Policies for Staff
CREATE POLICY "Staff can view customer records"
  ON customers FOR SELECT
  USING (
    is_active_staff(auth.uid())
  );

-- 5. Admin Roles RLS Policies (Superadmin only for modification)
CREATE POLICY "Staff can view admin roles"
  ON admin_roles FOR SELECT
  USING (
    is_active_staff(auth.uid())
  );

CREATE POLICY "Superadmins can manage admin roles"
  ON admin_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE auth_user_id = auth.uid()
      AND is_active = true
      AND role = 'SUPERADMIN'
    )
  );
