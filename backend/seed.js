const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Seeding database...');

  // Drop and recreate tables
  await pool.query(`
    DROP TABLE IF EXISTS parking_requirements CASCADE;
    DROP TABLE IF EXISTS noise_compliance CASCADE;
    DROP TABLE IF EXISTS historical_reviews CASCADE;
    DROP TABLE IF EXISTS stormwater_management CASCADE;
    DROP TABLE IF EXISTS ada_compliance CASCADE;
    DROP TABLE IF EXISTS fire_safety_checks CASCADE;
    DROP TABLE IF EXISTS occupancy_classifications CASCADE;
    DROP TABLE IF EXISTS setback_calculations CASCADE;
    DROP TABLE IF EXISTS environmental_assessments CASCADE;
    DROP TABLE IF EXISTS plan_reviews CASCADE;
    DROP TABLE IF EXISTS inspections CASCADE;
    DROP TABLE IF EXISTS code_violations CASCADE;
    DROP TABLE IF EXISTS document_reviews CASCADE;
    DROP TABLE IF EXISTS zoning_checks CASCADE;
    DROP TABLE IF EXISTS permit_applications CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);

  // Users table
  await pool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'reviewer',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const hash = await bcrypt.hash('password123', 10);
  await pool.query(`
    INSERT INTO users (email, password_hash, name, role) VALUES
    ('admin@permitzone.com', '${hash}', 'Admin User', 'admin'),
    ('reviewer@permitzone.com', '${hash}', 'Jane Reviewer', 'reviewer'),
    ('inspector@permitzone.com', '${hash}', 'Bob Inspector', 'inspector')
  `);

  // 1. Permit Applications
  await pool.query(`
    CREATE TABLE permit_applications (
      id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      applicant_name VARCHAR(255) NOT NULL,
      property_address VARCHAR(500) NOT NULL,
      permit_type VARCHAR(100) NOT NULL,
      description TEXT,
      estimated_cost DECIMAL(12,2),
      square_footage INTEGER,
      status VARCHAR(50) DEFAULT 'Pending Review',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO permit_applications (project_name, applicant_name, property_address, permit_type, description, estimated_cost, square_footage, status) VALUES
    ('Downtown Office Tower', 'Smith Construction LLC', '100 Main St, Springfield, IL', 'Commercial New Build', 'New 12-story office tower with underground parking', 25000000, 180000, 'Under Review'),
    ('Riverside Apartments', 'Green Living Dev', '250 River Rd, Springfield, IL', 'Residential Multi-Family', '48-unit apartment complex with amenities', 12000000, 65000, 'Approved'),
    ('Sunset Mall Expansion', 'Retail Properties Inc', '500 Commerce Dr, Springfield, IL', 'Commercial Renovation', 'Adding 40,000 sq ft retail wing', 8500000, 40000, 'Pending Review'),
    ('Heritage School Addition', 'Springfield School District', '300 Oak Ave, Springfield, IL', 'Institutional', 'New gymnasium and classroom wing', 6000000, 25000, 'Under Review'),
    ('Green Valley Medical Center', 'HealthFirst Corp', '1200 Medical Pkwy, Springfield, IL', 'Healthcare Facility', 'Outpatient surgery center and clinic', 15000000, 45000, 'Approved'),
    ('Lakeside Townhomes', 'Precision Builders', '75 Lakeview Dr, Springfield, IL', 'Residential Townhouse', '24 luxury townhome units', 9600000, 48000, 'Pending Review'),
    ('Tech Hub Innovation Center', 'TechStart Inc', '400 Innovation Blvd, Springfield, IL', 'Mixed-Use', 'Office space with ground floor retail and co-working', 18000000, 55000, 'Under Review'),
    ('Community Fire Station #7', 'City of Springfield', '800 Safety Ln, Springfield, IL', 'Municipal', 'New fire station with 4 bays', 4500000, 12000, 'Approved'),
    ('Parkview Senior Living', 'Elder Care Properties', '150 Park Ave, Springfield, IL', 'Assisted Living', '60-bed senior living facility', 11000000, 42000, 'Pending Review'),
    ('Industrial Warehouse Complex', 'Logistics Hub LLC', '2000 Industrial Pkwy, Springfield, IL', 'Industrial', 'Three-building warehouse distribution center', 7500000, 120000, 'Under Review'),
    ('Boutique Hotel Conversion', 'Hospitality Group', '55 Heritage St, Springfield, IL', 'Hospitality', 'Convert historic building to 35-room hotel', 5200000, 28000, 'Pending Review'),
    ('Solar Farm Installation', 'Clean Energy Co', '4000 Rural Rt 5, Springfield, IL', 'Utility', '50-acre solar panel installation', 3000000, 2178000, 'Approved'),
    ('Childrens Museum', 'Springfield Cultural Foundation', '200 Museum Way, Springfield, IL', 'Cultural/Recreation', 'Interactive children museum with outdoor play area', 8000000, 30000, 'Under Review'),
    ('Highway Rest Stop Renovation', 'IDOT', 'I-55 Mile Marker 98, Springfield, IL', 'Transportation', 'Complete renovation of rest area facilities', 2500000, 8000, 'Pending Review'),
    ('Organic Food Processing Plant', 'Farm Fresh Foods', '1500 Agriculture Dr, Springfield, IL', 'Food Processing', 'USDA-compliant food processing and packaging facility', 6500000, 35000, 'Under Review'),
    ('Community Swimming Pool', 'Springfield Parks Dept', '350 Recreation Blvd, Springfield, IL', 'Recreation', 'Olympic-size pool with splash pad and bathhouse', 3800000, 15000, 'Pending Review')
  `);

  // 2. Zoning Checks
  await pool.query(`
    CREATE TABLE zoning_checks (
      id SERIAL PRIMARY KEY,
      property_address VARCHAR(500) NOT NULL,
      zone_type VARCHAR(100) NOT NULL,
      proposed_use VARCHAR(255) NOT NULL,
      current_use VARCHAR(255),
      lot_size DECIMAL(10,2),
      building_height DECIMAL(6,2),
      lot_coverage DECIMAL(5,2),
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO zoning_checks (property_address, zone_type, proposed_use, current_use, lot_size, building_height, lot_coverage, status) VALUES
    ('100 Main St', 'C-3 Commercial', 'Office Tower', 'Parking Lot', 22000, 150, 65, 'Compliant'),
    ('250 River Rd', 'R-4 High Density Residential', 'Apartment Complex', 'Vacant', 45000, 55, 45, 'Compliant'),
    ('500 Commerce Dr', 'C-2 General Commercial', 'Retail Expansion', 'Retail Mall', 120000, 35, 70, 'Under Review'),
    ('300 Oak Ave', 'I-1 Institutional', 'School Addition', 'School', 80000, 40, 35, 'Compliant'),
    ('1200 Medical Pkwy', 'C-4 Commercial/Medical', 'Medical Center', 'Vacant', 55000, 45, 50, 'Compliant'),
    ('75 Lakeview Dr', 'R-3 Medium Density', 'Townhomes', 'Single Family', 60000, 35, 40, 'Variance Needed'),
    ('400 Innovation Blvd', 'MU-1 Mixed Use', 'Office/Retail', 'Warehouse', 35000, 65, 60, 'Under Review'),
    ('800 Safety Ln', 'I-1 Institutional', 'Fire Station', 'Vacant', 25000, 35, 30, 'Compliant'),
    ('150 Park Ave', 'R-4 High Density', 'Senior Living', 'Vacant', 48000, 45, 42, 'Compliant'),
    ('2000 Industrial Pkwy', 'M-2 Heavy Industrial', 'Warehouse', 'Vacant', 200000, 40, 55, 'Compliant'),
    ('55 Heritage St', 'HD Historic District', 'Hotel', 'Office', 15000, 50, 75, 'Under Review'),
    ('4000 Rural Rt 5', 'AG Agricultural', 'Solar Farm', 'Farmland', 2178000, 10, 5, 'Special Use Permit'),
    ('200 Museum Way', 'C-1 Neighborhood Commercial', 'Museum', 'Retail', 40000, 30, 45, 'Variance Needed'),
    ('1500 Agriculture Dr', 'M-1 Light Industrial', 'Food Processing', 'Vacant', 85000, 35, 45, 'Compliant'),
    ('350 Recreation Blvd', 'PR Parks/Recreation', 'Swimming Pool', 'Open Space', 50000, 15, 20, 'Compliant'),
    ('600 University Ave', 'R-2 Low Density', 'Duplex Conversion', 'Single Family', 8000, 28, 50, 'Non-Compliant')
  `);

  // 3. Document Reviews
  await pool.query(`
    CREATE TABLE document_reviews (
      id SERIAL PRIMARY KEY,
      document_name VARCHAR(255) NOT NULL,
      document_type VARCHAR(100) NOT NULL,
      project_name VARCHAR(255) NOT NULL,
      submitted_by VARCHAR(255),
      description TEXT,
      page_count INTEGER,
      status VARCHAR(50) DEFAULT 'Pending Review',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO document_reviews (document_name, document_type, project_name, submitted_by, description, page_count, status) VALUES
    ('Structural Engineering Report', 'Engineering', 'Downtown Office Tower', 'ABC Engineering', 'Complete structural analysis and load calculations', 85, 'Under Review'),
    ('Architectural Plans Set A', 'Architecture', 'Riverside Apartments', 'Modern Design Studio', 'Full architectural plan set including elevations', 120, 'Approved'),
    ('Geotechnical Survey', 'Survey', 'Sunset Mall Expansion', 'GeoTech Solutions', 'Soil boring and foundation recommendations', 45, 'Approved'),
    ('MEP Plans', 'Mechanical/Electrical', 'Heritage School Addition', 'Systems Engineering Inc', 'Mechanical, electrical, and plumbing plans', 95, 'Under Review'),
    ('Site Development Plan', 'Civil', 'Green Valley Medical Center', 'Civil Works LLC', 'Grading, drainage, and utility plans', 60, 'Approved'),
    ('Landscape Architecture Plan', 'Landscape', 'Lakeside Townhomes', 'Green Thumb Design', 'Landscaping, irrigation, and hardscape plans', 35, 'Pending Review'),
    ('Traffic Impact Study', 'Traffic', 'Tech Hub Innovation Center', 'Traffic Solutions Inc', 'Traffic flow analysis and mitigation plan', 55, 'Under Review'),
    ('Fire Protection Plans', 'Fire Safety', 'Community Fire Station #7', 'Fire Systems Design', 'Sprinkler and fire alarm system plans', 40, 'Approved'),
    ('ADA Compliance Report', 'Accessibility', 'Parkview Senior Living', 'Access Consulting', 'Full ADA compliance assessment', 30, 'Pending Review'),
    ('Environmental Site Assessment', 'Environmental', 'Industrial Warehouse Complex', 'EcoAnalysis Corp', 'Phase I and Phase II environmental assessment', 70, 'Under Review'),
    ('Historic Preservation Report', 'Historical', 'Boutique Hotel Conversion', 'Heritage Architects', 'Assessment of historical significance and preservation plan', 50, 'Under Review'),
    ('Electrical Load Analysis', 'Electrical', 'Solar Farm Installation', 'PowerGrid Engineers', 'Grid interconnection and load analysis', 40, 'Approved'),
    ('Building Energy Model', 'Energy', 'Childrens Museum', 'Energy Plus Consulting', 'Energy efficiency modeling and HVAC design', 35, 'Pending Review'),
    ('Stormwater Management Plan', 'Civil', 'Highway Rest Stop Renovation', 'Water Resources Inc', 'Stormwater detention and treatment plan', 25, 'Under Review'),
    ('Food Safety Facility Plan', 'Health/Safety', 'Organic Food Processing Plant', 'SafeFood Consultants', 'USDA facility layout and process flow plan', 45, 'Pending Review'),
    ('Pool Engineering Plans', 'Aquatics', 'Community Swimming Pool', 'Aqua Engineering', 'Pool structure, filtration, and chemical systems', 30, 'Under Review')
  `);

  // 4. Code Violations
  await pool.query(`
    CREATE TABLE code_violations (
      id SERIAL PRIMARY KEY,
      property_address VARCHAR(500) NOT NULL,
      violation_type VARCHAR(100) NOT NULL,
      code_section VARCHAR(100) NOT NULL,
      description TEXT,
      severity VARCHAR(50),
      reported_by VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Open',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO code_violations (property_address, violation_type, code_section, description, severity, reported_by, status) VALUES
    ('150 Elm St', 'Structural', 'IBC 1604.3', 'Load-bearing wall removed without permit', 'Critical', 'Inspector Johnson', 'Open'),
    ('300 Pine Ave', 'Electrical', 'NEC 210.12', 'Missing AFCI protection in bedrooms', 'Major', 'Inspector Smith', 'In Progress'),
    ('45 Cedar Ln', 'Plumbing', 'IPC 301.2', 'Unpermitted bathroom addition with improper venting', 'Major', 'Inspector Davis', 'Open'),
    ('800 Maple Dr', 'Fire Safety', 'IFC 903.2', 'Fire sprinkler system not operational', 'Critical', 'Fire Marshal Williams', 'Corrected'),
    ('1200 Oak Blvd', 'Zoning', 'ZC 5.4.1', 'Commercial use in residential zone', 'Major', 'Zoning Officer Brown', 'Open'),
    ('555 Birch St', 'Building Envelope', 'IBC 1403.2', 'Improper flashing at roof-wall junction causing water intrusion', 'Moderate', 'Inspector Johnson', 'In Progress'),
    ('220 Walnut Ave', 'Accessibility', 'ADA 4.1.3', 'No accessible entrance to public building', 'Major', 'ADA Coordinator Lee', 'Open'),
    ('900 Spruce Ct', 'Mechanical', 'IMC 501.2', 'Kitchen exhaust hood not to code in restaurant', 'Critical', 'Health Inspector Garcia', 'In Progress'),
    ('1050 Ash Way', 'Energy Code', 'IECC C402.1', 'Insufficient insulation in commercial building envelope', 'Moderate', 'Energy Auditor Kim', 'Open'),
    ('675 Willow Rd', 'Site', 'ZC 8.2.3', 'Fence exceeds maximum height in front yard', 'Minor', 'Code Enforcement Taylor', 'Corrected'),
    ('325 Hickory Pl', 'Structural', 'IBC 2304.11', 'Untreated wood in contact with soil', 'Major', 'Inspector Johnson', 'Open'),
    ('480 Chestnut Dr', 'Electrical', 'NEC 680.21', 'Pool wiring not GFCI protected', 'Critical', 'Inspector Smith', 'In Progress'),
    ('1100 Dogwood Ln', 'Fire Safety', 'IFC 1031.2', 'Emergency exit blocked by storage', 'Critical', 'Fire Marshal Williams', 'Open'),
    ('750 Poplar St', 'Plumbing', 'IPC 504.6', 'Water heater lacks required safety valve', 'Major', 'Inspector Davis', 'Corrected'),
    ('200 Sycamore Ave', 'Zoning', 'ZC 3.2.5', 'Setback violation - structure too close to property line', 'Major', 'Zoning Officer Brown', 'Open'),
    ('890 Magnolia Ct', 'Building', 'IBC 1015.2', 'Guardrail height insufficient on elevated deck', 'Moderate', 'Inspector Johnson', 'In Progress')
  `);

  // 5. Inspections
  await pool.query(`
    CREATE TABLE inspections (
      id SERIAL PRIMARY KEY,
      property_address VARCHAR(500) NOT NULL,
      inspection_type VARCHAR(100) NOT NULL,
      inspector_name VARCHAR(255),
      inspection_date DATE,
      project_name VARCHAR(255),
      notes TEXT,
      status VARCHAR(50) DEFAULT 'Scheduled',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO inspections (property_address, inspection_type, inspector_name, inspection_date, project_name, notes, status) VALUES
    ('100 Main St', 'Foundation', 'Bob Inspector', '2026-03-20', 'Downtown Office Tower', 'Verify footing depth and rebar placement', 'Scheduled'),
    ('250 River Rd', 'Framing', 'Mike Chen', '2026-03-18', 'Riverside Apartments', 'Check structural framing for Building A', 'In Progress'),
    ('500 Commerce Dr', 'Rough Electrical', 'Sarah Wilson', '2026-03-22', 'Sunset Mall Expansion', 'Inspect electrical rough-in for new wing', 'Scheduled'),
    ('300 Oak Ave', 'Rough Plumbing', 'Tom Harris', '2026-03-15', 'Heritage School Addition', 'Verify plumbing rough-in before drywall', 'Passed'),
    ('1200 Medical Pkwy', 'Final Inspection', 'Bob Inspector', '2026-03-25', 'Green Valley Medical Center', 'Final walkthrough before CO issuance', 'Scheduled'),
    ('75 Lakeview Dr', 'Footing/Foundation', 'Mike Chen', '2026-03-19', 'Lakeside Townhomes', 'Inspect footings for Units 1-6', 'Scheduled'),
    ('400 Innovation Blvd', 'Structural Steel', 'Sarah Wilson', '2026-03-17', 'Tech Hub Innovation Center', 'Verify steel connections and welding', 'Failed'),
    ('800 Safety Ln', 'Rough Mechanical', 'Tom Harris', '2026-03-16', 'Community Fire Station #7', 'HVAC and mechanical rough-in inspection', 'Passed'),
    ('150 Park Ave', 'Insulation/Energy', 'Bob Inspector', '2026-03-21', 'Parkview Senior Living', 'Energy code compliance - insulation inspection', 'Scheduled'),
    ('2000 Industrial Pkwy', 'Slab on Grade', 'Mike Chen', '2026-03-14', 'Industrial Warehouse Complex', 'Pre-pour slab inspection for Building 1', 'Passed'),
    ('55 Heritage St', 'Demolition', 'Sarah Wilson', '2026-03-23', 'Boutique Hotel Conversion', 'Interior demolition safety inspection', 'Scheduled'),
    ('4000 Rural Rt 5', 'Electrical Systems', 'Tom Harris', '2026-03-13', 'Solar Farm Installation', 'Inverter and panel wiring inspection', 'Passed'),
    ('200 Museum Way', 'Fire Protection', 'Bob Inspector', '2026-03-24', 'Childrens Museum', 'Sprinkler system installation inspection', 'Scheduled'),
    ('1500 Agriculture Dr', 'Health Department', 'Mike Chen', '2026-03-12', 'Organic Food Processing Plant', 'Food safety facility pre-operational inspection', 'Failed'),
    ('350 Recreation Blvd', 'Pool Safety', 'Sarah Wilson', '2026-03-26', 'Community Swimming Pool', 'Pool barrier and safety equipment inspection', 'Scheduled'),
    ('600 University Ave', 'Pre-Construction', 'Tom Harris', '2026-03-27', 'University Plaza Renovation', 'Site conditions and demolition plan review', 'Scheduled')
  `);

  // 6. Plan Reviews
  await pool.query(`
    CREATE TABLE plan_reviews (
      id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      plan_type VARCHAR(100) NOT NULL,
      architect VARCHAR(255),
      engineer VARCHAR(255),
      description TEXT,
      building_type VARCHAR(100),
      stories INTEGER,
      status VARCHAR(50) DEFAULT 'Submitted',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO plan_reviews (project_name, plan_type, architect, engineer, description, building_type, stories, status) VALUES
    ('Downtown Office Tower', 'Structural', 'Modern Arch LLC', 'Strong Engineering', 'Steel frame high-rise structural review', 'Type I-A', 12, 'In Review'),
    ('Riverside Apartments', 'Architectural', 'Design Studio Pro', 'Civil Plus Inc', 'Wood frame multi-family residential', 'Type V-A', 4, 'Approved'),
    ('Sunset Mall Expansion', 'Site Plan', 'Commercial Design Co', 'Site Engineering LLC', 'Retail expansion site development plan', 'Type II-B', 2, 'In Review'),
    ('Heritage School Addition', 'MEP', 'School Architects', 'Systems Design Inc', 'HVAC, electrical, and plumbing design', 'Type II-A', 2, 'Submitted'),
    ('Green Valley Medical Center', 'Fire Protection', 'Healthcare Design', 'Fire Systems Corp', 'Complete fire suppression system design', 'Type I-B', 3, 'Approved'),
    ('Lakeside Townhomes', 'Structural', 'Residential Pros', 'Foundation Experts', 'Foundation and framing design review', 'Type V-B', 3, 'In Review'),
    ('Tech Hub Innovation Center', 'Architectural', 'Innovation Architects', 'Tech Engineering', 'Mixed-use building full plan review', 'Type III-A', 5, 'Submitted'),
    ('Community Fire Station #7', 'Complete Review', 'Public Works Design', 'Municipal Engineers', 'All disciplines for new fire station', 'Type II-A', 1, 'Approved'),
    ('Parkview Senior Living', 'Accessibility', 'Care Facility Design', 'ADA Engineers', 'ADA and accessibility compliance review', 'Type V-A', 3, 'In Review'),
    ('Industrial Warehouse Complex', 'Structural', 'Industrial Architects', 'Steel Design Inc', 'Pre-engineered metal building review', 'Type II-B', 1, 'Submitted'),
    ('Boutique Hotel Conversion', 'Historic Preservation', 'Heritage Architects', 'Restoration Engineers', 'Adaptive reuse plan for historic building', 'Type III-B', 4, 'In Review'),
    ('Solar Farm Installation', 'Electrical', 'Solar Design Co', 'Power Engineers', 'Solar array and grid interconnection design', 'N/A', 0, 'Approved'),
    ('Childrens Museum', 'Life Safety', 'Museum Designers', 'Safety Engineering', 'Life safety and egress plan review', 'Type II-B', 2, 'Submitted'),
    ('Organic Food Processing Plant', 'Industrial', 'Food Facility Architects', 'Process Engineers', 'Food processing facility layout and systems', 'Type II-B', 1, 'In Review'),
    ('Community Swimming Pool', 'Aquatics', 'Recreation Architects', 'Aquatic Engineers', 'Pool structure and mechanical systems review', 'Type V-B', 1, 'Submitted'),
    ('Highway Rest Stop', 'Site Plan', 'IDOT Architects', 'Transportation Engineers', 'Rest area renovation and site improvements', 'Type V-B', 1, 'In Review')
  `);

  // 7. Environmental Assessments
  await pool.query(`
    CREATE TABLE environmental_assessments (
      id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      property_address VARCHAR(500) NOT NULL,
      assessment_type VARCHAR(100) NOT NULL,
      ecosystem_type VARCHAR(100),
      acreage DECIMAL(10,2),
      description TEXT,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO environmental_assessments (project_name, property_address, assessment_type, ecosystem_type, acreage, description, status) VALUES
    ('Downtown Office Tower', '100 Main St', 'Phase I ESA', 'Urban', 2.5, 'Environmental site assessment for brownfield development', 'Completed'),
    ('Riverside Apartments', '250 River Rd', 'Wetland Delineation', 'Riparian', 5.2, 'Wetland boundary determination near river', 'In Progress'),
    ('Sunset Mall Expansion', '500 Commerce Dr', 'Phase II ESA', 'Urban', 3.0, 'Soil and groundwater sampling for former gas station', 'Completed'),
    ('Lakeside Townhomes', '75 Lakeview Dr', 'Habitat Assessment', 'Lakeshore', 4.8, 'Protected species habitat evaluation', 'In Progress'),
    ('Industrial Warehouse Complex', '2000 Industrial Pkwy', 'Phase I ESA', 'Industrial', 12.0, 'Environmental assessment for industrial site', 'Completed'),
    ('Solar Farm Installation', '4000 Rural Rt 5', 'Wildlife Impact', 'Agricultural/Prairie', 50.0, 'Impact on migratory birds and native grassland', 'In Progress'),
    ('Highway Rest Stop Renovation', 'I-55 Mile Marker 98', 'Stormwater Assessment', 'Highway Corridor', 5.0, 'Stormwater runoff and water quality assessment', 'Pending'),
    ('Organic Food Processing Plant', '1500 Agriculture Dr', 'Air Quality', 'Industrial', 8.5, 'Air emissions assessment for food processing', 'Completed'),
    ('Community Swimming Pool', '350 Recreation Blvd', 'Soil Assessment', 'Urban Park', 3.0, 'Soil contamination screening for park site', 'Pending'),
    ('Green Valley Medical Center', '1200 Medical Pkwy', 'Phase I ESA', 'Suburban', 6.0, 'Environmental due diligence for medical campus', 'Completed'),
    ('Tech Hub Innovation Center', '400 Innovation Blvd', 'Brownfield Assessment', 'Urban/Industrial', 4.0, 'Former warehouse site contamination review', 'In Progress'),
    ('Boutique Hotel Conversion', '55 Heritage St', 'Lead/Asbestos Survey', 'Historic Urban', 0.8, 'Hazardous materials survey for historic building', 'Completed'),
    ('Heritage School Addition', '300 Oak Ave', 'Noise Impact', 'Suburban', 8.0, 'Construction noise impact on school operations', 'Pending'),
    ('Parkview Senior Living', '150 Park Ave', 'Tree Survey', 'Urban/Park', 4.5, 'Protected tree inventory and preservation plan', 'In Progress'),
    ('Childrens Museum', '200 Museum Way', 'Phase I ESA', 'Urban', 3.5, 'Environmental site assessment for museum site', 'Pending'),
    ('Community Fire Station #7', '800 Safety Ln', 'Soil Assessment', 'Suburban', 2.8, 'Geotechnical and environmental soil assessment', 'Completed')
  `);

  // 8. Setback Calculations
  await pool.query(`
    CREATE TABLE setback_calculations (
      id SERIAL PRIMARY KEY,
      property_address VARCHAR(500) NOT NULL,
      zone_type VARCHAR(100) NOT NULL,
      lot_width DECIMAL(8,2),
      lot_depth DECIMAL(8,2),
      front_setback DECIMAL(6,2),
      rear_setback DECIMAL(6,2),
      side_setback DECIMAL(6,2),
      proposed_structure VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Calculated',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO setback_calculations (property_address, zone_type, lot_width, lot_depth, front_setback, rear_setback, side_setback, proposed_structure, status) VALUES
    ('100 Main St', 'C-3 Commercial', 150, 200, 0, 10, 0, 'Office Tower', 'Compliant'),
    ('250 River Rd', 'R-4 Residential', 200, 300, 25, 30, 15, 'Apartment Building', 'Compliant'),
    ('75 Lakeview Dr', 'R-3 Residential', 60, 120, 25, 25, 8, 'Townhome Unit', 'Variance Required'),
    ('300 Oak Ave', 'I-1 Institutional', 250, 400, 35, 40, 20, 'School Wing', 'Compliant'),
    ('1200 Medical Pkwy', 'C-4 Medical', 180, 250, 20, 25, 15, 'Medical Center', 'Compliant'),
    ('400 Innovation Blvd', 'MU-1 Mixed Use', 120, 180, 5, 15, 5, 'Mixed-Use Building', 'Compliant'),
    ('800 Safety Ln', 'I-1 Institutional', 150, 200, 30, 30, 15, 'Fire Station', 'Compliant'),
    ('150 Park Ave', 'R-4 Residential', 180, 280, 25, 30, 15, 'Senior Living', 'Compliant'),
    ('2000 Industrial Pkwy', 'M-2 Industrial', 300, 500, 40, 20, 20, 'Warehouse', 'Compliant'),
    ('55 Heritage St', 'HD Historic', 50, 100, 0, 5, 0, 'Hotel Renovation', 'Compliant'),
    ('200 Museum Way', 'C-1 Commercial', 140, 220, 15, 20, 10, 'Museum Building', 'Compliant'),
    ('1500 Agriculture Dr', 'M-1 Light Industrial', 250, 350, 30, 25, 15, 'Processing Plant', 'Compliant'),
    ('350 Recreation Blvd', 'PR Parks', 200, 300, 20, 20, 15, 'Pool/Bathhouse', 'Compliant'),
    ('600 University Ave', 'R-2 Residential', 55, 110, 25, 25, 8, 'Duplex', 'Non-Compliant'),
    ('450 Cherry Ln', 'R-1 Residential', 70, 140, 30, 30, 10, 'Single Family Home', 'Compliant'),
    ('820 Peach St', 'R-2 Residential', 50, 100, 20, 20, 5, 'Addition', 'Variance Required')
  `);

  // 9. Occupancy Classifications
  await pool.query(`
    CREATE TABLE occupancy_classifications (
      id SERIAL PRIMARY KEY,
      building_name VARCHAR(255) NOT NULL,
      building_address VARCHAR(500) NOT NULL,
      building_use VARCHAR(255) NOT NULL,
      square_footage INTEGER,
      num_floors INTEGER,
      max_occupants INTEGER,
      construction_type VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO occupancy_classifications (building_name, building_address, building_use, square_footage, num_floors, max_occupants, construction_type, status) VALUES
    ('Downtown Office Tower', '100 Main St', 'Business Office (Group B)', 180000, 12, 1800, 'Type I-A', 'Classified'),
    ('Riverside Apartments', '250 River Rd', 'Residential (Group R-2)', 65000, 4, 192, 'Type V-A', 'Classified'),
    ('Sunset Mall', '500 Commerce Dr', 'Mercantile (Group M)', 160000, 2, 3200, 'Type II-B', 'Classified'),
    ('Heritage School', '300 Oak Ave', 'Educational (Group E)', 75000, 2, 800, 'Type II-A', 'Classified'),
    ('Green Valley Medical', '1200 Medical Pkwy', 'Institutional (Group I-2)', 45000, 3, 350, 'Type I-B', 'Classified'),
    ('Lakeside Townhomes', '75 Lakeview Dr', 'Residential (Group R-3)', 48000, 3, 96, 'Type V-B', 'Pending'),
    ('Tech Hub Center', '400 Innovation Blvd', 'Mixed B/M', 55000, 5, 650, 'Type III-A', 'Under Review'),
    ('Fire Station #7', '800 Safety Ln', 'Utility (Group U)', 12000, 1, 30, 'Type II-A', 'Classified'),
    ('Parkview Senior Living', '150 Park Ave', 'Institutional (Group I-1)', 42000, 3, 120, 'Type V-A', 'Classified'),
    ('Industrial Warehouse', '2000 Industrial Pkwy', 'Storage (Group S-1)', 120000, 1, 50, 'Type II-B', 'Classified'),
    ('Heritage Hotel', '55 Heritage St', 'Residential (Group R-1)', 28000, 4, 140, 'Type III-B', 'Under Review'),
    ('Childrens Museum', '200 Museum Way', 'Assembly (Group A-3)', 30000, 2, 600, 'Type II-B', 'Pending'),
    ('Food Processing Plant', '1500 Agriculture Dr', 'Factory (Group F-1)', 35000, 1, 100, 'Type II-B', 'Classified'),
    ('Community Pool', '350 Recreation Blvd', 'Assembly (Group A-4)', 15000, 1, 500, 'Type V-B', 'Pending'),
    ('Highway Rest Stop', 'I-55 Mile Marker 98', 'Assembly (Group A-3)', 8000, 1, 150, 'Type V-B', 'Classified'),
    ('Solar Farm Control', '4000 Rural Rt 5', 'Utility (Group U)', 2000, 1, 10, 'Type V-B', 'Classified')
  `);

  // 10. Fire Safety Checks
  await pool.query(`
    CREATE TABLE fire_safety_checks (
      id SERIAL PRIMARY KEY,
      building_name VARCHAR(255) NOT NULL,
      building_address VARCHAR(500) NOT NULL,
      building_type VARCHAR(100) NOT NULL,
      square_footage INTEGER,
      num_floors INTEGER,
      has_sprinklers BOOLEAN,
      has_fire_alarm BOOLEAN,
      fire_exits INTEGER,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO fire_safety_checks (building_name, building_address, building_type, square_footage, num_floors, has_sprinklers, has_fire_alarm, fire_exits, status) VALUES
    ('Downtown Office Tower', '100 Main St', 'High-Rise Office', 180000, 12, true, true, 8, 'Compliant'),
    ('Riverside Apartments', '250 River Rd', 'Multi-Family Residential', 65000, 4, true, true, 6, 'Compliant'),
    ('Sunset Mall', '500 Commerce Dr', 'Retail/Commercial', 160000, 2, true, true, 12, 'Under Review'),
    ('Heritage School', '300 Oak Ave', 'Educational', 75000, 2, true, true, 10, 'Compliant'),
    ('Green Valley Medical', '1200 Medical Pkwy', 'Healthcare', 45000, 3, true, true, 8, 'Compliant'),
    ('Lakeside Townhomes', '75 Lakeview Dr', 'Residential Townhouse', 48000, 3, false, true, 24, 'Non-Compliant'),
    ('Tech Hub Center', '400 Innovation Blvd', 'Mixed-Use', 55000, 5, true, true, 6, 'Under Review'),
    ('Fire Station #7', '800 Safety Ln', 'Emergency Services', 12000, 1, true, true, 4, 'Compliant'),
    ('Parkview Senior Living', '150 Park Ave', 'Assisted Living', 42000, 3, true, true, 8, 'Compliant'),
    ('Industrial Warehouse', '2000 Industrial Pkwy', 'Industrial/Storage', 120000, 1, true, true, 6, 'Under Review'),
    ('Heritage Hotel', '55 Heritage St', 'Hospitality', 28000, 4, true, true, 4, 'Non-Compliant'),
    ('Childrens Museum', '200 Museum Way', 'Assembly', 30000, 2, true, true, 6, 'Pending'),
    ('Food Processing Plant', '1500 Agriculture Dr', 'Industrial', 35000, 1, true, true, 4, 'Compliant'),
    ('Community Pool', '350 Recreation Blvd', 'Recreation', 15000, 1, false, true, 4, 'Pending'),
    ('Highway Rest Stop', 'I-55 Mile Marker 98', 'Transportation', 8000, 1, false, true, 4, 'Non-Compliant'),
    ('Solar Farm Control Bldg', '4000 Rural Rt 5', 'Utility', 2000, 1, false, false, 2, 'Pending')
  `);

  // 11. ADA Compliance
  await pool.query(`
    CREATE TABLE ada_compliance (
      id SERIAL PRIMARY KEY,
      building_name VARCHAR(255) NOT NULL,
      building_address VARCHAR(500) NOT NULL,
      building_type VARCHAR(100) NOT NULL,
      has_ramp BOOLEAN,
      has_elevator BOOLEAN,
      accessible_restrooms INTEGER,
      accessible_parking INTEGER,
      door_width DECIMAL(5,2),
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO ada_compliance (building_name, building_address, building_type, has_ramp, has_elevator, accessible_restrooms, accessible_parking, door_width, status) VALUES
    ('Downtown Office Tower', '100 Main St', 'Office', true, true, 12, 8, 36, 'Compliant'),
    ('Riverside Apartments', '250 River Rd', 'Residential', true, true, 10, 6, 36, 'Compliant'),
    ('Sunset Mall', '500 Commerce Dr', 'Retail', true, true, 16, 12, 36, 'Compliant'),
    ('Heritage School', '300 Oak Ave', 'Educational', true, true, 8, 6, 36, 'Compliant'),
    ('Green Valley Medical', '1200 Medical Pkwy', 'Healthcare', true, true, 10, 8, 36, 'Compliant'),
    ('Lakeside Townhomes', '75 Lakeview Dr', 'Residential', false, false, 2, 2, 34, 'Non-Compliant'),
    ('Tech Hub Center', '400 Innovation Blvd', 'Mixed-Use', true, true, 6, 4, 36, 'Under Review'),
    ('Fire Station #7', '800 Safety Ln', 'Emergency', true, false, 2, 2, 36, 'Compliant'),
    ('Parkview Senior Living', '150 Park Ave', 'Assisted Living', true, true, 12, 8, 42, 'Compliant'),
    ('Industrial Warehouse', '2000 Industrial Pkwy', 'Industrial', true, false, 4, 4, 36, 'Under Review'),
    ('Heritage Hotel', '55 Heritage St', 'Hotel', true, true, 6, 4, 36, 'Non-Compliant'),
    ('Childrens Museum', '200 Museum Way', 'Assembly', true, true, 6, 6, 36, 'Pending'),
    ('Food Processing Plant', '1500 Agriculture Dr', 'Industrial', true, false, 2, 3, 36, 'Compliant'),
    ('Community Pool', '350 Recreation Blvd', 'Recreation', true, false, 4, 4, 36, 'Under Review'),
    ('Highway Rest Stop', 'I-55 Mile Marker 98', 'Transportation', true, false, 4, 6, 36, 'Compliant'),
    ('Solar Farm Control', '4000 Rural Rt 5', 'Utility', false, false, 1, 1, 32, 'Non-Compliant')
  `);

  // 12. Stormwater Management
  await pool.query(`
    CREATE TABLE stormwater_management (
      id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      property_address VARCHAR(500) NOT NULL,
      site_area DECIMAL(10,2),
      impervious_area DECIMAL(10,2),
      drainage_basin VARCHAR(100),
      soil_type VARCHAR(50),
      proposed_bmp VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO stormwater_management (project_name, property_address, site_area, impervious_area, drainage_basin, soil_type, proposed_bmp, status) VALUES
    ('Downtown Office Tower', '100 Main St', 2.5, 45000, 'Sugar Creek', 'Type C Clay', 'Underground detention vault', 'Approved'),
    ('Riverside Apartments', '250 River Rd', 5.2, 35000, 'Sangamon River', 'Type B Silt Loam', 'Bioretention basin and rain gardens', 'Under Review'),
    ('Sunset Mall Expansion', '500 Commerce Dr', 3.0, 80000, 'Sugar Creek', 'Type C Clay', 'Detention pond expansion', 'Approved'),
    ('Lakeside Townhomes', '75 Lakeview Dr', 4.8, 28000, 'Lake Springfield', 'Type A Sandy Loam', 'Permeable pavers and bioswales', 'Under Review'),
    ('Tech Hub Innovation Center', '400 Innovation Blvd', 4.0, 32000, 'Sugar Creek', 'Type C Clay', 'Green roof and cistern', 'Pending'),
    ('Industrial Warehouse Complex', '2000 Industrial Pkwy', 12.0, 150000, 'Horse Creek', 'Type D Heavy Clay', 'Detention basin with outlet control', 'Approved'),
    ('Heritage School Addition', '300 Oak Ave', 8.0, 25000, 'Sugar Creek', 'Type B Silt Loam', 'Rain garden and underground storage', 'Approved'),
    ('Solar Farm Installation', '4000 Rural Rt 5', 50.0, 5000, 'Prairie Creek', 'Type B Silt Loam', 'Vegetated swales and filter strips', 'Under Review'),
    ('Organic Food Processing', '1500 Agriculture Dr', 8.5, 40000, 'Horse Creek', 'Type C Clay', 'Constructed wetland', 'Pending'),
    ('Community Swimming Pool', '350 Recreation Blvd', 3.0, 12000, 'Sugar Creek', 'Type B Silt Loam', 'Pervious concrete and rain garden', 'Pending'),
    ('Green Valley Medical', '1200 Medical Pkwy', 6.0, 35000, 'Sugar Creek', 'Type C Clay', 'Underground detention system', 'Approved'),
    ('Parkview Senior Living', '150 Park Ave', 4.5, 25000, 'Lake Springfield', 'Type A Sandy Loam', 'Bioretention with underdrain', 'Under Review'),
    ('Childrens Museum', '200 Museum Way', 3.5, 20000, 'Sugar Creek', 'Type B Silt Loam', 'Cistern and rain garden', 'Pending'),
    ('Boutique Hotel', '55 Heritage St', 0.8, 10000, 'Sugar Creek', 'Type C Clay', 'Green infrastructure retrofit', 'Under Review'),
    ('Fire Station #7', '800 Safety Ln', 2.8, 8000, 'Horse Creek', 'Type B Silt Loam', 'Pervious pavement', 'Approved'),
    ('Highway Rest Stop', 'I-55 Mile Marker 98', 5.0, 20000, 'Prairie Creek', 'Type C Clay', 'Bioswale and detention pond', 'Pending')
  `);

  // 13. Historical Reviews
  await pool.query(`
    CREATE TABLE historical_reviews (
      id SERIAL PRIMARY KEY,
      property_address VARCHAR(500) NOT NULL,
      building_name VARCHAR(255),
      year_built INTEGER,
      historic_district VARCHAR(255),
      landmark_status VARCHAR(100),
      proposed_changes TEXT,
      architectural_style VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Under Review',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO historical_reviews (property_address, building_name, year_built, historic_district, landmark_status, proposed_changes, architectural_style, status) VALUES
    ('55 Heritage St', 'Morrison Building', 1892, 'Downtown Historic District', 'Contributing Structure', 'Convert to boutique hotel with interior renovation', 'Romanesque Revival', 'Under Review'),
    ('120 Capitol Ave', 'Old State Bank', 1876, 'Capitol Historic District', 'Individually Listed', 'Restore facade and add ADA-compliant entrance', 'Neoclassical', 'Approved'),
    ('300 Adams St', 'Lincoln Hotel', 1925, 'Downtown Historic District', 'Contributing Structure', 'Interior modernization preserving lobby details', 'Art Deco', 'Under Review'),
    ('45 Jefferson Sq', 'Jefferson Market Hall', 1905, 'Market Square District', 'Individually Listed', 'Install new HVAC while preserving tin ceiling', 'Victorian Commercial', 'Approved'),
    ('200 Washington Blvd', 'Washington School', 1918, 'Residential Historic District', 'Contributing Structure', 'Convert to loft apartments', 'Collegiate Gothic', 'Under Review'),
    ('88 Lincoln Way', 'Brewer Mansion', 1889, 'Lincoln Park District', 'Individually Listed', 'Add rear addition matching historic style', 'Queen Anne', 'Denied'),
    ('155 Spring St', 'Spring Street Row Houses', 1910, 'Old Town District', 'Contributing Structure', 'Replace windows with period-appropriate replicas', 'Federal', 'Approved'),
    ('400 Monroe Dr', 'Monroe Theatre', 1935, 'Arts District', 'Individually Listed', 'Restore original marquee and interior', 'Art Moderne', 'Under Review'),
    ('75 Grant Pl', 'Grant Place Church', 1870, 'Church Hill District', 'Individually Listed', 'Structural stabilization and roof replacement', 'Gothic Revival', 'Approved'),
    ('310 Hamilton Ave', 'Hamilton Firehouse', 1908, 'Downtown Historic District', 'Contributing Structure', 'Convert to restaurant preserving apparatus doors', 'Mission Revival', 'Under Review'),
    ('22 Oak Park Rd', 'Wright Prairie House', 1912, 'Oak Park Historic Area', 'Individually Listed', 'Restore original art glass windows', 'Prairie Style', 'Approved'),
    ('500 Industrial Ave', 'Springfield Foundry', 1880, 'Industrial Heritage Zone', 'Eligible', 'Adaptive reuse as maker space', 'Industrial Vernacular', 'Under Review'),
    ('180 College St', 'College Hall', 1860, 'University District', 'Individually Listed', 'Seismic retrofit and accessibility upgrades', 'Greek Revival', 'Under Review'),
    ('65 River Walk', 'River Mill', 1895, 'Riverside Historic District', 'Contributing Structure', 'Convert to mixed-use retail and residential', 'Industrial/Victorian', 'Pending'),
    ('412 Cherry St', 'Cherry Street Cottages', 1920, 'Bungalow District', 'Contributing Structure', 'Restore porch and add compatible garage', 'Craftsman Bungalow', 'Approved'),
    ('900 Park Ave', 'Park Avenue Armory', 1915, 'Civic Center District', 'Individually Listed', 'Convert drill hall to event venue', 'Castellated Gothic', 'Under Review')
  `);

  // 14. Noise Compliance
  await pool.query(`
    CREATE TABLE noise_compliance (
      id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      property_address VARCHAR(500) NOT NULL,
      noise_source VARCHAR(255),
      decibel_level INTEGER,
      time_of_operation VARCHAR(100),
      zone_type VARCHAR(100),
      mitigation_measures TEXT,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO noise_compliance (project_name, property_address, noise_source, decibel_level, time_of_operation, zone_type, mitigation_measures, status) VALUES
    ('Downtown Office Tower', '100 Main St', 'Pile driving and heavy equipment', 95, '7:00 AM - 6:00 PM', 'Commercial', 'Sound barriers and restricted hours', 'Approved'),
    ('Riverside Apartments', '250 River Rd', 'General construction', 82, '7:00 AM - 7:00 PM', 'Residential', 'Noise monitoring and community notification', 'Compliant'),
    ('Sunset Mall Expansion', '500 Commerce Dr', 'Demolition and concrete cutting', 90, '8:00 AM - 5:00 PM', 'Commercial', 'Temporary noise walls', 'Approved'),
    ('Heritage School Addition', '300 Oak Ave', 'Construction during school year', 78, '3:30 PM - 7:00 PM weekdays', 'Institutional', 'Schedule around school hours', 'Compliant'),
    ('Lakeside Townhomes', '75 Lakeview Dr', 'Residential construction', 80, '7:30 AM - 6:00 PM', 'Residential', 'Equipment mufflers and setback of loud equipment', 'Under Review'),
    ('Tech Hub Innovation Center', '400 Innovation Blvd', 'Steel erection and welding', 88, '7:00 AM - 5:00 PM', 'Mixed-Use', 'Pre-fabrication offsite where possible', 'Approved'),
    ('Industrial Warehouse Complex', '2000 Industrial Pkwy', 'Heavy equipment and truck traffic', 92, '6:00 AM - 8:00 PM', 'Industrial', 'Natural buffer zone from residential', 'Compliant'),
    ('Boutique Hotel Conversion', '55 Heritage St', 'Interior demolition', 75, '8:00 AM - 5:00 PM', 'Historic/Commercial', 'Containment and sound dampening', 'Compliant'),
    ('Solar Farm Installation', '4000 Rural Rt 5', 'Equipment installation', 70, '7:00 AM - 6:00 PM', 'Agricultural', 'Minimal impact - rural location', 'Compliant'),
    ('Organic Food Processing', '1500 Agriculture Dr', 'HVAC compressors and processing equipment', 72, '24/7 operation', 'Light Industrial', 'Sound-insulated enclosures', 'Under Review'),
    ('Community Swimming Pool', '350 Recreation Blvd', 'Pool mechanical equipment', 65, '6:00 AM - 10:00 PM', 'Parks/Recreation', 'Below-grade equipment room', 'Pending'),
    ('Green Valley Medical', '1200 Medical Pkwy', 'Emergency generators and HVAC', 68, '24/7 standby', 'Medical/Commercial', 'Acoustic enclosures for all equipment', 'Compliant'),
    ('Parkview Senior Living', '150 Park Ave', 'Construction near senior facility', 76, '8:00 AM - 5:00 PM', 'Residential', 'Restricted hours and vibration monitoring', 'Under Review'),
    ('Childrens Museum', '200 Museum Way', 'Construction and exhibit installation', 80, '7:00 AM - 6:00 PM', 'Commercial', 'Phased construction schedule', 'Pending'),
    ('Fire Station #7', '800 Safety Ln', 'Siren testing and apparatus', 110, 'Testing: 10 AM Tuesdays', 'Institutional', 'Directional sirens and reduced testing', 'Approved'),
    ('Highway Rest Stop', 'I-55 Mile Marker 98', 'Highway traffic and truck idling', 75, '24/7', 'Transportation', 'Noise wall between rest area and residences', 'Under Review')
  `);

  // 15. Parking Requirements
  await pool.query(`
    CREATE TABLE parking_requirements (
      id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      property_address VARCHAR(500) NOT NULL,
      building_use VARCHAR(255),
      square_footage INTEGER,
      num_units INTEGER,
      proposed_spaces INTEGER,
      ada_spaces INTEGER,
      zone_type VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO parking_requirements (project_name, property_address, building_use, square_footage, num_units, proposed_spaces, ada_spaces, zone_type, status) VALUES
    ('Downtown Office Tower', '100 Main St', 'Office', 180000, 0, 450, 18, 'C-3 Commercial', 'Approved'),
    ('Riverside Apartments', '250 River Rd', 'Multi-Family Residential', 65000, 48, 72, 4, 'R-4 Residential', 'Approved'),
    ('Sunset Mall Expansion', '500 Commerce Dr', 'Retail', 160000, 0, 800, 32, 'C-2 Commercial', 'Under Review'),
    ('Heritage School Addition', '300 Oak Ave', 'School', 75000, 0, 150, 8, 'I-1 Institutional', 'Approved'),
    ('Green Valley Medical', '1200 Medical Pkwy', 'Medical Office', 45000, 0, 180, 9, 'C-4 Medical', 'Approved'),
    ('Lakeside Townhomes', '75 Lakeview Dr', 'Townhouse', 48000, 24, 48, 2, 'R-3 Residential', 'Under Review'),
    ('Tech Hub Innovation Center', '400 Innovation Blvd', 'Office/Retail', 55000, 0, 165, 8, 'MU-1 Mixed Use', 'Pending'),
    ('Community Fire Station #7', '800 Safety Ln', 'Fire Station', 12000, 0, 25, 2, 'I-1 Institutional', 'Approved'),
    ('Parkview Senior Living', '150 Park Ave', 'Assisted Living', 42000, 60, 45, 4, 'R-4 Residential', 'Approved'),
    ('Industrial Warehouse', '2000 Industrial Pkwy', 'Warehouse', 120000, 0, 60, 3, 'M-2 Industrial', 'Approved'),
    ('Boutique Hotel', '55 Heritage St', 'Hotel', 28000, 35, 35, 2, 'HD Historic', 'Under Review'),
    ('Childrens Museum', '200 Museum Way', 'Museum', 30000, 0, 120, 6, 'C-1 Commercial', 'Pending'),
    ('Organic Food Processing', '1500 Agriculture Dr', 'Industrial', 35000, 0, 50, 3, 'M-1 Industrial', 'Approved'),
    ('Community Swimming Pool', '350 Recreation Blvd', 'Recreation', 15000, 0, 100, 5, 'PR Parks', 'Under Review'),
    ('Highway Rest Stop', 'I-55 Mile Marker 98', 'Rest Area', 8000, 0, 80, 4, 'Transportation', 'Approved'),
    ('Solar Farm', '4000 Rural Rt 5', 'Utility', 2000, 0, 10, 1, 'AG Agricultural', 'Approved')
  `);

  console.log('Database seeded successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
