import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingCart, MessageCircle, Wrench, ShieldCheck, Truck, Store, CheckCircle2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PriceDisplay } from "@/components/commerce/PriceDisplay";
import { StockBadge } from "@/components/commerce/StockBadge";
import { TechnicalSpecBlock } from "@/components/workshop/TechnicalSpecBlock";
import { Button } from "@/components/ui/Button";
import { getProductBySlug, getProducts } from "@/lib/services/catalogue";
import styles from "./ProductDetail.module.css";

export async function generateStaticParams() {
  const products = await getProducts({ activeOnly: true });
  return products.map((prod) => ({
    slug: prod.slug,
  }));
}

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, { activeOnly: true });

  if (!product) {
    return notFound();
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2340000000000";
  const whatsappMessage = encodeURIComponent(
    `Hello Auto Clinic, I would like to order this item:\n` +
    `• Product: ${product.name}\n` +
    `• SKU: ${product.sku}\n` +
    `• Price: ₦${(product.priceCents / 100).toLocaleString()}`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <PageContainer
      breadcrumbs={[
        { label: "Store Catalog", href: "/shop" },
        { label: product.categoryName, href: `/shop/${product.categorySlug}` },
        { label: product.name },
      ]}
      maxWidth="wide"
    >
      <div className={styles.pdpGrid}>
        {/* Left Column: Image / Technical Diagram Panel */}
        <div className={styles.imageColumn}>
          <div className={styles.mainImageCard}>
            <div className={styles.imageGraphic}>
              <div className={styles.emblemWrapper}>
                <Wrench size={48} className={styles.emblemIcon} />
              </div>
              <div className={styles.skuTag}>
                <span className="ac-mono">{product.sku}</span>
              </div>
            </div>
          </div>

          {/* Practical Fulfilment Assurance */}
          <div className={styles.assuranceCard}>
            <div className={styles.assuranceItem}>
              <Truck size={18} className={styles.assuranceIcon} />
              <div className={styles.assuranceText}>
                <strong>Nationwide Delivery in Nigeria</strong>
                <span>Courier dispatch to your verified address</span>
              </div>
            </div>
            <div className={styles.assuranceItem}>
              <Store size={18} className={styles.assuranceIcon} />
              <div className={styles.assuranceText}>
                <strong>Physical Workshop Pickup</strong>
                <span>Direct collection available at our workshop</span>
              </div>
            </div>
            <div className={styles.assuranceItem}>
              <ShieldCheck size={18} className={styles.assuranceIcon} />
              <div className={styles.assuranceText}>
                <strong>Bench Tested Equipment</strong>
                <span>Every diagnostic tool is verified prior to dispatch</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Product Info, Pricing, Actions & Specs */}
        <div className={styles.infoColumn}>
          <div className={styles.headerMeta}>
            <Link href={`/shop/${product.categorySlug}`} className={styles.categoryLink}>
              {product.categoryName}
            </Link>
            <StockBadge status={product.stockStatus} quantity={product.stockQuantity} size="md" />
          </div>

          <h1 className={styles.productTitle}>{product.name}</h1>

          <div className={styles.skuRow}>
            <span className={styles.skuLabel}>CATALOG SKU:</span>
            <span className="ac-mono">{product.sku}</span>
          </div>

          {/* Pricing Block */}
          <div className={styles.pricingCard}>
            <span className={styles.priceLabel}>UNIT PRICE (NGN)</span>
            <PriceDisplay
              priceCents={product.priceCents}
              compareAtPriceCents={product.compareAtPriceCents}
              size="xl"
            />
          </div>

          <p className={styles.description}>{product.shortDescription}</p>

          {product.fullDescription && (
            <p className={styles.fullDescription}>{product.fullDescription}</p>
          )}

          {/* Dual Action Conversion Box */}
          <div className={styles.actionBox}>
            <span className={styles.actionPrompt}>SELECT ORDERING CHANNEL:</span>
            <div className={styles.actionButtons}>
              <Button
                variant="primary"
                size="lg"
                leftIcon={<ShoppingCart size={18} />}
                disabled={product.stockStatus === "OUT_OF_STOCK"}
                className={styles.actionBtn}
              >
                Add to Cart (Web Checkout)
              </Button>
              <Button
                variant="whatsapp"
                size="lg"
                href={whatsappUrl}
                isExternal
                leftIcon={<MessageCircle size={18} />}
                className={styles.actionBtn}
              >
                Instant Order on WhatsApp
              </Button>
            </div>
          </div>

          {/* Technical Specifications */}
          {product.specs && product.specs.length > 0 && (
            <TechnicalSpecBlock specs={product.specs} className={styles.specSection} />
          )}

          {/* Protocol & Vehicle Compatibility */}
          {product.compatibility && product.compatibility.length > 0 && (
            <div className={styles.compatCard}>
              <h4 className={styles.compatTitle}>VERIFIED SYSTEM COMPATIBILITY</h4>
              <div className={styles.compatTags}>
                {product.compatibility.map((item) => (
                  <span key={item} className={styles.compatTag}>
                    <CheckCircle2 size={12} className={styles.compatCheck} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
