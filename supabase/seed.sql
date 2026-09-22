-- ============================================================================
-- AUTO CLINIC — DEVELOPMENT & TEST FIXTURE SEED DATA (PHASE 3)
-- IMPORTANT: These records are development fixtures and test data.
-- They do NOT represent real Auto Clinic inventory, pricing, or certifications.
-- ============================================================================

-- 1. Insert Categories
INSERT INTO categories (id, name, slug, description, icon_name, is_active, display_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Diagnostic Scanners & OBD2 [DEV FIXTURE]', 'diagnostic-scanners', 'Development fixture: Handheld scanners, ECU code readers, and diagnostic interfaces.', 'Cpu', true, 1),
  ('c1000000-0000-0000-0000-000000000002', 'Electrical & Battery Testers [DEV FIXTURE]', 'electrical-battery', 'Development fixture: Digital multimeters, load testers, and alternator analyzers.', 'Zap', true, 2),
  ('c1000000-0000-0000-0000-000000000003', 'Workshop Tools & Hardware [DEV FIXTURE]', 'workshop-tools', 'Development fixture: Precision torque wrenches, sockets, and inspection cameras.', 'Wrench', true, 3),
  ('c1000000-0000-0000-0000-000000000004', 'Vehicle Accessories & Safety [DEV FIXTURE]', 'accessories-safety', 'Development fixture: Heavy-duty inflators, jump starters, and work lamps.', 'ShieldCheck', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Products
INSERT INTO products (
  id, sku, name, slug, category_id, short_description, full_description,
  price_cents, compare_at_price_cents, is_active, is_featured, specs, compatibility
)
VALUES
  (
    'p1000000-0000-0000-0000-000000000001',
    'AC-DEV-OBD802',
    'Auto Clinic Pro-Scan V2 OBD2 Scanner [DEV FIXTURE]',
    'pro-scan-v2-obd2-scanner',
    'c1000000-0000-0000-0000-000000000001',
    'Development fixture: Full-system OBD2 fault code diagnostic scanner with live ECU telemetry.',
    'Test description: Diagnostic scanner fixture designed for testing catalog presentation, NGN currency display, and technical specification tables.',
    4850000, -- ₦48,500.00
    5500000,
    true,
    true,
    '[
      {"label": "Protocol Support", "value": "CAN, ISO9141, KWP2000, J1850 PWM/VPW", "isMonospace": true},
      {"label": "Display", "value": "2.8-inch High-Contrast Backlit LCD"},
      {"label": "Operating Voltage", "value": "9V - 18V DC", "isMonospace": true},
      {"label": "Firmware Interface", "value": "USB-C Interface (Test updates)"},
      {"label": "Operating Temp", "value": "-20°C to 70°C", "isMonospace": true}
    ]'::jsonb,
    '["Universal OBD2 (Petrol 1996+, Diesel 2004+)", "Toyota", "Honda", "Mercedes-Benz", "BMW", "Ford", "Hyundai", "Kia"]'::jsonb
  ),
  (
    'p1000000-0000-0000-0000-000000000002',
    'AC-DEV-BAT1224',
    'Heavy-Duty 12V/24V Digital Battery Analyzer [DEV FIXTURE]',
    'heavy-duty-battery-analyzer',
    'c1000000-0000-0000-0000-000000000002',
    'Development fixture: Conductance-based battery health and cold-cranking amp (CCA) analyzer.',
    'Test description: Digital battery tester fixture for testing electrical equipment catalog category.',
    3200000, -- ₦32,000.00
    NULL,
    true,
    true,
    '[
      {"label": "Testing Range", "value": "100 - 2000 CCA (Regular, AGM, GEL, EFB)", "isMonospace": true},
      {"label": "Voltage Range", "value": "8V - 30V DC", "isMonospace": true},
      {"label": "Clamp Construction", "value": "Kelvin Double-Conductor Clamps"},
      {"label": "Protection", "value": "Reverse polarity safeguard"}
    ]'::jsonb,
    '["Lead-Acid", "AGM Flat/Spiral", "GEL", "EFB 12V/24V Systems"]'::jsonb
  ),
  (
    'p1000000-0000-0000-0000-000000000003',
    'AC-DEV-INF150P',
    'Industrial 150 PSI Dual-Cylinder Tyre Inflator [DEV FIXTURE]',
    'industrial-dual-cylinder-tyre-inflator',
    'c1000000-0000-0000-0000-000000000004',
    'Development fixture: Rugged all-metal dual-piston air compressor with auto-cutoff gauge.',
    'Test description: High-output 12V air compressor fixture for accessories category.',
    2750000, -- ₦27,500.00
    3100000,
    true,
    true,
    '[
      {"label": "Max Output", "value": "150 PSI (60L/min Flow Rate)", "isMonospace": true},
      {"label": "Power Draw", "value": "12V DC / 18A Max", "isMonospace": true},
      {"label": "Cylinder Bore", "value": "Dual 30mm Anodized Alloy", "isMonospace": true},
      {"label": "Hose Length", "value": "5m Braided Air Line"}
    ]'::jsonb,
    '["Sedans", "SUVs", "Light Commercial Trucks", "4x4 Vehicles"]'::jsonb
  ),
  (
    'p1000000-0000-0000-0000-000000000004',
    'AC-DEV-TORQ12',
    '1/2-Inch Drive Precision Click Torque Wrench [DEV FIXTURE]',
    'precision-click-torque-wrench',
    'c1000000-0000-0000-0000-000000000003',
    'Development fixture: Hardened chrome-vanadium torque wrench with laser-etched dual scale.',
    'Test description: Precision mechanical workshop hardware fixture.',
    2100000, -- ₦21,000.00
    NULL,
    true,
    true,
    '[
      {"label": "Torque Range", "value": "20 - 220 Nm / 15 - 162 ft-lb", "isMonospace": true},
      {"label": "Accuracy", "value": "±4% CW Pre-Calibrated", "isMonospace": true},
      {"label": "Drive Size", "value": "1/2-inch Square Drive (72-Tooth)", "isMonospace": true},
      {"label": "Material", "value": "Heat-Treated CR-V Steel Body"}
    ]'::jsonb,
    '["Wheel Nuts", "Cylinder Head Bolts", "Suspension & Brake Assemblies"]'::jsonb
  ),
  (
    'p1000000-0000-0000-0000-000000000005',
    'AC-DEV-JMP2000',
    '2000A Peak Lithium Emergency Jump Starter [DEV FIXTURE]',
    'lithium-emergency-jump-starter',
    'c1000000-0000-0000-0000-000000000004',
    'Development fixture: Lithium jump box capable of starting up to 8.0L Petrol / 6.0L Diesel engines.',
    'Test description: High-capacity power bank and emergency starter fixture.',
    4100000, -- ₦41,000.00
    NULL,
    true,
    false,
    '[
      {"label": "Peak Current", "value": "2000 Amperes", "isMonospace": true},
      {"label": "Battery Capacity", "value": "18,000 mAh (66.6 Wh)", "isMonospace": true},
      {"label": "USB Output", "value": "Quick Charge 3.0 + USB-C PD 18W", "isMonospace": true},
      {"label": "Safety Protections", "value": "8-Point Smart Clamp Logic"}
    ]'::jsonb,
    '["Up to 8.0L Petrol", "Up to 6.0L Diesel Engines"]'::jsonb
  ),
  (
    'p1000000-0000-0000-0000-000000000006',
    'AC-DEV-BOR1080',
    'Dual-Lens HD Articulating Borescope Camera [DEV FIXTURE]',
    'dual-lens-borescope-camera',
    'c1000000-0000-0000-0000-000000000003',
    'Development fixture: 5-inch IPS diagnostic borescope with 1080P front/side lenses.',
    'Test description: Optical diagnostic inspection camera fixture with backorder status.',
    5800000, -- ₦58,000.00
    NULL,
    true,
    false,
    '[
      {"label": "Camera Probe", "value": "5.5mm IP67 Waterproof Semi-Rigid", "isMonospace": true},
      {"label": "Screen", "value": "5.0-inch 1080P IPS Full Color", "isMonospace": true},
      {"label": "Illumination", "value": "6+1 High-Output Dimmable LEDs"},
      {"label": "Battery Life", "value": "4.5 Hours Continuous Runtime"}
    ]'::jsonb,
    '["Spark Plug Holes", "Combustion Chambers", "Valvetrain", "HVAC Ducts"]'::jsonb
  )
