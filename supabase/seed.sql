-- ============================================================================
-- AUTO CLINIC — STAGING DEMONSTRATION CATALOGUE SEED DATA (PHASE 3 / PHASE 5)
-- IMPORTANT: These records represent staging demonstration catalogue items.
-- Commercial catalogue and workshop live inventory will be updated upon launch.
-- ============================================================================

-- 1. Insert Categories
INSERT INTO categories (id, name, slug, description, icon_name, is_active, display_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Diagnostic Scanners & OBD2', 'diagnostic-scanners', 'Professional handheld scanners, ECU code readers, and multi-system diagnostic interfaces.', 'Cpu', true, 1),
  ('c1000000-0000-0000-0000-000000000002', 'Electrical & Battery Testers', 'electrical-battery', 'Digital automotive multimeters, battery load analyzers, and charging system testers.', 'Zap', true, 2),
  ('c1000000-0000-0000-0000-000000000003', 'Workshop Tools & Hardware', 'workshop-tools', 'Precision torque wrenches, socket sets, diagnostic borescopes, and mechanical workshop hardware.', 'Wrench', true, 3),
  ('c1000000-0000-0000-0000-000000000004', 'Vehicle Accessories & Safety', 'accessories-safety', 'Heavy-duty tyre inflators, lithium jump starters, and emergency vehicle safety equipment.', 'ShieldCheck', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Products
INSERT INTO products (
  id, sku, name, slug, category_id, short_description, full_description,
  price_cents, compare_at_price_cents, is_active, is_featured, specs, compatibility
)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'AC-DEV-OBD802',
    'Auto Clinic Pro-Scan V2 OBD2 Scanner',
    'pro-scan-v2-obd2-scanner',
    'c1000000-0000-0000-0000-000000000001',
    'Full-system OBD2 fault code diagnostic scanner with live ECU telemetry and freeze-frame data.',
    'Professional handheld diagnostic scanner engineered for Nigerian road conditions and multi-brand vehicle fleets. Reads and clears Check Engine, ABS, SRS, and Transmission fault codes with comprehensive live sensor data streaming.',
    4850000, -- ₦48,500.00
    5500000,
    true,
    true,
    '[
      {"label": "Protocol Support", "value": "CAN, ISO9141, KWP2000, J1850 PWM/VPW", "isMonospace": true},
      {"label": "Display", "value": "2.8-inch High-Contrast Backlit LCD"},
      {"label": "Operating Voltage", "value": "9V - 18V DC", "isMonospace": true},
      {"label": "Firmware Interface", "value": "USB-C Interface (Firmware update capable)"},
      {"label": "Operating Temp", "value": "-20°C to 70°C", "isMonospace": true}
    ]'::jsonb,
    '["Universal OBD2 (Petrol 1996+, Diesel 2004+)", "Toyota", "Honda", "Mercedes-Benz", "BMW", "Ford", "Hyundai", "Kia"]'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'AC-DEV-BAT1224',
    'Heavy-Duty 12V/24V Digital Battery Analyzer',
    'heavy-duty-battery-analyzer',
    'c1000000-0000-0000-0000-000000000002',
    'Conductance-based battery health, state of charge (SOC), and cold-cranking amp (CCA) analyzer.',
    'Heavy-duty digital battery tester capable of analyzing standard flooded lead-acid, AGM flat plate, AGM spiral, GEL, and EFB battery types across 12V automotive and 24V commercial vehicle electrical systems.',
    3200000, -- ₦32,000.00
    NULL,
    true,
    true,
    '[
      {"label": "Testing Range", "value": "100 - 2000 CCA (Regular, AGM, GEL, EFB)", "isMonospace": true},
      {"label": "Voltage Range", "value": "8V - 30V DC", "isMonospace": true},
      {"label": "Clamp Construction", "value": "Kelvin Double-Conductor Copper Clamps"},
      {"label": "Protection", "value": "Reverse polarity & over-voltage safeguard"}
    ]'::jsonb,
    '["Lead-Acid", "AGM Flat/Spiral", "GEL", "EFB 12V/24V Systems"]'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'AC-DEV-INF150P',
    'Industrial 150 PSI Dual-Cylinder Tyre Inflator',
    'industrial-dual-cylinder-tyre-inflator',
    'c1000000-0000-0000-0000-000000000004',
    'Rugged all-metal dual-piston air compressor with auto-cutoff pressure gauge and direct battery clamps.',
    'High-output 12V portable compressor delivering 60L/min flow rate for rapid tyre inflation of SUVs, commercial pickup trucks, and passenger sedans during workshop and roadside operations.',
    2750000, -- ₦27,500.00
    3100000,
    true,
    true,
    '[
      {"label": "Max Output", "value": "150 PSI (60L/min Flow Rate)", "isMonospace": true},
      {"label": "Power Draw", "value": "12V DC / 18A Max", "isMonospace": true},
      {"label": "Cylinder Bore", "value": "Dual 30mm Anodized Alloy", "isMonospace": true},
      {"label": "Hose Length", "value": "5m Braided Heat-Resistant Air Line"}
    ]'::jsonb,
    '["Sedans", "SUVs", "Light Commercial Trucks", "4x4 Vehicles"]'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'AC-DEV-TORQ12',
    '1/2-Inch Drive Precision Click Torque Wrench',
    'precision-click-torque-wrench',
    'c1000000-0000-0000-0000-000000000003',
    'Hardened chrome-vanadium torque wrench with laser-etched dual scale (Nm / ft-lb) and 72-tooth ratchet.',
    'Calibrated workshop torque wrench for precision mechanical fasteners, cylinder head bolts, wheel lug nuts, and suspension assemblies requiring manufacturer-specified torque limits.',
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
    'a1000000-0000-0000-0000-000000000005',
    'AC-DEV-JMP2000',
    '2000A Peak Lithium Emergency Jump Starter',
    'lithium-emergency-jump-starter',
    'c1000000-0000-0000-0000-000000000004',
    'High-capacity lithium jump box capable of starting up to 8.0L Petrol and 6.0L Diesel engines.',
    'Heavy-duty 18,000 mAh emergency jump starter with integrated LED work light, spark-proof smart clamp cables, and USB-C fast charging output for mobile devices and diagnostic tablets.',
    4100000, -- ₦41,000.00
    NULL,
    true,
    false,
    '[
      {"label": "Peak Current", "value": "2000 Amperes", "isMonospace": true},
      {"label": "Battery Capacity", "value": "18,000 mAh (66.6 Wh)", "isMonospace": true},
      {"label": "USB Output", "value": "Quick Charge 3.0 + USB-C PD 18W", "isMonospace": true},
      {"label": "Safety Protections", "value": "8-Point Smart Clamp Reverse Safeguard"}
    ]'::jsonb,
    '["Up to 8.0L Petrol", "Up to 6.0L Diesel Engines"]'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000006',
    'AC-DEV-BOR1080',
    'Dual-Lens HD Articulating Borescope Camera',
    'dual-lens-borescope-camera',
    'c1000000-0000-0000-0000-000000000003',
    '5-inch IPS diagnostic inspection borescope with 1080P front and side camera lenses.',
    'Non-destructive optical diagnostic tool for inspecting internal cylinder walls, valve seats, piston crowns, catalytic converters, and HVAC evaporator cores without engine teardown.',
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
  ('a1000000-0000-0000-0000-000000000001', 14, 0, 5, false),
  ('a1000000-0000-0000-0000-000000000002', 8,  0, 4, false),
  ('a1000000-0000-0000-0000-000000000003', 3,  0, 5, false),
  ('a1000000-0000-0000-0000-000000000004', 19, 0, 5, false),
  ('a1000000-0000-0000-0000-000000000005', 7,  0, 3, false),
  ('a1000000-0000-0000-0000-000000000006', 0,  0, 3, true)
