import React from "react";
import Link from "next/link";
import { Wrench, Shield, MessageCircle, MapPin, Clock, Phone, AlertCircle } from "lucide-react";
import styles from "./Footer.module.css";

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      {/* Industrial Hazard Stripe Divider */}
      <div className={styles.hazardDivider} aria-hidden="true" />

      <div className="ac-container">
        <div className={styles.topSection}>
          {/* Brand & Mission */}
          <div className={styles.brandCol}>
            <div className={styles.brandLogo}>
              <div className={styles.emblem}>
                <Wrench size={18} className={styles.emblemIcon} />
              </div>
              <span className={styles.brandTitle}>AUTO CLINIC</span>
            </div>
            <p className={styles.brandDesc}>
              Automotive diagnostics, precision tools, equipment, and accessories. 
              Serving motorists and workshops across Nigeria with direct delivery, workshop collection, and in-person fault analysis.
            </p>
            <div className={styles.operatingModelNotice}>
              <AlertCircle size={14} className={styles.noticeIcon} />
              <span>
                Diagnostic appointments are scheduled after reviewing customer enquiries.
              </span>
            </div>
          </div>

          {/* Catalog & Equipment */}
          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>AUTOMOTIVE STORE</h4>
            <ul className={styles.linkList}>
              <li><Link href="/shop" className={styles.link}>All Equipment &amp; Tools</Link></li>
              <li><Link href="/shop/diagnostic-scanners" className={styles.link}>OBD2 Diagnostic Scanners</Link></li>
              <li><Link href="/shop/electrical-battery" className={styles.link}>Battery &amp; Electrical Testers</Link></li>
              <li><Link href="/shop/workshop-tools" className={styles.link}>Workshop Tools &amp; Hardware</Link></li>
              <li><Link href="/shop/accessories-safety" className={styles.link}>Accessories &amp; Safety Gear</Link></li>
            </ul>
          </div>

          {/* Workshop Services */}
          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>WORKSHOP DIAGNOSTICS</h4>
            <ul className={styles.linkList}>
              <li><Link href="/diagnostics" className={styles.link}>Diagnostic Overview</Link></li>
              <li><Link href="/diagnostics#ecu" className={styles.link}>ECU &amp; Sensor Scanning</Link></li>
              <li><Link href="/diagnostics#electrical" className={styles.link}>Parasitic Electrical Drain</Link></li>
              <li><Link href="/diagnostics#mechanical" className={styles.link}>Engine Mechanical Triage</Link></li>
              <li><Link href="/diagnostics#pre-purchase" className={styles.link}>Pre-Purchase Inspection</Link></li>
            </ul>
          </div>

          {/* Workshop Information & Contacts Placeholder */}
          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>LOCATION &amp; SUPPORT</h4>
            <ul className={styles.infoList}>
              <li className={styles.infoItem}>
                <MapPin size={14} className={styles.infoIcon} />
                <span>Physical Workshop: Location in Nigeria (Specific address to be confirmed)</span>
              </li>
              <li className={styles.infoItem}>
                <Clock size={14} className={styles.infoIcon} />
                <span>Workshop Hours: Schedule to be confirmed</span>
              </li>
              <li className={styles.infoItem}>
                <MessageCircle size={14} className={styles.infoIcon} />
                <span>WhatsApp: Ordering &amp; Enquiry Available</span>
              </li>
              <li className={styles.infoItem}>
                <Link href="/track" className={styles.trackLink}>
                  <span>Track Order / Enquiry Status →</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} Auto Clinic. All rights reserved. Operating currency: NGN (₦).
          </p>
          <div className={styles.bottomLinks}>
            <Link href="/about" className={styles.bottomLink}>About Clinic</Link>
            <Link href="/contact" className={styles.bottomLink}>Contact &amp; Workshop</Link>
            <Link href="/admin" className={styles.bottomLink}>Staff Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
