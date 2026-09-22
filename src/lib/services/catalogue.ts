import { createServerClient } from "@/lib/supabase/server";
import {
  Category,
  Product,
  DiagnosticService,
  ProductSpec,
  calculateStockStatus,
} from "@/types";
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_DIAGNOSTIC_SERVICES,
} from "@/data/mockData";

export interface GetProductsOptions {
  categorySlug?: string;
  featuredOnly?: boolean;
  limit?: number;
  activeOnly?: boolean;
  search?: string;
}

export interface GetCategoriesOptions {
  activeOnly?: boolean;
}

/**
 * Checks if real Supabase environment variables are configured.
 */
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes("placeholder") &&
    !key.includes("placeholder")
  );
}

/**
 * Fetch all categories with optional active status filter and product counts.
 */
export async function getCategories(
  options: GetCategoriesOptions = { activeOnly: true }
): Promise<Category[]> {
  const { activeOnly = true } = options;

  if (!isSupabaseConfigured()) {
    return MOCK_CATEGORIES.filter((c) => (activeOnly ? c.isActive : true)).sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
  }

  try {
    const supabase = createServerClient();
    let query = supabase
      .from("categories")
      .select("*, products(count)")
      .order("display_order", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.warn("Supabase category query notice:", error?.message);
      return MOCK_CATEGORIES.filter((c) => (activeOnly ? c.isActive : true));
    }

    return (data as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || "",
      parentId: row.parent_id,
      iconName: row.icon_name || "Cpu",
      isActive: row.is_active,
      displayOrder: row.display_order,
      itemCount: row.products?.[0]?.count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.error("Database connection error in getCategories:", err);
    return MOCK_CATEGORIES.filter((c) => (activeOnly ? c.isActive : true));
  }
}

/**
 * Fetch a single category by its URL slug.
 */
export async function getCategoryBySlug(
  slug: string,
  options: { activeOnly?: boolean } = { activeOnly: true }
): Promise<Category | null> {
  const categories = await getCategories(options);
  return categories.find((c) => c.slug === slug) || null;
}

/**
 * Fetch products with relational category and inventory data.
 */
export async function getProducts(
  options: GetProductsOptions = { activeOnly: true }
): Promise<Product[]> {
  const {
    categorySlug,
    featuredOnly = false,
    limit,
    activeOnly = true,
    search,
  } = options;

  if (!isSupabaseConfigured()) {
    let list = [...MOCK_PRODUCTS];

    if (activeOnly) {
      list = list.filter((p) => p.isActive);
    }
    if (categorySlug) {
      list = list.filter((p) => p.categorySlug === categorySlug);
    }
    if (featuredOnly) {
      list = list.filter((p) => p.isFeatured);
    }
    if (search && search.trim().length > 0) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q)
      );
    }
    if (limit && limit > 0) {
      list = list.slice(0, limit);
    }
    return list;
  }

  try {
    const supabase = createServerClient();
    let query = supabase
      .from("products")
      .select(`
        *,
        categories!inner ( id, name, slug, is_active ),
        inventory ( quantity_on_hand, quantity_reserved, low_stock_threshold, allow_backorder ),
        product_images ( id, image_url, alt_text, sort_order, is_primary )
      `)
      .order("created_at", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true).eq("categories.is_active", true);
    }
    if (categorySlug) {
      query = query.eq("categories.slug", categorySlug);
    }
    if (featuredOnly) {
      query = query.eq("is_featured", true);
    }
    if (search && search.trim().length > 0) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,short_description.ilike.%${search}%`);
    }
    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.warn("Supabase products query notice:", error?.message);
      return MOCK_PRODUCTS.filter((p) => (activeOnly ? p.isActive : true));
    }

    return (data as any[]).map((row) => {
      const inv = row.inventory?.[0] || {
        quantity_on_hand: 0,
        quantity_reserved: 0,
        low_stock_threshold: 5,
        allow_backorder: false,
      };

      const stockStatus = calculateStockStatus(
        inv.quantity_on_hand,
        inv.quantity_reserved,
        inv.low_stock_threshold,
        inv.allow_backorder
      );

      const specs: ProductSpec[] = Array.isArray(row.specs) ? row.specs : [];
      const compatibility: string[] = Array.isArray(row.compatibility) ? row.compatibility : [];

      return {
        id: row.id,
        sku: row.sku,
        name: row.name,
        slug: row.slug,
        categoryId: row.category_id,
        categorySlug: row.categories?.slug || "",
        categoryName: row.categories?.name || "",
        shortDescription: row.short_description,
        fullDescription: row.full_description || undefined,
        priceCents: Number(row.price_cents),
        compareAtPriceCents: row.compare_at_price_cents ? Number(row.compare_at_price_cents) : undefined,
        isActive: row.is_active,
        isFeatured: row.is_featured,
        stockStatus,
        stockQuantity: Math.max(0, inv.quantity_on_hand - inv.quantity_reserved),
        allowBackorder: inv.allow_backorder,
        specs,
        compatibility,
        imageUrl: row.product_images?.find((img: any) => img.is_primary)?.image_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  } catch (err) {
    console.error("Database connection error in getProducts:", err);
    return MOCK_PRODUCTS.filter((p) => (activeOnly ? p.isActive : true));
  }
}

/**
 * Fetch a single product by slug with full relational data.
 */
export async function getProductBySlug(
  slug: string,
  options: { activeOnly?: boolean } = { activeOnly: true }
): Promise<Product | null> {
  const { activeOnly = true } = options;

  if (!isSupabaseConfigured()) {
    const p = MOCK_PRODUCTS.find((item) => item.slug === slug);
    if (!p) return null;
    if (activeOnly && !p.isActive) return null;
    return p;
  }

  try {
    const supabase = createServerClient();
    let query = supabase
      .from("products")
      .select(`
        *,
        categories!inner ( id, name, slug, is_active ),
        inventory ( quantity_on_hand, quantity_reserved, low_stock_threshold, allow_backorder ),
        product_images ( id, image_url, alt_text, sort_order, is_primary )
      `)
      .eq("slug", slug);

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      const p = MOCK_PRODUCTS.find((item) => item.slug === slug);
      if (!p) return null;
      if (activeOnly && !p.isActive) return null;
      return p;
    }

    const row = data as any;
    const inv = row.inventory?.[0] || {
      quantity_on_hand: 0,
      quantity_reserved: 0,
      low_stock_threshold: 5,
      allow_backorder: false,
    };

    const stockStatus = calculateStockStatus(
      inv.quantity_on_hand,
      inv.quantity_reserved,
      inv.low_stock_threshold,
      inv.allow_backorder
    );

    const specs: ProductSpec[] = Array.isArray(row.specs) ? row.specs : [];
    const compatibility: string[] = Array.isArray(row.compatibility) ? row.compatibility : [];

    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      slug: row.slug,
      categoryId: row.category_id,
      categorySlug: row.categories?.slug || "",
      categoryName: row.categories?.name || "",
      shortDescription: row.short_description,
      fullDescription: row.full_description || undefined,
      priceCents: Number(row.price_cents),
      compareAtPriceCents: row.compare_at_price_cents ? Number(row.compare_at_price_cents) : undefined,
      isActive: row.is_active,
      isFeatured: row.is_featured,
      stockStatus,
      stockQuantity: Math.max(0, inv.quantity_on_hand - inv.quantity_reserved),
      allowBackorder: inv.allow_backorder,
      specs,
      compatibility,
      imageUrl: row.product_images?.find((img: any) => img.is_primary)?.image_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.error("Database error in getProductBySlug:", err);
    return MOCK_PRODUCTS.find((item) => item.slug === slug) || null;
  }
}

/**
 * Fetch diagnostic services.
 */
export async function getDiagnosticServices(
  options: { activeOnly?: boolean } = { activeOnly: true }
): Promise<DiagnosticService[]> {
  const { activeOnly = true } = options;

  if (!isSupabaseConfigured()) {
    return MOCK_DIAGNOSTIC_SERVICES.filter((s) => (activeOnly ? s.isActive : true)).sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
  }

  try {
    const supabase = createServerClient();
    let query = supabase
      .from("diagnostic_services")
      .select("*")
      .order("display_order", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error || !data) {
      return MOCK_DIAGNOSTIC_SERVICES.filter((s) => (activeOnly ? s.isActive : true));
    }

    return (data as any[]).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      slug: row.slug,
      shortSummary: row.short_summary,
      fullDescription: row.full_description || undefined,
      estimatedDuration: row.estimated_duration,
      indicativeFee: row.indicative_fee,
      targetSystems: Array.isArray(row.target_systems) ? row.target_systems : [],
      recommendedWhen: row.recommended_when,
      isActive: row.is_active,
      displayOrder: row.display_order,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("Database error in getDiagnosticServices:", err);
    return MOCK_DIAGNOSTIC_SERVICES.filter((s) => (activeOnly ? s.isActive : true));
  }
}
