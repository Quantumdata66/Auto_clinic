-- ============================================================================
-- AUTO CLINIC — STAFF RBAC, AUDIT, & SECURE OPERATIONAL POLICIES (PHASE 5)
-- Migration: 20260923000002_staff_rbac_and_notes.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SECURITY DEFINER AUTHORIZATION HELPERS
-- ----------------------------------------------------------------------------

-- Helper 1: Check active staff privileges (SUPERADMIN, STAFF, TECHNICIAN)
CREATE OR REPLACE FUNCTION public.is_active_staff(p_auth_user_id UUID)
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

-- Helper 2: Check active superadmin privileges
CREATE OR REPLACE FUNCTION public.is_superadmin(p_auth_user_id UUID)
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
    AND role = 'SUPERADMIN'
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. LEAST-PRIVILEGE FUNCTION EXECUTION GRANTS
-- ----------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.is_active_staff(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_active_staff(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_active_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_staff(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.is_superadmin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_superadmin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO service_role;

-- ----------------------------------------------------------------------------
-- 3. DIAGNOSTIC ENQUIRIES RLS POLICIES (AUTHENTICATED STAFF ONLY)
-- ----------------------------------------------------------------------------

CREATE POLICY "Staff can view all diagnostic enquiries"
  ON diagnostic_enquiries FOR SELECT
  TO authenticated
  USING (
    public.is_active_staff(auth.uid())
  );

CREATE POLICY "Staff can update diagnostic enquiry status and notes"
  ON diagnostic_enquiries FOR UPDATE
  TO authenticated
  USING (
    public.is_active_staff(auth.uid())
  )
  WITH CHECK (
    public.is_active_staff(auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 4. ORDERS & ORDER ITEMS RLS POLICIES (AUTHENTICATED STAFF ONLY)
-- ----------------------------------------------------------------------------

CREATE POLICY "Staff can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    public.is_active_staff(auth.uid())
  );

CREATE POLICY "Staff can update order status and fulfilment"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    public.is_active_staff(auth.uid())
  )
  WITH CHECK (
    public.is_active_staff(auth.uid())
  );

CREATE POLICY "Staff can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    public.is_active_staff(auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 5. CUSTOMER RECORDS RLS POLICIES (AUTHENTICATED STAFF ONLY)
-- ----------------------------------------------------------------------------

CREATE POLICY "Staff can view customer records"
  ON customers FOR SELECT
  TO authenticated
  USING (
    public.is_active_staff(auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 6. ADMIN ROLES RLS POLICIES (AUTHENTICATED STAFF READ-ONLY DIRECTORY)
-- ----------------------------------------------------------------------------

CREATE POLICY "Staff can view admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    public.is_active_staff(auth.uid())
  );