ON CONFLICT (sku) DO NOTHING;

-- 3. Insert Inventory Records
INSERT INTO inventory (product_id, quantity_on_hand, quantity_reserved, low_stock_threshold, allow_backorder)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 14, 0, 5, false),
  ('p1000000-0000-0000-0000-000000000002', 8,  0, 4, false),
  ('p1000000-0000-0000-0000-000000000003', 3,  0, 5, false),
  ('p1000000-0000-0000-0000-000000000004', 19, 0, 5, false),
  ('p1000000-0000-0000-0000-000000000005', 7,  0, 3, false),
  ('p1000000-0000-0000-0000-000000000006', 0,  0, 3, true)
ON CONFLICT (product_id) DO NOTHING;

-- 4. Insert Diagnostic Services
INSERT INTO diagnostic_services (
  id, code, name, slug, short_summary, estimated_duration, indicative_fee,
  target_systems, recommended_when, is_active, display_order
)
VALUES
  (
    's1000000-0000-0000-0000-000000000001',
    'DIAG-ECU-01',
    'Full ECU Scan & Fault Code Analysis [DEV FIXTURE]',
    'ecu-fault-code-scan',
    'Development fixture: Electronic control unit scan covering engine, transmission, ABS, airbag, and body modules.',
    '45 - 60 Mins',
    'Enquire for quote',
    '["Engine ECU", "Automatic Transmission", "ABS / Traction Control", "Airbag / SRS", "BCM"]'::jsonb,
    'Check Engine light illuminated, limp mode active, gearbox shifting anomalies, or unusual dashboard warnings.',
    true,
    1
  ),
  (
    's1000000-0000-0000-0000-000000000002',
    'DIAG-ELEC-02',
    'Electrical System & Parasitic Drain Triage [DEV FIXTURE]',
    'electrical-system-triage',
    'Development fixture: Testing for alternator ripple, battery discharge, starter draw, and harness shorts.',
    '60 - 90 Mins',
    'Enquire for quote',
    '["Charging System", "Starter Motor", "Battery Bank", "Fuse Box & Relays", "Ground Cables"]'::jsonb,
    'Battery repeatedly dying overnight, slow cranking, dimming headlights, or blown fuses.',
    true,
    2
  ),
  (
    's1000000-0000-0000-0000-000000000003',
    'DIAG-MECH-03',
    'Engine Performance & Mechanical Health Triage [DEV FIXTURE]',
    'engine-mechanical-triage',
    'Development fixture: Cylinder compression testing, borescope inspection, and cooling pressure checks.',
    '90 - 120 Mins',
    'Enquire for quote',
    '["Valves & Rings", "Fuel Delivery & Injectors", "Intake Manifold / Smoke Test", "Cooling Circuit"]'::jsonb,
    'Rough idle, misfires under load, excessive smoke from exhaust, overheating, or loss of power.',
    true,
    3
  ),
  (
    's1000000-0000-0000-0000-000000000004',
    'DIAG-PRE-04',
    'Pre-Purchase Comprehensive Vehicle Inspection [DEV FIXTURE]',
    'pre-purchase-inspection',
    'Development fixture: Multi-point physical and electronic evaluation before vehicle acquisition.',
    '120 - 150 Mins',
    'Enquire for quote',
    '["Full Electronic Scan", "Chassis & Suspension", "Fluid Condition", "Brakes & Underbody", "Live Road Test"]'::jsonb,
    'Prior to finalizing purchase of a Nigerian-used or imported foreign-used vehicle.',
    true,
    4
  )
ON CONFLICT (code) DO NOTHING;
