import React from "react";
import Link from "next/link";
import { Wrench, Cpu, ShieldCheck, Zap, ArrowRight, CheckCircle2, MessageCircle, AlertTriangle, Layers, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProductCard } from "@/components/commerce/ProductCard";
import { DiagnosticServiceCard } from "@/components/workshop/DiagnosticServiceCard";
import { EnquiryCTA } from "@/components/workshop/EnquiryCTA";
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_DIAGNOSTIC_SERVICES } from "@/data/mockData";
import styles from "./Home.module.css";

export default function HomePage() {
  const featuredProducts = MOCK_PRODUCTS.filter((p) => p.featured).slice(0, 4);

  return (
    <div className={styles.homeContainer}>
      {/* 1. HERO SECTION */}
      <section className={styles.heroSection}>
        <div className="ac-container">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.heroEyebrow}>
                <span className={styles.pulseDot} aria-hidden="true" />
                <span className="ac-mono">AUTOMOTIVE WORKSHOP &amp; PRECISION TOOLS STORE</span>
              </div>

              <h1 className="ac-hero-title">
                TECHNICAL DIAGNOSTICS &amp; INDUSTRIAL AUTO GEAR.
              </h1>

              <p className={styles.heroLead}>
                Auto Clinic combines physical workshop vehicle diagnostics with an online store 
                delivering diagnostic scanners, electrical testers, and professional automotive hardware across Nigeria.
              </p>

              {/* Dual Action CTAs */}
              <div className={styles.heroActions}>
                <Button
                  href="/shop"
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight size={16} />}
                >
                  Explore Store Catalog
                </Button>
                <Button
                  href="/diagnostics"
                  variant="secondary"
                  size="lg"
                  leftIcon={<Wrench size={16} />}
                >
                  Workshop Diagnostics
                </Button>
              </div>

              {/* Key Technical Operational Pillars */}
              <div className={styles.pillarStrip}>
                <div className={styles.pillarItem}>
                  <CheckCircle2 size={16} className={styles.pillarIcon} />
                  <span>Dual Ordering: Online &amp; WhatsApp</span>
                </div>
                <div className={styles.pillarItem}>
                  <CheckCircle2 size={16} className={styles.pillarIcon} />
                  <span>Delivery &amp; Workshop Collection</span>
                </div>
                <div className={styles.pillarItem}>
                  <CheckCircle2 size={16} className={styles.pillarIcon} />
                  <span>In-Person Physical Diagnostics</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Panel / Live Telemetry Matrix */}
            <div className={styles.heroGraphicPanel}>
              <div className={styles.telemetryCard}>
                <div className={styles.telemetryHeader}>
                  <div className={styles.telemetryStatus}>
                    <Activity size={14} className={styles.statusPulseIcon} />
                    <span className="ac-mono">WORKSHOP CAPABILITY PROFILE</span>
                  </div>
                  <Badge variant="amber" isMonospace size="sm">
                    NGN STORE
                  </Badge>
                </div>

                <div className={styles.telemetryGrid}>
                  <div className={styles.telemetryStat}>
                    <span className={styles.statLabel}>DIAGNOSTIC SCOPE</span>
                    <span className={styles.statValue}>ECU / CAN / SAS / ABS / SRS</span>
                  </div>
                  <div className={styles.telemetryStat}>
                    <span className={styles.statLabel}>ORDERING CHANNELS</span>
                    <span className={styles.statValue}>Web Checkout + WhatsApp</span>
                  </div>
                  <div className={styles.telemetryStat}>
                    <span className={styles.statLabel}>FULFILMENT MODE</span>
                    <span className={styles.statValue}>Direct Courier + Workshop Pickup</span>
                  </div>
                  <div className={styles.telemetryStat}>
                    <span className={styles.statLabel}>APPOINTMENT FLOW</span>
                    <span className={styles.statValue}>Enquiry → WhatsApp / Phone Booking</span>
                  </div>
                </div>

                <div className={styles.telemetryFooter}>
                  <div className={styles.signalBar}>
                    <span className={styles.signalBlock} />
                    <span className={styles.signalBlock} />
                    <span className={styles.signalBlock} />
                    <span className={styles.signalBlock} />
                  </div>
                  <span className={styles.telemetryNotice}>
                    SYSTEM READY — BROWSE INVENTORY &amp; SERVICES BELOW
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES OVERVIEW */}
      <SectionWrapper
        eyebrow="STORE EQUIPMENT CATEGORIES"
        title="AUTOMOTIVE EQUIPMENT DIVISIONS"
        subtitle="Explore specialized diagnostic scanners, battery analyzers, workshop hardware, and vehicle safety gear."
        background="surface"
      >
        <div className="ac-grid ac-grid-4">
          {MOCK_CATEGORIES.map((cat) => (
            <Link key={cat.id} href={`/shop/${cat.slug}`} className={styles.catCard}>
              <div className={styles.catIconWrapper}>
                {cat.id === "cat-1" && <Cpu size={24} />}
                {cat.id === "cat-2" && <Zap size={24} />}
                {cat.id === "cat-3" && <Wrench size={24} />}
                {cat.id === "cat-4" && <ShieldCheck size={24} />}
              </div>
              <h3 className={styles.catName}>{cat.name}</h3>
              <p className={styles.catDesc}>{cat.description}</p>
              <div className={styles.catFooter}>
                <span className="ac-mono">{cat.itemCount} Equipment Models</span>
                <ArrowRight size={14} className={styles.catArrow} />
              </div>
            </Link>
          ))}
        </div>
      </SectionWrapper>

      {/* 3. FEATURED PRODUCTS SECTION */}
      <SectionWrapper
        eyebrow="HIGH-DEMAND WORKSHOP TOOLS"
        title="FEATURED HARDWARE &amp; SCANNERS"
        subtitle="Commercial-grade diagnostic tools and accessories with dual online and WhatsApp checkout options."
        actions={
          <Button href="/shop" variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>
            View Full Inventory
          </Button>
        }
        background="base"
      >
        <div className="ac-grid ac-grid-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </SectionWrapper>

      {/* 4. DIAGNOSTICS WORKFLOW SECTION */}
      <SectionWrapper
        eyebrow="PHYSICAL WORKSHOP SERVICES"
        title="IN-PERSON VEHICLE DIAGNOSTICS"
        subtitle="Accurate mechanical, electronic, and sensor fault isolation conducted at our physical workshop."
        hazardBorderTop
        background="surface"
      >
        <div className="ac-grid ac-grid-2">
          {MOCK_DIAGNOSTIC_SERVICES.slice(0, 2).map((service) => (
            <DiagnosticServiceCard key={service.id} service={service} />
          ))}
        </div>

        <div className={styles.workflowExplainer}>
          <div className={styles.workflowStep}>
            <div className={styles.stepNum}>01</div>
            <div className={styles.stepInfo}>
              <h4 className={styles.stepTitle}>Submit Symptom Enquiry</h4>
              <p className={styles.stepText}>
                Provide your vehicle make, model, year, and a description of the warning lights or driving faults.
              </p>
            </div>
          </div>
          <div className={styles.workflowStep}>
            <div className={styles.stepNum}>02</div>
            <div className={styles.stepInfo}>
              <h4 className={styles.stepTitle}>Technician Pre-Evaluation</h4>
              <p className={styles.stepText}>
                Our team reviews vehicle telemetry, confirms diagnostic scope, and contacts you via WhatsApp or phone.
              </p>
            </div>
          </div>
          <div className={styles.workflowStep}>
            <div className={styles.stepNum}>03</div>
            <div className={styles.stepInfo}>
              <h4 className={styles.stepTitle}>Workshop Arrival &amp; Triage</h4>
              <p className={styles.stepText}>
                Bring the vehicle to the physical workshop bay for scheduled electronic scanning and mechanical inspection.
              </p>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 5. WORKSHOP CREDIBILITY & PRACTICAL FRAMEWORK */}
      <SectionWrapper
        eyebrow="TECHNICAL RIGOUR &amp; STANDARDS"
        title="WORKSHOP METHODOLOGY"
        subtitle="Practical, systematic approach to vehicle diagnostics and equipment reliability."
        background="base"
      >
        <div className="ac-grid ac-grid-3">
          <Card
            accentBorder
            title="Systematic Fault Isolation"
            subtitle="PROTOCOL-BASED TRIAGE"
          >
            <p className={styles.credText}>
              Diagnostics adhere to standardized OBD2/CAN communication protocols, live sensor graphing, and electrical load checks rather than guesswork.
            </p>
          </Card>

          <Card
            accentBorder
            title="Verified Equipment Data"
            subtitle="ACCURATE SPECIFICATIONS"
          >
            <p className={styles.credText}>
              Every tool sold on our store includes detailed operating voltages, protocol compatibility tables, and clear technical limitations.
            </p>
          </Card>

          <Card
            accentBorder
            title="Direct Technician Dialogue"
            subtitle="OMNICHANNEL ASSISTANCE"
          >
            <p className={styles.credText}>
              Whether ordering equipment or submitting a vehicle enquiry, customers can interact directly with support staff via WhatsApp and phone.
            </p>
          </Card>
        </div>
      </SectionWrapper>

      {/* 6. CALL TO ACTION BLOCK */}
      <section className={styles.ctaSection}>
        <div className="ac-container">
          <EnquiryCTA />
        </div>
      </section>
    </div>
  );
}
