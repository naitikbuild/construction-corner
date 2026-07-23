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

export const SOLO_WORKER_CATEGORIES = [
  'Mason',
  'Electrician',
  'Plumber',
  'Painter',
  'Carpenter',
  'Bar Bender',
  'Welder',
  'Tile Fitter',
  'Helper',
  'POP / False Ceiling',
  'Waterproofing',
  'Fabricator',
  'Centering / Shuttering',
  'Plasterer',
  'Flooring',
  'Glass & Aluminium',
  'Grill / Gate Fitter',
  'Borewell',
  'Earthwork / Excavation',
  'Roofing',
];

export const CONTRACTOR_CATEGORIES = [
  'Civil Contractor',
  'Building Contractor',
  'RCC Contractor',
  'Labour Contractor',
  'Plumbing Contractor',
  'Electrical Contractor',
  'Painting Contractor',
  'Waterproofing Contractor',
  'Tiling & Flooring Contractor',
  'Interior Contractor',
  'Turnkey Contractor',
  'Fabrication Contractor',
  'POP / False Ceiling Contractor',
  'Plastering Contractor',
  'Roofing Contractor',
  'Glass & Aluminium Contractor',
  'HVAC Contractor',
  'Landscaping Contractor',
  'Demolition Contractor',
  'Road Work Contractor',
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
