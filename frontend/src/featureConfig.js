const featureConfig = {
  permits: {
    title: 'Permit Applications',
    icon: 'fa-file-signature',
    color: '#3b82f6',
    description: 'Submit and track building permit applications with AI-powered review',
    endpoint: '/permits',
    columns: [
      { key: 'project_name', label: 'Project' },
      { key: 'applicant_name', label: 'Applicant' },
      { key: 'property_address', label: 'Address' },
      { key: 'permit_type', label: 'Type' },
      { key: 'estimated_cost', label: 'Est. Cost', format: 'currency' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'project_name', label: 'Project Name', type: 'text', required: true },
      { key: 'applicant_name', label: 'Applicant Name', type: 'text', required: true },
      { key: 'property_address', label: 'Property Address', type: 'text', required: true, fullWidth: true },
      { key: 'permit_type', label: 'Permit Type', type: 'select', options: ['Commercial New Build', 'Residential Multi-Family', 'Commercial Renovation', 'Institutional', 'Healthcare Facility', 'Residential Townhouse', 'Mixed-Use', 'Municipal', 'Assisted Living', 'Industrial', 'Hospitality', 'Utility', 'Cultural/Recreation', 'Transportation', 'Food Processing', 'Recreation'] },
      { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
      { key: 'estimated_cost', label: 'Estimated Cost ($)', type: 'number' },
      { key: 'square_footage', label: 'Square Footage', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending Review', 'Under Review', 'Approved', 'Denied', 'Revisions Required'], editOnly: true }
    ],
    detailFields: [
      { key: 'project_name', label: 'Project Name' },
      { key: 'applicant_name', label: 'Applicant' },
      { key: 'property_address', label: 'Address', fullWidth: true },
      { key: 'permit_type', label: 'Permit Type' },
      { key: 'estimated_cost', label: 'Estimated Cost', format: 'currency' },
      { key: 'square_footage', label: 'Square Footage', format: 'number' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'description', label: 'Description', fullWidth: true }
    ]
  },
  zoning: {
    title: 'Zoning Compliance',
    icon: 'fa-map-location-dot',
    color: '#22c55e',
    description: 'AI-powered zoning validation and compliance checking',
    endpoint: '/zoning',
    columns: [
      { key: 'property_address', label: 'Address' },
      { key: 'zone_type', label: 'Zone Type' },
      { key: 'proposed_use', label: 'Proposed Use' },
      { key: 'lot_size', label: 'Lot Size (sqft)', format: 'number' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'property_address', label: 'Property Address', type: 'text', required: true, fullWidth: true },
      { key: 'zone_type', label: 'Zone Type', type: 'select', options: ['R-1 Single Family', 'R-2 Low Density', 'R-3 Medium Density', 'R-4 High Density Residential', 'C-1 Neighborhood Commercial', 'C-2 General Commercial', 'C-3 Commercial', 'C-4 Commercial/Medical', 'MU-1 Mixed Use', 'M-1 Light Industrial', 'M-2 Heavy Industrial', 'I-1 Institutional', 'AG Agricultural', 'PR Parks/Recreation', 'HD Historic District'] },
      { key: 'proposed_use', label: 'Proposed Use', type: 'text', required: true },
      { key: 'current_use', label: 'Current Use', type: 'text' },
      { key: 'lot_size', label: 'Lot Size (sq ft)', type: 'number' },
      { key: 'building_height', label: 'Building Height (ft)', type: 'number' },
      { key: 'lot_coverage', label: 'Lot Coverage (%)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Compliant', 'Non-Compliant', 'Under Review', 'Variance Needed', 'Special Use Permit'], editOnly: true }
    ],
    detailFields: [
      { key: 'property_address', label: 'Address', fullWidth: true },
      { key: 'zone_type', label: 'Zone Type' },
      { key: 'proposed_use', label: 'Proposed Use' },
      { key: 'current_use', label: 'Current Use' },
      { key: 'lot_size', label: 'Lot Size (sq ft)', format: 'number' },
      { key: 'building_height', label: 'Height (ft)' },
      { key: 'lot_coverage', label: 'Coverage (%)' },
      { key: 'status', label: 'Status', format: 'status' }
    ]
  },
  documents: {
    title: 'Document Review',
    icon: 'fa-file-lines',
    color: '#f59e0b',
    description: 'AI-assisted construction document review and compliance checking',
    endpoint: '/documents',
    columns: [
      { key: 'document_name', label: 'Document' },
      { key: 'document_type', label: 'Type' },
      { key: 'project_name', label: 'Project' },
      { key: 'submitted_by', label: 'Submitted By' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'document_name', label: 'Document Name', type: 'text', required: true },
      { key: 'document_type', label: 'Document Type', type: 'select', options: ['Engineering', 'Architecture', 'Survey', 'Mechanical/Electrical', 'Civil', 'Landscape', 'Traffic', 'Fire Safety', 'Accessibility', 'Environmental', 'Historical', 'Electrical', 'Energy', 'Health/Safety', 'Aquatics'] },
      { key: 'project_name', label: 'Project Name', type: 'text', required: true },
      { key: 'submitted_by', label: 'Submitted By', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
      { key: 'page_count', label: 'Page Count', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending Review', 'Under Review', 'Approved', 'Revisions Required', 'Rejected'], editOnly: true }
    ],
    detailFields: [
      { key: 'document_name', label: 'Document' },
      { key: 'document_type', label: 'Type' },
      { key: 'project_name', label: 'Project' },
      { key: 'submitted_by', label: 'Submitted By' },
      { key: 'page_count', label: 'Pages' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'description', label: 'Description', fullWidth: true }
    ]
  },
  violations: {
    title: 'Code Violations',
    icon: 'fa-triangle-exclamation',
    color: '#ef4444',
    description: 'Track and manage building code violations with AI severity analysis',
    endpoint: '/violations',
    columns: [
      { key: 'property_address', label: 'Address' },
      { key: 'violation_type', label: 'Type' },
      { key: 'code_section', label: 'Code Section' },
      { key: 'severity', label: 'Severity', format: 'status' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'property_address', label: 'Property Address', type: 'text', required: true, fullWidth: true },
      { key: 'violation_type', label: 'Violation Type', type: 'select', options: ['Structural', 'Electrical', 'Plumbing', 'Fire Safety', 'Zoning', 'Building Envelope', 'Accessibility', 'Mechanical', 'Energy Code', 'Site', 'Building'] },
      { key: 'code_section', label: 'Code Section', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Minor', 'Moderate', 'Major', 'Critical'] },
      { key: 'reported_by', label: 'Reported By', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Corrected', 'Closed'], editOnly: true }
    ],
    detailFields: [
      { key: 'property_address', label: 'Address', fullWidth: true },
      { key: 'violation_type', label: 'Type' },
      { key: 'code_section', label: 'Code Section' },
      { key: 'severity', label: 'Severity', format: 'status' },
      { key: 'reported_by', label: 'Reported By' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'description', label: 'Description', fullWidth: true }
    ]
  },
  inspections: {
    title: 'Inspection Scheduling',
    icon: 'fa-clipboard-check',
    color: '#06b6d4',
    description: 'Schedule and manage building inspections with AI checklists',
    endpoint: '/inspections',
    columns: [
      { key: 'property_address', label: 'Address' },
      { key: 'inspection_type', label: 'Type' },
      { key: 'inspector_name', label: 'Inspector' },
      { key: 'inspection_date', label: 'Date', format: 'date' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'property_address', label: 'Property Address', type: 'text', required: true, fullWidth: true },
      { key: 'inspection_type', label: 'Inspection Type', type: 'select', options: ['Foundation', 'Framing', 'Rough Electrical', 'Rough Plumbing', 'Rough Mechanical', 'Insulation/Energy', 'Final Inspection', 'Footing/Foundation', 'Structural Steel', 'Slab on Grade', 'Demolition', 'Electrical Systems', 'Fire Protection', 'Health Department', 'Pool Safety', 'Pre-Construction'] },
      { key: 'inspector_name', label: 'Inspector Name', type: 'text' },
      { key: 'inspection_date', label: 'Inspection Date', type: 'date' },
      { key: 'project_name', label: 'Project Name', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'In Progress', 'Passed', 'Failed', 'Cancelled'], editOnly: true }
    ],
    detailFields: [
      { key: 'property_address', label: 'Address', fullWidth: true },
      { key: 'inspection_type', label: 'Type' },
      { key: 'inspector_name', label: 'Inspector' },
      { key: 'inspection_date', label: 'Date', format: 'date' },
      { key: 'project_name', label: 'Project' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'notes', label: 'Notes', fullWidth: true }
    ]
  },
  'plan-review': {
    title: 'Plan Review',
    icon: 'fa-drafting-compass',
    color: '#8b5cf6',
    description: 'AI-assisted construction plan review and structural analysis',
    endpoint: '/plan-review',
    columns: [
      { key: 'project_name', label: 'Project' },
      { key: 'plan_type', label: 'Plan Type' },
      { key: 'architect', label: 'Architect' },
      { key: 'building_type', label: 'Building Type' },
      { key: 'stories', label: 'Stories' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'project_name', label: 'Project Name', type: 'text', required: true },
      { key: 'plan_type', label: 'Plan Type', type: 'select', options: ['Structural', 'Architectural', 'Site Plan', 'MEP', 'Fire Protection', 'Accessibility', 'Complete Review', 'Electrical', 'Life Safety', 'Industrial', 'Aquatics', 'Historic Preservation'] },
      { key: 'architect', label: 'Architect', type: 'text' },
      { key: 'engineer', label: 'Engineer', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
      { key: 'building_type', label: 'Building Type', type: 'text' },
      { key: 'stories', label: 'Number of Stories', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Submitted', 'In Review', 'Approved', 'Revisions Required', 'Rejected'], editOnly: true }
    ],
    detailFields: [
      { key: 'project_name', label: 'Project' },
      { key: 'plan_type', label: 'Plan Type' },
      { key: 'architect', label: 'Architect' },
      { key: 'engineer', label: 'Engineer' },
      { key: 'building_type', label: 'Building Type' },
      { key: 'stories', label: 'Stories' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'description', label: 'Description', fullWidth: true }
    ]
  },
  environmental: {
    title: 'Environmental Impact',
    icon: 'fa-leaf',
    color: '#10b981',
    description: 'AI environmental impact analysis and compliance assessment',
    endpoint: '/environmental',
    columns: [
      { key: 'project_name', label: 'Project' },
      { key: 'assessment_type', label: 'Assessment Type' },
      { key: 'ecosystem_type', label: 'Ecosystem' },
      { key: 'acreage', label: 'Acreage' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'project_name', label: 'Project Name', type: 'text', required: true },
      { key: 'property_address', label: 'Property Address', type: 'text', required: true, fullWidth: true },
      { key: 'assessment_type', label: 'Assessment Type', type: 'select', options: ['Phase I ESA', 'Phase II ESA', 'Wetland Delineation', 'Habitat Assessment', 'Wildlife Impact', 'Stormwater Assessment', 'Air Quality', 'Soil Assessment', 'Brownfield Assessment', 'Lead/Asbestos Survey', 'Noise Impact', 'Tree Survey'] },
      { key: 'ecosystem_type', label: 'Ecosystem Type', type: 'text' },
      { key: 'acreage', label: 'Acreage', type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Completed', 'Failed'], editOnly: true }
    ],
    detailFields: [
      { key: 'project_name', label: 'Project' },
      { key: 'property_address', label: 'Address', fullWidth: true },
      { key: 'assessment_type', label: 'Assessment Type' },
      { key: 'ecosystem_type', label: 'Ecosystem' },
      { key: 'acreage', label: 'Acreage' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'description', label: 'Description', fullWidth: true }
    ]
  },
  setbacks: {
    title: 'Setback Calculator',
    icon: 'fa-ruler-combined',
    color: '#f97316',
    description: 'Calculate required setbacks with AI compliance verification',
    endpoint: '/setbacks',
    columns: [
      { key: 'property_address', label: 'Address' },
      { key: 'zone_type', label: 'Zone' },
      { key: 'front_setback', label: 'Front (ft)' },
      { key: 'rear_setback', label: 'Rear (ft)' },
      { key: 'side_setback', label: 'Side (ft)' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'property_address', label: 'Property Address', type: 'text', required: true, fullWidth: true },
      { key: 'zone_type', label: 'Zone Type', type: 'text', required: true },
      { key: 'lot_width', label: 'Lot Width (ft)', type: 'number' },
      { key: 'lot_depth', label: 'Lot Depth (ft)', type: 'number' },
      { key: 'front_setback', label: 'Front Setback (ft)', type: 'number' },
      { key: 'rear_setback', label: 'Rear Setback (ft)', type: 'number' },
      { key: 'side_setback', label: 'Side Setback (ft)', type: 'number' },
      { key: 'proposed_structure', label: 'Proposed Structure', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Calculated', 'Compliant', 'Non-Compliant', 'Variance Required'], editOnly: true }
    ],
    detailFields: [
      { key: 'property_address', label: 'Address', fullWidth: true },
      { key: 'zone_type', label: 'Zone' },
      { key: 'proposed_structure', label: 'Structure' },
      { key: 'lot_width', label: 'Lot Width (ft)' },
      { key: 'lot_depth', label: 'Lot Depth (ft)' },
      { key: 'front_setback', label: 'Front Setback (ft)' },
      { key: 'rear_setback', label: 'Rear Setback (ft)' },
      { key: 'side_setback', label: 'Side Setback (ft)' },
      { key: 'status', label: 'Status', format: 'status' }
    ]
  },
  occupancy: {
    title: 'Occupancy Classification',
    icon: 'fa-people-roof',
    color: '#ec4899',
    description: 'AI-powered occupancy classification per International Building Code',
    endpoint: '/occupancy',
    columns: [
      { key: 'building_name', label: 'Building' },
      { key: 'building_use', label: 'Use/Classification' },
      { key: 'square_footage', label: 'Sq Ft', format: 'number' },
      { key: 'max_occupants', label: 'Max Occupants' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'building_name', label: 'Building Name', type: 'text', required: true },
      { key: 'building_address', label: 'Building Address', type: 'text', required: true, fullWidth: true },
      { key: 'building_use', label: 'Building Use', type: 'text', required: true },
      { key: 'square_footage', label: 'Square Footage', type: 'number' },
      { key: 'num_floors', label: 'Number of Floors', type: 'number' },
      { key: 'max_occupants', label: 'Max Occupants', type: 'number' },
      { key: 'construction_type', label: 'Construction Type', type: 'select', options: ['Type I-A', 'Type I-B', 'Type II-A', 'Type II-B', 'Type III-A', 'Type III-B', 'Type IV', 'Type V-A', 'Type V-B'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Under Review', 'Classified', 'Reclassification Required'], editOnly: true }
    ],
    detailFields: [
      { key: 'building_name', label: 'Building' },
      { key: 'building_address', label: 'Address', fullWidth: true },
      { key: 'building_use', label: 'Use/Classification' },
      { key: 'square_footage', label: 'Square Footage', format: 'number' },
      { key: 'num_floors', label: 'Floors' },
      { key: 'max_occupants', label: 'Max Occupants' },
      { key: 'construction_type', label: 'Construction Type' },
      { key: 'status', label: 'Status', format: 'status' }
    ]
  },
  'fire-safety': {
    title: 'Fire Safety Compliance',
    icon: 'fa-fire-extinguisher',
    color: '#dc2626',
    description: 'Fire safety compliance checking with AI risk assessment',
    endpoint: '/fire-safety',
    columns: [
      { key: 'building_name', label: 'Building' },
      { key: 'building_type', label: 'Type' },
      { key: 'has_sprinklers', label: 'Sprinklers', format: 'boolean' },
      { key: 'has_fire_alarm', label: 'Fire Alarm', format: 'boolean' },
      { key: 'fire_exits', label: 'Exits' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'building_name', label: 'Building Name', type: 'text', required: true },
      { key: 'building_address', label: 'Building Address', type: 'text', required: true, fullWidth: true },
      { key: 'building_type', label: 'Building Type', type: 'text', required: true },
      { key: 'square_footage', label: 'Square Footage', type: 'number' },
      { key: 'num_floors', label: 'Number of Floors', type: 'number' },
      { key: 'has_sprinklers', label: 'Has Sprinklers', type: 'select', options: ['true', 'false'] },
      { key: 'has_fire_alarm', label: 'Has Fire Alarm', type: 'select', options: ['true', 'false'] },
      { key: 'fire_exits', label: 'Number of Fire Exits', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Under Review', 'Compliant', 'Non-Compliant'], editOnly: true }
    ],
    detailFields: [
      { key: 'building_name', label: 'Building' },
      { key: 'building_address', label: 'Address', fullWidth: true },
      { key: 'building_type', label: 'Type' },
      { key: 'square_footage', label: 'Square Footage', format: 'number' },
      { key: 'num_floors', label: 'Floors' },
      { key: 'has_sprinklers', label: 'Sprinklers', format: 'boolean' },
      { key: 'has_fire_alarm', label: 'Fire Alarm', format: 'boolean' },
      { key: 'fire_exits', label: 'Fire Exits' },
      { key: 'status', label: 'Status', format: 'status' }
    ]
  },
  'ada-compliance': {
    title: 'ADA Compliance',
    icon: 'fa-wheelchair',
    color: '#0ea5e9',
    description: 'Accessibility compliance checking with AI recommendations',
    endpoint: '/ada-compliance',
    columns: [
      { key: 'building_name', label: 'Building' },
      { key: 'building_type', label: 'Type' },
      { key: 'has_ramp', label: 'Ramp', format: 'boolean' },
      { key: 'has_elevator', label: 'Elevator', format: 'boolean' },
      { key: 'accessible_parking', label: 'ADA Parking' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'building_name', label: 'Building Name', type: 'text', required: true },
      { key: 'building_address', label: 'Building Address', type: 'text', required: true, fullWidth: true },
      { key: 'building_type', label: 'Building Type', type: 'text', required: true },
      { key: 'has_ramp', label: 'Has Ramp', type: 'select', options: ['true', 'false'] },
      { key: 'has_elevator', label: 'Has Elevator', type: 'select', options: ['true', 'false'] },
      { key: 'accessible_restrooms', label: 'Accessible Restrooms', type: 'number' },
      { key: 'accessible_parking', label: 'Accessible Parking Spaces', type: 'number' },
      { key: 'door_width', label: 'Door Width (inches)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Under Review', 'Compliant', 'Non-Compliant'], editOnly: true }
    ],
    detailFields: [
      { key: 'building_name', label: 'Building' },
      { key: 'building_address', label: 'Address', fullWidth: true },
      { key: 'building_type', label: 'Type' },
      { key: 'has_ramp', label: 'Ramp', format: 'boolean' },
      { key: 'has_elevator', label: 'Elevator', format: 'boolean' },
      { key: 'accessible_restrooms', label: 'Accessible Restrooms' },
      { key: 'accessible_parking', label: 'ADA Parking' },
      { key: 'door_width', label: 'Door Width (in)' },
      { key: 'status', label: 'Status', format: 'status' }
    ]
  },
  stormwater: {
    title: 'Stormwater Management',
    icon: 'fa-cloud-rain',
    color: '#6366f1',
    description: 'Stormwater compliance analysis with AI-powered BMP recommendations',
    endpoint: '/stormwater',
    columns: [
      { key: 'project_name', label: 'Project' },
      { key: 'site_area', label: 'Site (acres)' },
      { key: 'drainage_basin', label: 'Basin' },
      { key: 'proposed_bmp', label: 'Proposed BMP' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'project_name', label: 'Project Name', type: 'text', required: true },
      { key: 'property_address', label: 'Property Address', type: 'text', required: true, fullWidth: true },
      { key: 'site_area', label: 'Site Area (acres)', type: 'number' },
      { key: 'impervious_area', label: 'Impervious Area (sq ft)', type: 'number' },
      { key: 'drainage_basin', label: 'Drainage Basin', type: 'text' },
      { key: 'soil_type', label: 'Soil Type', type: 'select', options: ['Type A Sandy Loam', 'Type B Silt Loam', 'Type C Clay', 'Type D Heavy Clay'] },
      { key: 'proposed_bmp', label: 'Proposed BMP', type: 'text', fullWidth: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Under Review', 'Approved', 'Revisions Required'], editOnly: true }
    ],
    detailFields: [
      { key: 'project_name', label: 'Project' },
      { key: 'property_address', label: 'Address', fullWidth: true },
      { key: 'site_area', label: 'Site Area (acres)' },
      { key: 'impervious_area', label: 'Impervious Area (sq ft)', format: 'number' },
      { key: 'drainage_basin', label: 'Drainage Basin' },
      { key: 'soil_type', label: 'Soil Type' },
      { key: 'proposed_bmp', label: 'Proposed BMP', fullWidth: true },
      { key: 'status', label: 'Status', format: 'status' }
    ]
  },
  historical: {
    title: 'Historic Preservation',
    icon: 'fa-landmark',
    color: '#a78bfa',
    description: 'Historic district compliance with AI preservation analysis',
    endpoint: '/historical',
    columns: [
      { key: 'building_name', label: 'Building' },
      { key: 'year_built', label: 'Year' },
      { key: 'historic_district', label: 'District' },
      { key: 'architectural_style', label: 'Style' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'property_address', label: 'Property Address', type: 'text', required: true, fullWidth: true },
      { key: 'building_name', label: 'Building Name', type: 'text', required: true },
      { key: 'year_built', label: 'Year Built', type: 'number' },
      { key: 'historic_district', label: 'Historic District', type: 'text' },
      { key: 'landmark_status', label: 'Landmark Status', type: 'select', options: ['Individually Listed', 'Contributing Structure', 'Eligible', 'Not Eligible'] },
      { key: 'proposed_changes', label: 'Proposed Changes', type: 'textarea', fullWidth: true },
      { key: 'architectural_style', label: 'Architectural Style', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Under Review', 'Approved', 'Denied', 'Pending', 'Conditional Approval'], editOnly: true }
    ],
    detailFields: [
      { key: 'building_name', label: 'Building' },
      { key: 'property_address', label: 'Address', fullWidth: true },
      { key: 'year_built', label: 'Year Built' },
      { key: 'historic_district', label: 'District' },
      { key: 'landmark_status', label: 'Landmark Status' },
      { key: 'architectural_style', label: 'Style' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'proposed_changes', label: 'Proposed Changes', fullWidth: true }
    ]
  },
  noise: {
    title: 'Noise Ordinance',
    icon: 'fa-volume-high',
    color: '#eab308',
    description: 'Noise regulation compliance with AI impact assessment',
    endpoint: '/noise',
    columns: [
      { key: 'project_name', label: 'Project' },
      { key: 'noise_source', label: 'Noise Source' },
      { key: 'decibel_level', label: 'dB Level' },
      { key: 'time_of_operation', label: 'Hours' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'project_name', label: 'Project Name', type: 'text', required: true },
      { key: 'property_address', label: 'Property Address', type: 'text', required: true, fullWidth: true },
      { key: 'noise_source', label: 'Noise Source', type: 'text', required: true },
      { key: 'decibel_level', label: 'Decibel Level (dB)', type: 'number' },
      { key: 'time_of_operation', label: 'Time of Operation', type: 'text' },
      { key: 'zone_type', label: 'Zone Type', type: 'text' },
      { key: 'mitigation_measures', label: 'Mitigation Measures', type: 'textarea', fullWidth: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Under Review', 'Compliant', 'Approved', 'Non-Compliant'], editOnly: true }
    ],
    detailFields: [
      { key: 'project_name', label: 'Project' },
      { key: 'property_address', label: 'Address', fullWidth: true },
      { key: 'noise_source', label: 'Noise Source' },
      { key: 'decibel_level', label: 'Decibel Level (dB)' },
      { key: 'time_of_operation', label: 'Hours of Operation' },
      { key: 'zone_type', label: 'Zone' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'mitigation_measures', label: 'Mitigation Measures', fullWidth: true }
    ]
  },
  parking: {
    title: 'Parking Requirements',
    icon: 'fa-square-parking',
    color: '#14b8a6',
    description: 'Parking space calculations with AI optimization analysis',
    endpoint: '/parking',
    columns: [
      { key: 'project_name', label: 'Project' },
      { key: 'building_use', label: 'Use' },
      { key: 'proposed_spaces', label: 'Spaces' },
      { key: 'ada_spaces', label: 'ADA' },
      { key: 'zone_type', label: 'Zone' },
      { key: 'status', label: 'Status', format: 'status' }
    ],
    fields: [
      { key: 'project_name', label: 'Project Name', type: 'text', required: true },
      { key: 'property_address', label: 'Property Address', type: 'text', required: true, fullWidth: true },
      { key: 'building_use', label: 'Building Use', type: 'text', required: true },
      { key: 'square_footage', label: 'Square Footage', type: 'number' },
      { key: 'num_units', label: 'Number of Units', type: 'number' },
      { key: 'proposed_spaces', label: 'Proposed Spaces', type: 'number' },
      { key: 'ada_spaces', label: 'ADA Spaces', type: 'number' },
      { key: 'zone_type', label: 'Zone Type', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Under Review', 'Approved', 'Insufficient', 'Variance Required'], editOnly: true }
    ],
    detailFields: [
      { key: 'project_name', label: 'Project' },
      { key: 'property_address', label: 'Address', fullWidth: true },
      { key: 'building_use', label: 'Use' },
      { key: 'square_footage', label: 'Square Footage', format: 'number' },
      { key: 'num_units', label: 'Units' },
      { key: 'proposed_spaces', label: 'Proposed Spaces' },
      { key: 'ada_spaces', label: 'ADA Spaces' },
      { key: 'zone_type', label: 'Zone' },
      { key: 'status', label: 'Status', format: 'status' }
    ]
  }
};

export default featureConfig;
