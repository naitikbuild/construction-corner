// Central provider category lists.
//
// These are the single source of truth for:
//  - the Home screen's "Solo Workers" / "Contractors" / "Professionals" browse sections
//  - the matching signup dropdowns in EditProfileScreen (Solo Worker skill,
//    Contractor type/trade, Professional primary + extra skill)
//
// Edit an array here and both the Home screen listing and the signup dropdown
// stay in sync automatically. Selection everywhere is restricted to these
// fixed values — no free text / custom entries.

// Solo Worker skills are split by Worker Type — the signup dropdown only ever
// shows one of these two lists at a time, based on the Skilled/Unskilled choice.
export const SKILLED_WORKER_CATEGORIES = [
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

export const UNSKILLED_WORKER_CATEGORIES = [
  'General Helper',
  'Mason Helper',
  'Electrician Helper',
  'Plumber Helper',
  'Painter Helper',
  'Carpenter Helper',
  'Tile Fitter Helper',
  'Site Labour',
  'Loader / Unloader',
  'Cleaner',
  'Beldar',
  'Watchman / Security',
  'Material Shifting',
];

// Flat union of both — kept for any place that needs "all solo worker
// categories" without splitting by Worker Type (e.g. a combined search).
export const SOLO_WORKER_CATEGORIES = [...SKILLED_WORKER_CATEGORIES, ...UNSKILLED_WORKER_CATEGORIES];

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

// Optional custom image icon per category — keyed by the exact category
// string. The Home screen grid uses this instead of the emoji lookup when a
// category has an entry here; categories without one keep using the emoji
// (see iconForCategory in screens/HomeScreen.js). Add more entries here to
// give other categories a custom image icon.
export const CATEGORY_ICONS = {
  'Brickwork & Plaster Contractor': require('../assets/categories/brickwork-plaster.png'),
};
