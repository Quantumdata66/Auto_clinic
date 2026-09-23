import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Auto Clinic | Workshop Diagnostics & Automotive Store (Nigeria)",
  description:
    "Professional vehicle diagnostics, automotive tools, OBD2 scanners, and accessories in Nigeria. Shop online or request an in-person workshop diagnostic appointment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header />
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </div>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}

