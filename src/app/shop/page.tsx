import React from "react";
import Link from "next/link";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductCard } from "@/components/commerce/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/data/mockData";
import styles from "./Shop.module.css";

export default function ShopPage() {
  return (
    <PageContainer
      title="Automotive Equipment & Tools Store"
      subtitle="Browse commercial OBD2 scanners, battery analyzers, mechanical torque equipment, and vehicle safety gear with NGN pricing."
      breadcrumbs={[{ label: "Store Catalog" }]}
      maxWidth="wide"
    >
      <div className={styles.shopLayout}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.filterCard}>
            <div className={styles.filterHeader}>
              <Filter size={16} className={styles.filterIcon} />
              <span className={styles.filterTitle}>EQUIPMENT CATEGORIES</span>
            </div>

            <ul className={styles.categoryList}>
              <li>
                <Link href="/shop" className={`${styles.catLink} ${styles.activeCat}`}>
                  <span>All Equipment</span>
                  <Badge variant="amber" size="sm" isMonospace>{MOCK_PRODUCTS.length}</Badge>
                </Link>
              </li>
              {MOCK_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/shop/${cat.slug}`} className={styles.catLink}>
                    <span>{cat.name}</span>
                    <Badge variant="neutral" size="sm" isMonospace>{cat.itemCount}</Badge>
                  </Link>
                </li>
              ))}
            </ul>

            <div className={styles.filterDivider} />

            <div className={styles.filterSection}>
              <span className={styles.filterSubheading}>ORDERING CHANNELS</span>
              <p className={styles.channelText}>
                All listed equipment supports direct online payment and WhatsApp instant ordering.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Product Grid Area */}
        <div className={styles.catalogArea}>
          <div className={styles.toolbar}>
            <div className={styles.searchWrapper}>
              <Input
                placeholder="Search tools by SKU, name, or vehicle protocol..."
                prefixIcon={<Search size={16} />}
              />
            </div>
            <div className={styles.inventoryCount}>
              <span className="ac-mono">{MOCK_PRODUCTS.length} ITEMS CATALOGUED</span>
            </div>
          </div>

          <div className="ac-grid ac-grid-3">
            {MOCK_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
