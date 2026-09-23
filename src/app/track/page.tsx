"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  Wrench,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  AlertCircle,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RadioGroup } from "@/components/ui/Radio";
import { Toast } from "@/components/ui/Toast";
import { PriceDisplay } from "@/components/commerce/PriceDisplay";
import { lookupOrderStatusAction } from "@/app/actions/orders";
import { lookupDiagnosticStatusAction } from "@/app/actions/diagnostics";
import { generateOrderConfirmationWhatsAppUrl, generateDiagnosticWhatsAppUrl } from "@/lib/utils/whatsapp";
import { Order, DiagnosticEnquiry } from "@/types";

export default function TrackPage() {
  const [trackType, setTrackType] = useState<"ORDER" | "DIAGNOSTIC">("ORDER");
  const [refNumber, setRefNumber] = useState("");
  const [contact, setContact] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [enquiryResult, setEnquiryResult] = useState<DiagnosticEnquiry | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setOrderResult(null);
    setEnquiryResult(null);
    setIsLoading(true);

    try {
      if (trackType === "ORDER") {
        const res = await lookupOrderStatusAction(refNumber, contact);
        if (!res.found || !res.order) {
          setErrorMessage(res.error || "No order found matching the provided reference and contact info.");
        } else {
          setOrderResult(res.order);
        }
      } else {
        const res = await lookupDiagnosticStatusAction(refNumber, contact);
        if (!res.found || !res.enquiry) {
          setErrorMessage(res.error || "No diagnostic enquiry found matching the reference code and contact.");
        } else {
          setEnquiryResult(res.enquiry);
        }
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setErrorMessage("An unexpected network error occurred while performing status lookup.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer
      title="Track Order & Diagnostic Status"
      subtitle="Lookup real-time fulfilment status for store orders or diagnostic enquiry progress for workshop appointments."
      breadcrumbs={[{ label: "Status Tracker" }]}
      maxWidth="default"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-8)" }}>
        {/* Lookup Form */}
        <Card hazardStripe title="STATUS LOOKUP MATRIX" subtitle="Enter your tracking identifier">
          <form onSubmit={handleLookup} style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
            <RadioGroup
              name="trackType"
              label="Select Tracking Category"
              selectedValue={trackType}
              onChange={(val) => {
                setTrackType(val as "ORDER" | "DIAGNOSTIC");
                setErrorMessage(null);
                setOrderResult(null);
                setEnquiryResult(null);
              }}
              options={[
                {
                  value: "ORDER",
                  label: "Automotive Store Order",
                  description: "Track shipment dispatch, delivery courier, or workshop collection readiness.",
                },
                {
                  value: "DIAGNOSTIC",
                  label: "Workshop Diagnostic Enquiry",
                  description: "Track technician review status, triage evaluation, and scheduled arrival bay slot.",
                },
              ]}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-3)" }}>
              <Input
                label={trackType === "ORDER" ? "Order Number" : "Diagnostic Reference Code"}
                placeholder={trackType === "ORDER" ? "e.g. AC-ORD-20260922-8F12" : "e.g. AC-ENQ-829104"}
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                isMonospace
                required
              />
              <Input
                label="Registered Phone or Email"
                placeholder="e.g. 08012345678 or email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              leftIcon={isLoading ? <RefreshCw size={16} className="ac-spin" /> : <Search size={16} />}
            >
              {isLoading ? "Searching Database..." : "Lookup Current Status"}
            </Button>
          </form>
        </Card>

        {errorMessage && (
          <Toast
            type="error"
            title="LOOKUP FAILED"
            message={errorMessage}
          />
        )}

        {/* Order Result Display */}
        {orderResult && (
          <Card
            accentBorder
            title={`ORDER STATUS: ${orderResult.orderNumber}`}
            subtitle={`Customer: ${orderResult.customerName} • Placed on ${new Date(orderResult.createdAt).toLocaleDateString("en-NG")}`}
            headerAction={
              <Badge variant="amber" isMonospace size="sm">
                STATUS: {orderResult.orderStatus}
              </Badge>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              <div className="ac-panel" style={{ backgroundColor: "var(--ac-bg-base)", padding: "var(--ac-space-3)" }}>
                <span className="ac-mono" style={{ fontSize: "11px", color: "var(--ac-accent-amber)", display: "block", marginBottom: "4px" }}>
                  CURRENT OPERATIONAL STAGE:
                </span>
                <p style={{ fontSize: "var(--ac-text-sm)", color: "var(--ac-text-primary)", margin: 0 }}>
                  {orderResult.orderStatus === "PENDING" &&
                    "Order received and registered. Stock has been reserved. Payment is currently UNPAID; our staff will contact you with bank transfer details."}
                  {orderResult.orderStatus === "PROCESSING" &&
                    "Payment verified. Equipment is undergoing bench testing and packing for dispatch."}
                  {orderResult.orderStatus === "READY_FOR_COLLECTION" &&
                    "Equipment is prepared and ready for in-person collection at the Auto Clinic workshop."}
                  {orderResult.orderStatus === "DISPATCHED" &&
                    "Order has been handed to the courier for nationwide delivery across Nigeria."}
                  {orderResult.orderStatus === "COMPLETED" &&
                    "Order successfully delivered and fulfilled."}
                  {orderResult.orderStatus === "CANCELLED" &&
                    "Order has been cancelled."}
                </p>
              </div>

              {/* Fulfilment & Payment Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ac-space-4)", fontSize: "var(--ac-text-xs)" }}>
                <div>
                  <span className="ac-mono" style={{ color: "var(--ac-text-muted)", display: "block" }}>FULFILMENT:</span>
                  <strong>{orderResult.fulfilmentType === "WORKSHOP_PICKUP" ? "Workshop Collection" : "Courier Delivery (Nigeria)"}</strong>
                  {orderResult.shippingAddress && (
                    <span style={{ display: "block", color: "var(--ac-text-secondary)" }}>
                      {(orderResult.shippingAddress as any).street}, {(orderResult.shippingAddress as any).city}
                    </span>
                  )}
                </div>
                <div>
                  <span className="ac-mono" style={{ color: "var(--ac-text-muted)", display: "block" }}>PAYMENT STATUS:</span>
                  <strong style={{ color: "var(--ac-accent-amber)" }}>{orderResult.paymentStatus}</strong>
                </div>
              </div>

              {/* Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-2)", borderTop: "1px solid var(--ac-border-subtle)", paddingTop: "var(--ac-space-3)" }}>
                <span className="ac-mono" style={{ fontSize: "10px", color: "var(--ac-text-muted)" }}>
                  ORDER ITEMS:
                </span>
                {(orderResult.items || []).map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--ac-text-xs)" }}>
                    <span>
                      {item.productNameSnapshot} (SKU: {item.skuSnapshot}) × {item.quantity}
                    </span>
                    <PriceDisplay priceCents={item.lineTotalCents} size="sm" />
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--ac-border-subtle)", paddingTop: "var(--ac-space-2)", fontWeight: 700 }}>
                  <span>Total (NGN):</span>
                  <PriceDisplay priceCents={orderResult.totalCents} size="md" />
                </div>
              </div>

              {/* WhatsApp follow-up CTA */}
              <Button
                href={generateOrderConfirmationWhatsAppUrl(
                  orderResult.orderNumber,
                  (orderResult.items || []).map((i) => ({
                    sku: i.skuSnapshot,
                    name: i.productNameSnapshot,
                    quantity: i.quantity,
                    unitPriceCents: i.unitPriceCentsSnapshot,
                  })),
                  orderResult.totalCents,
                  orderResult.customerName
                )}
                isExternal
                variant="whatsapp"
                size="md"
                leftIcon={<MessageCircle size={16} />}
              >
                Inquire on WhatsApp Regarding {orderResult.orderNumber}
              </Button>
            </div>
          </Card>
        )}

        {/* Diagnostic Enquiry Result Display */}
        {enquiryResult && (
          <Card
            accentBorder
            title={`DIAGNOSTIC ENQUIRY: ${enquiryResult.referenceCode}`}
            subtitle={`Customer: ${enquiryResult.customerName} • Vehicle: ${enquiryResult.vehicleYear} ${enquiryResult.vehicleMake} ${enquiryResult.vehicleModel}`}
            headerAction={
              <Badge variant="amber" isMonospace size="sm">
                STATUS: {enquiryResult.status.replace(/_/g, " ")}
              </Badge>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ac-space-4)" }}>
              <div className="ac-panel" style={{ backgroundColor: "var(--ac-bg-base)", padding: "var(--ac-space-3)" }}>
                <span className="ac-mono" style={{ fontSize: "11px", color: "var(--ac-accent-amber)", display: "block", marginBottom: "4px" }}>
                  TRIAGE PROGRESS:
                </span>
                <p style={{ fontSize: "var(--ac-text-sm)", color: "var(--ac-text-primary)", margin: 0 }}>
                  {enquiryResult.status === "PENDING_REVIEW" &&
                    "Enquiry logged in queue. Our lead diagnostic technician is reviewing the reported vehicle symptoms prior to contacting you."}
                  {enquiryResult.status === "CONTACTED" &&
                    "Technician has initiated contact via your preferred channel to discuss preliminary fault diagnosis and slot availability."}
                  {enquiryResult.status === "APPOINTMENT_SCHEDULED" &&
                    "Workshop appointment slot agreed. Please arrive at the workshop bay at the scheduled time."}
                  {enquiryResult.status === "COMPLETED" &&
                    "Workshop vehicle diagnostic assessment completed."}
                  {enquiryResult.status === "CANCELLED" &&
                    "Diagnostic enquiry has been cancelled."}
                </p>
              </div>

              <div style={{ fontSize: "var(--ac-text-xs)", display: "flex", flexDirection: "column", gap: "var(--ac-space-2)" }}>
                <div>
                  <span className="ac-mono" style={{ color: "var(--ac-text-muted)", display: "block" }}>REPORTED SYMPTOMS:</span>
                  <p style={{ color: "var(--ac-text-primary)", margin: "2px 0 0 0", fontStyle: "italic" }}>
                    &ldquo;{enquiryResult.symptoms}&rdquo;
                  </p>
                </div>
                <div>
                  <span className="ac-mono" style={{ color: "var(--ac-text-muted)", display: "block" }}>PREFERRED CONTACT:</span>
                  <strong>{enquiryResult.preferredContactMethod} ({enquiryResult.customerPhone})</strong>
                </div>
              </div>

              <Button
                href={generateDiagnosticWhatsAppUrl(
                  enquiryResult.referenceCode,
                  { make: enquiryResult.vehicleMake, model: enquiryResult.vehicleModel, year: enquiryResult.vehicleYear },
                  enquiryResult.symptoms,
                  enquiryResult.customerName
                )}
                isExternal
                variant="whatsapp"
                size="md"
                leftIcon={<MessageCircle size={16} />}
              >
                Chat with Technician on WhatsApp ({enquiryResult.referenceCode})
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
