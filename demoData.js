// ─────────────────────────────────────────────────────────────────────────
// DEMO / SAMPLE DATA — for previewing the profile experience only.
//
// These profiles are pure in-memory fixtures. They are shaped exactly like a
// real Firestore `users/{uid}` document (same field names EditProfileScreen
// writes) plus a few demo-only aggregate fields (`demoVerifiedAmount`,
// `demoVerifiedWork`) that stand in for what would normally be computed from
// the real `verified_work` Firestore collection.
//
// Every demo profile is flagged `isDemo: true` and uses a `demo_`-prefixed
// uid. `services/userService.js` and `services/workService.js` check for
// that prefix (gated by config/demoMode.js's DEMO_MODE) to serve this data
// instead of hitting Firestore — real profiles and the real verified-work
// system are never touched by any of this. Turning DEMO_MODE off removes
// every demo profile from listings, search, and direct profile navigation.
//
// Keep stats internally consistent: `jobsCompleted` must equal
// `demoVerifiedWork.length`, and `demoVerifiedAmount` must equal the sum of
// `demoVerifiedWork[].amount` — otherwise list/profile views end up showing
// an earned amount or rating with a contradictory "0 jobs" count.
// ─────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_PHOTO = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

export const DEMO_PROFILES = [
  // ── Contractor 1 — Available, GST-verified ──────────────────────────────
  {
    uid: 'demo_contractor_1',
    isDemo: true,
    profileType: 'contractor',
    role: 'contractor',
    name: 'Ramesh Vishwakarma',
    companyName: 'Vishwakarma Construction Co.',
    phone: '9825011234',
    photoUri: PLACEHOLDER_PHOTO('ramesh-vishwakarma'),
    area: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015',
    lat: 23.0225,
    lng: 72.5714,
    location: 'Ahmedabad — 380015',
    contractorType: 'Civil Contractor',
    category: 'Civil Contractor',
    contractorExperience: '15',
    foundedYear: '2011',
    nativePlaceCity: 'Vatva',
    nativePlaceState: 'Gujarat',
    contractorTeamSize: '12',
    available: true,
    contractorBio: 'Civil contracting crew specialising in RCC structures, brickwork and plaster for residential and small commercial projects across Ahmedabad. Known for finishing on schedule and keeping sites clean.',
    otherSkills: ['Mason Work', 'Waterproofing', 'Tiling'],
    skillTags: ['Mason Work', 'Waterproofing', 'Tiling'],
    services: ['Mason Work', 'Waterproofing', 'Tiling', 'RCC Structures'],
    contractorWebsite: 'https://rameshconstructions.in',
    verificationType: 'gst',
    verificationNumber: '24AABCR1234F1Z5',
    verified: true,
    aadhaar: '345678901234',
    pan: 'AABCR1234F',
    labourLicence: 'GLC/2011/004521',
    onTimeRate: '94%',
    jobsCompleted: 2,
    workPhotos: [
      PLACEHOLDER_PHOTO('ramesh-work-1'),
      PLACEHOLDER_PHOTO('ramesh-work-2'),
      PLACEHOLDER_PHOTO('ramesh-work-3'),
      PLACEHOLDER_PHOTO('ramesh-work-4'),
    ],
    gallery: [
      { uri: PLACEHOLDER_PHOTO('ramesh-work-1'), caption: 'RCC slab casting' },
      { uri: PLACEHOLDER_PHOTO('ramesh-work-2'), caption: 'Brickwork finishing' },
      { uri: PLACEHOLDER_PHOTO('ramesh-work-3'), caption: 'Terrace waterproofing' },
      { uri: PLACEHOLDER_PHOTO('ramesh-work-4'), caption: 'Tile flooring' },
    ],
    projects: [
      { name: 'Shreeji Residency', location: 'Bopal, Ahmedabad', category: 'Residential', keywords: ['RCC Slab', 'Brick Masonry', 'Waterproofing'], value: 2100000, status: 'done', photoUri: PLACEHOLDER_PHOTO('ramesh-project-1') },
      { name: 'Parekh Bungalow Extension', location: 'Satellite, Ahmedabad', category: 'Residential', keywords: ['Column Casting', 'Brick Masonry'], value: 850000, status: 'ongoing', photoUri: PLACEHOLDER_PHOTO('ramesh-project-2') },
      { name: 'Trivedi Commercial Complex', location: 'Maninagar, Ahmedabad', category: 'Commercial', keywords: ['RCC Slab', 'Plastering'], value: 6100000, status: 'done', photoUri: PLACEHOLDER_PHOTO('ramesh-project-3') },
    ],
    ccScore: 780,
    rating: 4.8,
    reviewCount: 2,
    verifiedAmt: '₹10,90,000',
    demoVerifiedAmount: 1090000,
    // Trimmed to exactly the 2 "done" projects above (Shreeji Residency,
    // Trivedi Commercial Complex) — jobsCompleted/demoVerifiedWork.length
    // must equal the section's verified-project count so the "Jobs" stat and
    // "VERIFIED PROJECTS (N)" always match. The dropped ongoing-project entry
    // (Parekh) and unrelated extras are intentionally not counted as verified.
    demoVerifiedWork: [
      { customerName: 'Nikhil Parekh', providerName: 'Ramesh Vishwakarma', amount: 480000, rating: 5, review: 'Excellent RCC work on our first floor slab. Ramesh bhai and his crew were punctual and the finishing was clean.', date: '18/05/2025', workType: 'RCC Slab Work', status: 'verified' },
      { customerName: 'Sunil Trivedi', providerName: 'Ramesh Vishwakarma', amount: 610000, rating: 4, review: 'Good quality work overall, minor delay due to rain but kept us updated throughout.', date: '11/02/2025', workType: 'Full Civil Work', status: 'verified' },
    ],
    createdAt: '2024-06-01T09:00:00.000Z',
  },

  // ── Contractor 2 — Busy (demonstrates the locked Call button), Aadhaar-verified ──
  {
    uid: 'demo_contractor_2',
    isDemo: true,
    profileType: 'contractor',
    role: 'contractor',
    name: 'Iqbal Sheikh',
    companyName: 'Sheikh Electrical Works',
    phone: '9898022345',
    photoUri: PLACEHOLDER_PHOTO('iqbal-sheikh'),
    area: '',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395007',
    lat: 21.1702,
    lng: 72.8311,
    location: 'Surat — 395007',
    contractorType: 'Electrical Contractor',
    category: 'Electrical Contractor',
    contractorExperience: '9',
    foundedYear: '2015',
    nativePlaceCity: 'Bharuch',
    nativePlaceState: 'Gujarat',
    contractorTeamSize: '5',
    available: false,
    contractorBio: 'Licensed electrical contracting crew handling full house wiring, MCB panels, and false-ceiling lighting for apartments and offices in Surat.',
    otherSkills: ['Electrical Wiring', 'False Ceiling', 'POP Work'],
    skillTags: ['Electrical Wiring', 'False Ceiling', 'POP Work'],
    services: ['Electrical Wiring', 'False Ceiling', 'POP Work', 'MCB Panel Upgrades'],
    contractorWebsite: 'https://sheikhelectricalworks.in',
    verificationType: 'aadhaar',
    verificationNumber: '234567891023',
    verified: true,
    gst: '24AAKPS5678K1Z3',
    pan: 'BXKPS5678K',
    labourLicence: 'GLC/2015/002983',
    onTimeRate: '89%',
    jobsCompleted: 1,
    workPhotos: [
      PLACEHOLDER_PHOTO('iqbal-work-1'),
      PLACEHOLDER_PHOTO('iqbal-work-2'),
      PLACEHOLDER_PHOTO('iqbal-work-3'),
    ],
    gallery: [
      { uri: PLACEHOLDER_PHOTO('iqbal-work-1'), caption: 'House wiring' },
      { uri: PLACEHOLDER_PHOTO('iqbal-work-2'), caption: 'MCB panel setup' },
      { uri: PLACEHOLDER_PHOTO('iqbal-work-3'), caption: 'False ceiling lighting' },
    ],
    projects: [
      { name: 'Malek Residence Rewiring', location: 'Adajan, Surat', category: 'Residential', keywords: ['Electrical Wiring', 'CCTV Installation'], value: 220000, status: 'done', photoUri: PLACEHOLDER_PHOTO('iqbal-project-1') },
      { name: 'Desai Office Lighting', location: 'Ring Road, Surat', category: 'Commercial', keywords: ['Electrical Wiring'], value: 140000, status: 'ongoing', photoUri: PLACEHOLDER_PHOTO('iqbal-project-2') },
    ],
    ccScore: 705,
    rating: 4.6,
    reviewCount: 1,
    verifiedAmt: '₹2,20,000',
    demoVerifiedAmount: 220000,
    // Trimmed to exactly the 1 "done" project above (Malek Residence
    // Rewiring) — see the note on demo_contractor_1 for why.
    demoVerifiedWork: [
      { customerName: 'Farhan Malek', providerName: 'Iqbal Sheikh', amount: 220000, rating: 5, review: 'Rewired our entire 3BHK safely, explained the MCB panel setup clearly.', date: '20/03/2025', workType: 'Full House Wiring', status: 'verified' },
    ],
    createdAt: '2024-08-14T09:00:00.000Z',
  },

  // ── Worker — Mason ───────────────────────────────────────────────────────
  {
    uid: 'demo_worker_1',
    isDemo: true,
    profileType: 'worker',
    role: 'Worker',
    name: 'Prakash Solanki',
    phone: '9727033456',
    photoUri: PLACEHOLDER_PHOTO('prakash-solanki'),
    area: 'Manjalpur',
    city: 'Vadodara',
    state: 'Gujarat',
    pincode: '390011',
    lat: 22.3072,
    lng: 73.1812,
    location: 'Manjalpur, Vadodara — 390011',
    workerSkills: ['Mason', 'Tiler'],
    primarySkill: 'Mason',
    skillTags: ['Tiler'],
    workerSkill: 'Mason',
    workerExperience: '11',
    experience: '11',
    available: true,
    workerAbout: 'Experienced mason specialising in brickwork, plastering and tile flooring. Worked on residential bungalows and apartment renovations across Vadodara for over a decade.',
    workPhotos: [
      PLACEHOLDER_PHOTO('prakash-work-1'),
      PLACEHOLDER_PHOTO('prakash-work-2'),
      PLACEHOLDER_PHOTO('prakash-work-3'),
    ],
    projects: [
      { name: 'Pandya Bungalow Brickwork', location: 'Manjalpur, Vadodara', category: 'Residential', keywords: ['Brick Masonry', 'Plastering'], value: 260000, status: 'done', photoUri: PLACEHOLDER_PHOTO('prakash-project-1') },
      { name: 'Rathi Apartment Retiling', location: 'Alkapuri, Vadodara', category: 'Residential', keywords: ['Italian Marble', 'Vitrified Tiles'], value: 180000, status: 'ongoing', photoUri: PLACEHOLDER_PHOTO('prakash-project-2') },
    ],
    category: 'Mason',
    jobsCompleted: 1,
    repeatClients: 2,
    onTimeRate: '96%',
    ccScore: 745,
    rating: 4.7,
    reviewCount: 1,
    verifiedAmt: '₹2,60,000',
    demoVerifiedAmount: 260000,
    // Trimmed to exactly the 1 "done" project above (Pandya Bungalow
    // Brickwork) — see the note on demo_contractor_1 for why.
    demoVerifiedWork: [
      { customerName: 'Harshad Pandya', providerName: 'Prakash Solanki', amount: 260000, rating: 5, review: 'Neat brickwork, very hardworking and honest about material usage.', date: '10/05/2025', workType: 'Brickwork', status: 'verified' },
    ],
    createdAt: '2024-05-20T09:00:00.000Z',
  },

  // ── Professional — Architect ──────────────────────────────────────────────
  {
    uid: 'demo_professional_1',
    isDemo: true,
    profileType: 'professional',
    role: 'Professional',
    name: 'Meera Iyer',
    phone: '9909044567',
    photoUri: PLACEHOLDER_PHOTO('meera-iyer'),
    area: 'Satellite',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015',
    lat: 23.0300,
    lng: 72.5300,
    location: 'Satellite, Ahmedabad — 380015',
    designation: 'Architect',
    category: 'Architect',
    selfEmployed: 'Self Employed',
    degree: 'B.Arch, CEPT University',
    experience: '9',
    regNumber: 'COA/GUJ/2016/2278',
    nativePlaceCity: 'Kochi',
    nativePlaceState: 'Kerala',
    experienceHistory: [
      { title: 'Senior Architect', company: 'Shah Associates', startYear: '2021', endYear: '', current: true },
      { title: 'Architect', company: 'DesignWorks Studio', startYear: '2018', endYear: '2021', current: false },
      { title: 'Junior Architect', company: 'Kochi Design Collective', startYear: '2016', endYear: '2018', current: false },
    ],
    extraSkills: ['Interior Designer', '3D Visualizer'],
    skillTags: ['Interior Designer', '3D Visualizer'],
    bio: 'Independent architect designing homes and small commercial spaces across Ahmedabad, with a focus on natural light, ventilation and budget-conscious material choices.',
    website: 'https://meeraiyerdesigns.in',
    verificationType: 'gst',
    verificationNumber: '24AABCM5678F1Z2',
    verified: true,
    onTimeRate: '97%',
    jobsCompleted: 1,
    workPhotos: [
      PLACEHOLDER_PHOTO('meera-work-1'),
      PLACEHOLDER_PHOTO('meera-work-2'),
      PLACEHOLDER_PHOTO('meera-work-3'),
    ],
    projects: [
      { name: 'Shah Residence Design', location: 'Bodakdev, Ahmedabad', category: 'Residential', keywords: ['Interior Design'], value: 950000, status: 'done', photoUri: PLACEHOLDER_PHOTO('meera-project-1') },
      { name: 'Nair Interior Fit-out', location: 'Vastrapur, Ahmedabad', category: 'Residential', keywords: ['Modular Kitchen', 'Wardrobe', 'Interior Design'], value: 620000, status: 'ongoing', photoUri: PLACEHOLDER_PHOTO('meera-project-2') },
    ],
    ccScore: 810,
    rating: 4.9,
    reviewCount: 1,
    verifiedAmt: '₹9,50,000',
    demoVerifiedAmount: 950000,
    // Trimmed to exactly the 1 "done" project above (Shah Residence Design)
    // — see the note on demo_contractor_1 for why.
    demoVerifiedWork: [
      { customerName: 'Kunal Shah', providerName: 'Meera Iyer', amount: 950000, rating: 5, review: 'Meera designed a beautiful, light-filled home for us within budget. Highly recommended.', date: '28/04/2025', workType: 'Residential Design', status: 'verified', photo: PLACEHOLDER_PHOTO('meera-verified-1') },
    ],
    createdAt: '2024-03-10T09:00:00.000Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// DEMO CHAT CONVERSATIONS — preview content for the Messages list / Chat
// screens only. Entirely client-side and merged in by ChatListScreen.js /
// ChatScreen.js ONLY when DEMO_MODE is on — never written to (or read from)
// the real `chats`/`messages` Firestore collections, so turning DEMO_MODE
// off makes them disappear completely, same as DEMO_PROFILES.
//
// Timestamps are computed relative to "now" at module-load time (not
// hardcoded ISO strings) so they keep rendering as today/yesterday/weekday
// through the same formatChatTime()/dayLabel() helpers real chats use.
// ─────────────────────────────────────────────────────────────────────────

function todayAt(hours, minutes) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function yesterdayAt(hours, minutes) {
  const d = todayAt(hours, minutes);
  d.setDate(d.getDate() - 1);
  return d;
}

// Most recent occurrence of `targetDay` (0=Sun..6=Sat) that is at least 2
// days back, so it reliably falls in the "weekday name" display bucket
// instead of collapsing into "Today"/"Yesterday" if today happens to land
// on that same weekday.
function recentWeekdayAt(targetDay, hours, minutes) {
  const d = new Date();
  let diff = (d.getDay() - targetDay + 7) % 7;
  if (diff < 2) diff += 7;
  d.setDate(d.getDate() - diff);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// `sender: 'me'`/`'them'` are resolved to real uids at load time in
// ChatScreen.js (the current session's uid vs. the participant's demo uid).
// `lastReadByOther` is a single "read up to this point" cutoff — any of my
// own messages timestamped at or before it show read (green ✓✓), matching
// how real chat read-receipts work, rather than per-message flags.
export const DEMO_CHATS = [
  {
    id: 'demo_chat_1',
    isDemo: true,
    unreadCount: 2,
    lastReadByOther: todayAt(9, 38),
    participant: {
      uid: 'demo_chat_participant_1',
      name: 'Ramesh Yadav',
      category: 'Mason',
      profileType: 'worker',
      photoUri: PLACEHOLDER_PHOTO('ramesh-yadav'),
      verified: true,
      available: true,
    },
    messages: [
      { id: 'dc1_m1', sender: 'them', text: 'Namaste sir 🙏 I visited the site today, the wall is ready for plaster.', timestamp: todayAt(9, 12) },
      { id: 'dc1_m2', sender: 'me', text: "Good. What's your rate for 1,800 sq ft including material?", timestamp: todayAt(9, 20) },
      { id: 'dc1_m3', sender: 'them', text: '₹1,20,000 total, sir. Labour ₹1,05,000, material ₹15,000. Work in ~6 weeks.', timestamp: todayAt(9, 34) },
      {
        id: 'dc1_m4', sender: 'them', type: 'work_record', timestamp: todayAt(9, 36),
        workRecordId: 'demo_work_record_1',
        projectName: 'Boundary wall & external plaster',
        workArea: '1,800 sq ft',
        contractValue: 120000,
      },
      { id: 'dc1_m5', sender: 'me', text: 'Confirmed 👍 Please start tomorrow.', timestamp: todayAt(9, 38) },
      { id: 'dc1_m6', sender: 'them', text: "Sir, I'll start the plaster work tomorrow morning. Thank you 🙏", timestamp: todayAt(9, 41) },
    ],
  },
  {
    id: 'demo_chat_2',
    isDemo: true,
    unreadCount: 0,
    lastReadByOther: yesterdayAt(17, 10),
    participant: {
      uid: 'demo_chat_participant_2',
      name: 'Suresh Pawar',
      category: 'Mason & Tiling',
      profileType: 'worker',
      photoUri: PLACEHOLDER_PHOTO('suresh-pawar'),
      verified: false,
      available: false,
    },
    messages: [
      { id: 'dc2_m1', sender: 'me', text: 'Hi Suresh, do you take tiling work in Satellite area?', timestamp: yesterdayAt(16, 2) },
      { id: 'dc2_m2', sender: 'them', text: 'Yes sir, I do tiling and flooring. What is the area size?', timestamp: yesterdayAt(16, 20) },
      { id: 'dc2_m3', sender: 'me', text: 'About 900 sq ft, 2BHK flat.', timestamp: yesterdayAt(16, 25) },
      { id: 'dc2_m4', sender: 'them', text: 'I can visit tomorrow evening and give you exact rate.', timestamp: yesterdayAt(16, 41) },
      { id: 'dc2_m5', sender: 'me', text: 'Can you share a quote for tiling?', timestamp: yesterdayAt(17, 10) },
    ],
  },
  {
    id: 'demo_chat_3',
    isDemo: true,
    unreadCount: 0,
    lastReadByOther: recentWeekdayAt(1, 12, 2),
    participant: {
      uid: 'demo_chat_participant_3',
      name: 'Sai Constructions',
      category: 'Contractors',
      profileType: 'contractor',
      photoUri: PLACEHOLDER_PHOTO('sai-constructions'),
      verified: true,
      available: true,
    },
    messages: [
      { id: 'dc3_m1', sender: 'me', text: 'We need RCC slab work for a G+2 residential project in Bopal.', timestamp: recentWeekdayAt(1, 11, 15) },
      { id: 'dc3_m2', sender: 'them', text: 'Sure sir. What is the total built-up area and expected start date?', timestamp: recentWeekdayAt(1, 11, 48) },
      { id: 'dc3_m3', sender: 'me', text: 'Around 4,500 sq ft, starting next month.', timestamp: recentWeekdayAt(1, 12, 2) },
      { id: 'dc3_m4', sender: 'them', text: "Great, we'll send the crew on Monday 👍", timestamp: recentWeekdayAt(1, 12, 30) },
    ],
  },
];

export const getDemoProfile = (uid) => DEMO_PROFILES.find((p) => p.uid === uid) || null;

export const isDemoUid = (uid) => !!uid && uid.startsWith('demo_');
