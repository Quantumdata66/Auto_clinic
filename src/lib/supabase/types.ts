/**
 * AUTO CLINIC — SUPABASE DATABASE TYPE DEFINITIONS
 * Auto-generated / mapped TypeScript definitions for PostgreSQL schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          icon_name: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          parent_id?: string | null;
          icon_name?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          parent_id?: string | null;
          icon_name?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          slug: string;
          category_id: string;
          short_description: string;
          full_description: string | null;
          price_cents: number;
          compare_at_price_cents: number | null;
          is_active: boolean;
          is_featured: boolean;
          specs: Json;
          compatibility: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          slug: string;
          category_id: string;
          short_description: string;
          full_description?: string | null;
          price_cents: number;
          compare_at_price_cents?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          specs?: Json;
          compatibility?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          slug?: string;
          category_id?: string;
          short_description?: string;
          full_description?: string | null;
          price_cents?: number;
          compare_at_price_cents?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          specs?: Json;
          compatibility?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          alt_text: string;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          alt_text: string;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          image_url?: string;
          alt_text?: string;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          quantity_on_hand: number;
          quantity_reserved: number;
          low_stock_threshold: number;
          allow_backorder: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity_on_hand?: number;
          quantity_reserved?: number;
          low_stock_threshold?: number;
          allow_backorder?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          quantity_on_hand?: number;
          quantity_reserved?: number;
          low_stock_threshold?: number;
          allow_backorder?: boolean;
          updated_at?: string;
        };
      };
      diagnostic_services: {
        Row: {
          id: string;
          code: string;
          name: string;
          slug: string;
          short_summary: string;
          full_description: string | null;
          estimated_duration: string;
          indicative_fee: string;
          target_systems: Json;
          recommended_when: string;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          slug: string;
          short_summary: string;
          full_description?: string | null;
          estimated_duration: string;
          indicative_fee?: string;
          target_systems?: Json;
          recommended_when: string;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          slug?: string;
          short_summary?: string;
          full_description?: string | null;
          estimated_duration?: string;
          indicative_fee?: string;
          target_systems?: Json;
          recommended_when?: string;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string | null;
          phone: string | null;
          whatsapp_number: string | null;
          first_name: string | null;
          last_name: string | null;
          is_guest: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email?: string | null;
          phone?: string | null;
          whatsapp_number?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          is_guest?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          email?: string | null;
          phone?: string | null;
          whatsapp_number?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          is_guest?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          channel: string;
          fulfilment_type: string;
          currency: string;
          subtotal_cents: number;
          shipping_cents: number;
          tax_cents: number;
          total_cents: number;
          shipping_address: Json | null;
          order_status: string;
          payment_status: string;
          payment_reference: string | null;
          customer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          channel?: string;
          fulfilment_type?: string;
          currency?: string;
          subtotal_cents: number;
          shipping_cents?: number;
          tax_cents?: number;
          total_cents: number;
          shipping_address?: Json | null;
          order_status?: string;
          payment_status?: string;
          payment_reference?: string | null;
          customer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          channel?: string;
          fulfilment_type?: string;
          currency?: string;
          subtotal_cents?: number;
          shipping_cents?: number;
          tax_cents?: number;
          total_cents?: number;
          shipping_address?: Json | null;
          order_status?: string;
          payment_status?: string;
          payment_reference?: string | null;
          customer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          sku_snapshot: string;
          product_name_snapshot: string;
          unit_price_cents_snapshot: number;
          quantity: number;
          line_total_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          sku_snapshot: string;
          product_name_snapshot: string;
          unit_price_cents_snapshot: number;
          quantity: number;
          line_total_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          sku_snapshot?: string;
          product_name_snapshot?: string;
          unit_price_cents_snapshot?: number;
          quantity?: number;
          line_total_cents?: number;
          created_at?: string;
        };
      };
      diagnostic_enquiries: {
        Row: {
          id: string;
          reference_code: string;
          customer_name: string;
          customer_email: string | null;
          customer_phone: string;
          customer_whatsapp: string | null;
          vehicle_make: string;
          vehicle_model: string;
          vehicle_year: string;
          vehicle_reg_or_vin: string | null;
          symptoms: string;
          requested_service_id: string | null;
          preferred_contact_method: string;
          status: string;
          staff_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_code: string;
          customer_name: string;
          customer_email?: string | null;
          customer_phone: string;
          customer_whatsapp?: string | null;
          vehicle_make: string;
          vehicle_model: string;
          vehicle_year: string;
          vehicle_reg_or_vin?: string | null;
          symptoms: string;
          requested_service_id?: string | null;
          preferred_contact_method?: string;
          status?: string;
          staff_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_code?: string;
          customer_name?: string;
          customer_email?: string | null;
          customer_phone?: string;
          customer_whatsapp?: string | null;
          vehicle_make?: string;
          vehicle_model?: string;
          vehicle_year?: string;
          vehicle_reg_or_vin?: string | null;
          symptoms?: string;
          requested_service_id?: string | null;
          preferred_contact_method?: string;
          status?: string;
          staff_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_roles: {
        Row: {
          id: string;
          auth_user_id: string;
          role: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
