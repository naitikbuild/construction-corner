// Central provider category lists.
//
// These are the single source of truth for:
//  - the Home screen's "Solo Workers" / "Sub Contractors" / "Professionals" browse sections
//  - the matching signup dropdowns in EditProfileScreen (Solo Worker skill,
//    Sub Contractor type/trade, Professional primary + extra skill)
//
// Edit an array here and both the Home screen listing and the signup dropdown
// stay in sync automatically. Selection everywhere is restricted to these
// fixed values — no free text / custom entries.

// Solo Worker's single trade list — no Skilled/Unskilled split (removed as
// confusing; helper/unskilled categories will be revisited later).
export const SOLO_WORKER_CATEGORIES = [
  'Mason',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Bar Bender',
  'Welder',
  'Tile Fitter',
  'Plasterer',
  'Waterproofing',
  'POP / False Ceiling',
  'Fabricator',
  'Centering / Shuttering',
  'Flooring',
  'Glass & Aluminium',
  'Grill / Gate Fitter',
  'Roofing',
  'Borewell Operator',
  'JCB Operator',
  'Crane Operator',
  'Excavator Operator',
  'Tractor / Dumper Driver',
  'Mixer Machine Operator',
  'Road Roller Operator',
  'Hydra Operator',
];

export const CONTRACTOR_CATEGORIES = [
  'RCC Contractor',
  'Shuttering & Centering Contractor',
  'Brickwork & Plaster Contractor',
  'Excavation Contractor',
  'Piling Contractor',
  'Bar Bending Contractor',
  'Waterproofing Contractor',
  'Plumbing Contractor',
  'Electrical Contractor',
  'HVAC Contractor',
  'Solar Contractor',
  'Elevator/Lift Contractor',
  'STP/WTP Contractor',
  'Tiles & Granite/Marble Contractor',
  'Painting Contractor',
  'False Ceiling & Gypsum Contractor',
  'Aluminium & UPVC Window/Door Contractor',
  'Glass & Glazing Contractor',
  'Carpentry/Woodwork Contractor',
  'Wallpaper & Interior Finishing Contractor',
  'Demolition Contractor',
  'Soil Testing Contractor',
  'Structural Glazing/ACP Cladding Contractor',
  'Signage & Branding Contractor',
  'Fabrication Contractor',
  'CCTV & Security Systems Contractor',
  'Pest Control Contractor',
];

export const PROFESSIONAL_CATEGORIES = [
  'Architect',
  'Civil Engineer',
  'Site Engineer',
  'Structural Engineer',
  'Interior Designer',
  'Landscape Designer',
  '3D Visualizer',
  'Draftsman (AutoCAD)',
  'Project Engineer',
  'Planning Engineer',
  'Quantity Surveyor',
  'Estimator',
  'Site Supervisor',
  'Construction Manager',
  'MEP Engineer',
  'HVAC Engineer',
  'Structural Consultant',
  'Safety Officer',
  'BIM Modeler',
  'Land Surveyor',
];

// Work record project category — single-select, required on every work
// record (see CreateWorkRecordScreen).
export const PROJECT_CATEGORIES = ['Residential', 'Commercial', 'Industrial', 'Infrastructure'];

// Fixed, searchable list of "extra work done" keywords a provider can tag a
// work record with (up to 10, no custom entries — see CreateWorkRecordScreen's
// KeywordPickerModal). Also what verified-project keyword search matches
// against (see services/userService.js's matchTier).
export const WORK_KEYWORDS = [
  'Italian Marble', 'Granite Flooring', 'Vitrified Tiles', 'Wooden Flooring',
  'Bird Net', 'POP False Ceiling', 'Gypsum Ceiling', 'Modular Kitchen',
  'Wardrobe', 'Waterproofing', 'Terrace Waterproofing', 'Texture Paint',
  'PU Paint', 'Wall Putty', 'Wallpaper', 'Glass Partition',
  'Aluminium Partition', 'UPVC Windows', 'Structural Glazing', 'ACP Cladding',
  'Stone Cladding', 'Grill Work', 'MS Fabrication', 'SS Railing',
  'Gate Fabrication', 'Boundary Wall', 'RCC Slab', 'Column Casting',
  'Brick Masonry', 'Plastering', 'Solar Panel Installation', 'CCTV Installation',
  'Electrical Wiring', 'Concealed Plumbing', 'Bathroom Fitting', 'Landscaping',
  'Interior Design', 'Epoxy Flooring', 'Fire Fighting', 'HVAC Ducting',
];

// Optional custom image icon per category — keyed by the exact category
// string. The Home screen grid uses this instead of the emoji lookup when a
// category has an entry here; categories without one keep using the emoji
// (see iconForCategory in screens/HomeScreen.js). Add more entries here to
// give other categories a custom image icon.
export const CATEGORY_ICONS = {
  'Brickwork & Plaster Contractor': require('../assets/categories/brickwork-plaster.png'),
};