ON CONFLICT (product_id) DO NOTHING;

-- 4. Insert Diagnostic Services
INSERT INTO diagnostic_services (
  id, code, name, slug, short_summary, estimated_duration, indicative_fee,
  target_systems, recommended_when, is_active, display_order
)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'DIAG-ECU-01',
    'Full ECU Scan & Diagnostic Fault Analysis',
    'ecu-fault-code-scan',
    'Comprehensive electronic control module scan covering engine, transmission, ABS, airbag, and body systems.',
    '45 - 60 Mins (Enquiry-First)',
    'Fee quoted upon review',
    '["Engine ECU", "Automatic Transmission", "ABS / Traction Control", "Airbag / SRS", "BCM"]'::jsonb,
    'Check Engine light illuminated, transmission slipping or harsh shifts, limp mode active, or unusual dashboard warnings.',
    true,
    1
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'DIAG-ELEC-02',
    'Electrical System & Parasitic Drain Triage',
    'electrical-system-triage',
    'Diagnostic isolation for battery discharge, alternator ripple, parasitic sleep current draw, and wiring shorts.',
    '60 - 90 Mins (Enquiry-First)',
    'Fee quoted upon review',
    '["Charging System", "Starter Motor", "Battery Bank", "Fuse Box & Relays", "Ground Cables"]'::jsonb,
    'Battery repeatedly dying overnight, slow cranking, intermittent electrical power loss, or blown fuses.',
    true,
    2
  ),
  (
    'd1000000-0000-0000-0000-000000000003',
    'DIAG-MECH-03',
    'Engine Mechanical Health & Compression Triage',
    'engine-mechanical-triage',
    'Cylinder compression testing, optical borescope combustion chamber inspection, and cooling circuit pressure checks.',
    '90 - 120 Mins (Enquiry-First)',
    'Fee quoted upon review',
    '["Valves & Rings", "Fuel Delivery & Injectors", "Intake Manifold / Smoke Test", "Cooling Circuit"]'::jsonb,
    'Rough engine idle, cylinder misfires under load, excessive exhaust smoke, overheating, or unexplained power loss.',
    true,
    3
  ),
  (
    'd1000000-0000-0000-0000-000000000004',
    'DIAG-PRE-04',
    'Pre-Purchase Comprehensive Vehicle Inspection',
    'pre-purchase-inspection',
    'Multi-point electronic and mechanical evaluation before acquiring a Nigerian-used or imported foreign-used vehicle.',
    '120 - 150 Mins (Enquiry-First)',
    'Fee quoted upon review',
    '["Full Electronic Scan", "Chassis & Suspension", "Fluid Condition", "Brakes & Underbody", "Live Road Test"]'::jsonb,
    'Prior to completing vehicle purchase or finalizing payment on used automotive acquisitions.',
    true,
    4
  )
ON CONFLICT (code) DO NOTHING;
