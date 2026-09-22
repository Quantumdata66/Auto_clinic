import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductCard } from "@/components/commerce/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/services/catalogue";

export async function generateStaticParams() {
  const categories = await getCategories({ activeOnly: true });
  return categories.map((cat) => ({
    category: cat.slug,
  }));
}

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug, { activeOnly: true });

  if (!category) {
    return notFound();
  }

  const categoryProducts = await getProducts({
    categorySlug,
    activeOnly: true,
  });

  return (
    <PageContainer
      title={category.name}
      subtitle={category.description}
      breadcrumbs={[
        { label: "Store Catalog", href: "/shop" },
        { label: category.name },
      ]}
      maxWidth="wide"
    >
      {categoryProducts.length > 0 ? (
        <div className="ac-grid ac-grid-3">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="NO PRODUCTS FOUND IN THIS DIVISION"
          description="Additional automotive equipment is currently undergoing workshop cataloguing. Check back shortly or make a custom enquiry."
          actionLabel="Return to Full Catalog"
          actionHref="/shop"
        />
      )}
    </PageContainer>
  );
}
