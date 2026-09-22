import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductCard } from "@/components/commerce/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/data/mockData";

export async function generateStaticParams() {
  return MOCK_CATEGORIES.map((cat) => ({
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
  const category = MOCK_CATEGORIES.find((c) => c.slug === categorySlug);

  if (!category) {
    return notFound();
  }

  const categoryProducts = MOCK_PRODUCTS.filter((p) => p.categorySlug === categorySlug);

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
