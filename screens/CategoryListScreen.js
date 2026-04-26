import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput, Alert,
} from 'react-native';

// ─── Profile screen routing ───────────────────────────────────────────────────
const PROFILE_SCREEN = {
  professional: 'ProfessionalProfile',
  worker:       'WorkerProfile',
  supplier:     'SupplierProfile',
  business:     'BusinessProfile',
};

// ─── Sample data ──────────────────────────────────────────────────────────────

const ARCHITECTS = [
  { avatar: '🏛️', avatarBg: '#EDE7F6', name: 'Vikram Desai',    designation: 'Senior Architect',           location: 'Ahmedabad', experience: '12 yrs exp', rating: '4.9', verifiedAmt: '₹28,50,000', highlight: '✓ Top Rated in Ahmedabad' },
  { avatar: '👩‍🎨', avatarBg: '#FCE4EC', name: 'Ananya Mehta',   designation: 'Principal Architect',         location: 'Ahmedabad', experience: '9 yrs exp',  rating: '4.8', verifiedAmt: '₹22,80,000', highlight: '✓ 28 verified projects' },
  { avatar: '👨‍💼', avatarBg: '#E3F2FD', name: 'Rajat Sharma',   designation: 'Residential Architect',       location: 'Gandhinagar', experience: '7 yrs exp', rating: '4.7', verifiedAmt: '₹18,50,000', highlight: '✓ Verified Professional' },
  { avatar: '👩‍💼', avatarBg: '#E8F5E9', name: 'Deepa Nair',     designation: 'Interior & Facade Architect', location: 'Surat',     experience: '14 yrs exp', rating: '4.9', verifiedAmt: '₹31,00,000', highlight: '✓ 38 verified projects' },
  { avatar: '🧑‍💼', avatarBg: '#FFF3E0', name: 'Karan Malhotra', designation: 'Commercial Architect',        location: 'Vadodara', experience: '6 yrs exp',  rating: '4.6', verifiedAmt: '₹15,20,000', highlight: '✓ Verified Professional' },
];

const CIVIL_ENGINEERS = [
  { avatar: '👨‍🔧', avatarBg: '#E3F2FD', name: 'Naitik Rathod', designation: 'Senior Civil Engineer',    location: 'Ahmedabad',  experience: '11 yrs exp', rating: '4.9', verifiedAmt: '₹42,50,000', highlight: '✓ Top Rated in Ahmedabad' },
  { avatar: '👷',   avatarBg: '#FFF3E0', name: 'Amit Patel',     designation: 'Structural Engineer',      location: 'Surat',      experience: '8 yrs exp',  rating: '4.8', verifiedAmt: '₹28,00,000', highlight: '✓ 33 verified projects' },
  { avatar: '👨‍💼', avatarBg: '#E8F5E9', name: 'Suresh Kumar',   designation: 'Site Civil Engineer',      location: 'Vadodara',   experience: '6 yrs exp',  rating: '4.7', verifiedAmt: '₹19,80,000', highlight: '✓ Verified Professional' },
  { avatar: '👩‍🔧', avatarBg: '#FCE4EC', name: 'Priya Shah',     designation: 'Civil & Design Engineer',  location: 'Ahmedabad',  experience: '10 yrs exp', rating: '4.9', verifiedAmt: '₹38,20,000', highlight: '✓ 46 verified projects' },
  { avatar: '🧑‍💼', avatarBg: '#EDE7F6', name: 'Ravi Mehta',     designation: 'Project Civil Engineer',   location: 'Gandhinagar', experience: '5 yrs exp', rating: '4.6', verifiedAmt: '₹16,50,000', highlight: '✓ Verified Professional' },
];

const INTERIOR_DESIGNERS = [
  { avatar: '🛋️', avatarBg: '#FCE4EC', name: 'Priya Agarwal', designation: 'Senior Interior Designer',      location: 'Ahmedabad',            experience: '10 yrs exp', rating: '4.9', verifiedAmt: '₹32,40,000', highlight: '✓ Top Rated in Ahmedabad' },
  { avatar: '🎨', avatarBg: '#EDE7F6', name: 'Sneha Modi',     designation: 'Luxury Interior Designer',      location: 'Mumbai · Ahmedabad',   experience: '15 yrs exp', rating: '5.0', verifiedAmt: '₹48,00,000', highlight: '✓ 44 verified projects' },
  { avatar: '👩‍🎨', avatarBg: '#FFF3E0', name: 'Kavya Shah',   designation: 'Residential Interior Designer', location: 'Surat',                experience: '7 yrs exp',  rating: '4.7', verifiedAmt: '₹21,00,000', highlight: '✓ Verified Professional' },
  { avatar: '🏡', avatarBg: '#E8F5E9', name: 'Ritu Patel',     designation: 'Commercial Interior Designer',  location: 'Vadodara',             experience: '9 yrs exp',  rating: '4.8', verifiedAmt: '₹26,50,000', highlight: '✓ 31 verified projects' },
  { avatar: '✨', avatarBg: '#E3F2FD', name: 'Neha Joshi',      designation: 'Space Planning Expert',         location: 'Ahmedabad',            experience: '5 yrs exp',  rating: '4.6', verifiedAmt: '₹14,80,000', highlight: '✓ Verified Professional' },
];

const MASONS = [
  { avatar: '🧱', avatarBg: '#FFF3E0', name: 'Ramesh Vishwakarma', designation: 'Expert Mason',              location: 'Ahmedabad',         experience: '14 yrs exp', rating: '4.9', verifiedAmt: '₹4,82,000', highlight: '✓ Top Rated in Ahmedabad' },
  { avatar: '👷', avatarBg: '#E8F5E9', name: 'Suresh Patel',        designation: 'Brickwork Specialist',      location: 'Ahmedabad',         experience: '10 yrs exp', rating: '4.8', verifiedAmt: '₹3,96,000', highlight: '✓ 38 verified jobs' },
  { avatar: '🏗️', avatarBg: '#E3F2FD', name: 'Mukesh Sharma',       designation: 'Plaster & Tile Mason',      location: 'Gandhinagar',       experience: '8 yrs exp',  rating: '4.7', verifiedAmt: '₹2,98,000', highlight: '✓ Verified Worker' },
  { avatar: '🧑‍🔧', avatarBg: '#FCE4EC', name: 'Dinesh Mistri',    designation: 'RCC Work Expert',           location: 'Vatva, Ahmedabad',  experience: '16 yrs exp', rating: '4.9', verifiedAmt: '₹5,45,000', highlight: '✓ 55 verified jobs' },
  { avatar: '👨‍🔨', avatarBg: '#EDE7F6', name: 'Prakash Vishwakarma', designation: 'Senior Masonry Worker',  location: 'Naroda, Ahmedabad', experience: '9 yrs exp',  rating: '4.6', verifiedAmt: '₹2,24,000', highlight: '✓ Verified Worker' },
];

const ELECTRICIANS = [
  { avatar: '⚡', avatarBg: '#FFF9C4', name: 'Rajesh Kumar',  designation: 'Licensed Electrician',         location: 'Ahmedabad',        experience: '12 yrs exp', rating: '4.9', verifiedAmt: '₹5,24,000', highlight: '✓ Top Rated in Ahmedabad' },
  { avatar: '🔌', avatarBg: '#FFF3E0', name: 'Mahesh Patel',  designation: 'Electrical Wiring Specialist', location: 'Surat',            experience: '9 yrs exp',  rating: '4.8', verifiedAmt: '₹4,32,000', highlight: '✓ 44 verified jobs' },
  { avatar: '💡', avatarBg: '#E8F5E9', name: 'Sunil Sharma',  designation: 'Industrial Electrician',       location: 'Vatva, Ahmedabad', experience: '11 yrs exp', rating: '4.7', verifiedAmt: '₹3,52,000', highlight: '✓ Verified Worker' },
  { avatar: '🛠️', avatarBg: '#E3F2FD', name: 'Vikram Singh',  designation: 'Electrical Panel Expert',      location: 'Gandhinagar',      experience: '8 yrs exp',  rating: '4.8', verifiedAmt: '₹4,02,000', highlight: '✓ 41 verified jobs' },
  { avatar: '👷', avatarBg: '#FCE4EC', name: 'Anil Mehta',    designation: 'Domestic Electrician',         location: 'Bopal, Ahmedabad', experience: '6 yrs exp',  rating: '4.6', verifiedAmt: '₹2,72,000', highlight: '✓ Verified Worker' },
];

const PLUMBERS = [
  { avatar: '🔧', avatarBg: '#E3F2FD', name: 'Raju Rastogi',   designation: 'Senior Plumber',                location: 'Ahmedabad',           experience: '15 yrs exp', rating: '4.9', verifiedAmt: '₹6,28,000', highlight: '✓ Top Rated in Ahmedabad' },
  { avatar: '🚿', avatarBg: '#E8F5E9', name: 'Farhan Qureshi', designation: 'Sanitary & Plumbing Expert',    location: 'Surat',               experience: '10 yrs exp', rating: '4.8', verifiedAmt: '₹4,76,000', highlight: '✓ 48 verified jobs' },
  { avatar: '🪠', avatarBg: '#FFF3E0', name: 'Aman Verma',      designation: 'Drainage Specialist',           location: 'Vadodara',            experience: '7 yrs exp',  rating: '4.7', verifiedAmt: '₹3,44,000', highlight: '✓ Verified Worker' },
  { avatar: '💧', avatarBg: '#EDE7F6', name: 'Sanjay Patel',    designation: 'Water Supply Expert',           location: 'Gandhinagar',         experience: '9 yrs exp',  rating: '4.8', verifiedAmt: '₹4,14,000', highlight: '✓ 42 verified jobs' },
  { avatar: '🔩', avatarBg: '#FCE4EC', name: 'Mukesh Kumar',    designation: 'Bathroom Fittings Specialist',  location: 'Naranpura, Ahmedabad', experience: '6 yrs exp', rating: '4.6', verifiedAmt: '₹2,64,000', highlight: '✓ Verified Worker' },
];

const CEMENT_SUPPLIERS = [
  { avatar: '🏗️', avatarBg: '#FFF7ED', name: 'Shree Cement Agency',      designation: 'Cement & Building Materials',  location: 'Odhav, Ahmedabad',     experience: '18 yrs in business', rating: '4.9', verifiedAmt: '₹1,20,00,000', highlight: '✓ Top Rated Supplier' },
  { avatar: '🏪', avatarBg: '#E3F2FD', name: 'Gujarat Cement House',      designation: 'Wholesale Cement Dealer',      location: 'Naroda, Ahmedabad',    experience: '12 yrs in business', rating: '4.7', verifiedAmt: '₹82,50,000',   highlight: '✓ 198 verified orders' },
  { avatar: '🏬', avatarBg: '#E8F5E9', name: 'Patel Cement Store',        designation: 'Retail & Wholesale Dealer',    location: 'Vatva, Ahmedabad',     experience: '9 yrs in business',  rating: '4.6', verifiedAmt: '₹60,00,000',   highlight: '✓ Multi-brand supplier' },
  { avatar: '🏢', avatarBg: '#FCE4EC', name: 'Modi Cement Agency',        designation: 'ACC Authorised Dealer',        location: 'Bavla, Ahmedabad',     experience: '14 yrs in business', rating: '4.8', verifiedAmt: '₹95,00,000',   highlight: '✓ Authorised Dealer' },
  { avatar: '🏭', avatarBg: '#EDE7F6', name: 'Shah Cement Depot',         designation: 'UltraTech Authorised Dealer',  location: 'Kubernagar, Ahmedabad', experience: '11 yrs in business', rating: '4.7', verifiedAmt: '₹71,00,000', highlight: '✓ Authorised Dealer' },
];

const CIVIL_CONTRACTORS = [
  { avatar: '🏢', avatarBg: '#EFF6FF', name: 'Mehta Construction',        designation: 'Civil & Structural Contractor', location: 'Navrangpura, Ahmedabad', experience: '22 yrs in business', rating: '4.9', verifiedAmt: '₹12,00,00,000', highlight: '✓ Top Rated Company' },
  { avatar: '🏗️', avatarBg: '#E8F5E9', name: 'Shah Builders',             designation: 'Residential Builder',          location: 'Bopal, Ahmedabad',       experience: '15 yrs in business', rating: '4.8', verifiedAmt: '₹8,50,00,000',  highlight: '✓ 67 verified projects' },
  { avatar: '🏛️', avatarBg: '#FFF3E0', name: 'Patel Infra',               designation: 'Infrastructure Contractor',    location: 'SG Highway, Ahmedabad',  experience: '12 yrs in business', rating: '4.7', verifiedAmt: '₹6,20,00,000',  highlight: '✓ Verified Company' },
  { avatar: '🏘️', avatarBg: '#FCE4EC', name: 'Gujarat Civil Works',       designation: 'Civil Construction Company',   location: 'Vastral, Ahmedabad',     experience: '10 yrs in business', rating: '4.8', verifiedAmt: '₹9,80,00,000',  highlight: '✓ 71 verified projects' },
  { avatar: '🔩', avatarBg: '#EDE7F6', name: 'Ahmedabad Contractors',     designation: 'General Civil Contractor',     location: 'Gota, Ahmedabad',        experience: '8 yrs in business',  rating: '4.6', verifiedAmt: '₹4,40,00,000',  highlight: '✓ Verified Company' },
];

// ─── Data picker ──────────────────────────────────────────────────────────────
function getSampleProfiles(category, profileType) {
  const cat = (category || '').toLowerCase();

  if (profileType === 'professional') {
    if (cat.includes('architect')) return ARCHITECTS;
    if (cat.includes('interior')) return INTERIOR_DESIGNERS;
    if (cat.includes('civil') || cat.includes('structural') || cat.includes('site') || cat.includes('project') || cat.includes('planning')) return CIVIL_ENGINEERS;
    return ARCHITECTS;
  }

  if (profileType === 'worker') {
    if (cat.includes('mason') || cat.includes('brick') || cat.includes('plaster') || cat.includes('rcc') || cat.includes('tile') || cat.includes('stone') || cat.includes('paint') || cat.includes('door') || cat.includes('window') || cat.includes('garden')) return MASONS;
    if (cat.includes('electric')) return ELECTRICIANS;
    if (cat.includes('plumb') || cat.includes('sanitary')) return PLUMBERS;
    return MASONS;
  }

  if (profileType === 'supplier') return CEMENT_SUPPLIERS;

  return CIVIL_CONTRACTORS;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function ProfileCard({ profile, isLast, onPress }) {
  return (
    <TouchableOpacity
      style={[ss.card, isLast && ss.cardLast]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Image placeholder */}
      <View style={[ss.thumb, { backgroundColor: profile.avatarBg }]}>
        <Text style={ss.thumbEmoji}>{profile.avatar}</Text>

        {/* Green rating badge — Zomato style, top-right of image */}
        <View style={ss.ratingBadge}>
          <Text style={ss.ratingText}>★ {profile.rating}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={ss.info}>
        <Text style={ss.name} numberOfLines={1}>{profile.name}</Text>
        <Text style={ss.desig} numberOfLines={1}>{profile.designation}</Text>
        <Text style={ss.meta} numberOfLines={1}>📍 {profile.location}  ·  {profile.experience}</Text>
        <Text style={ss.highlight} numberOfLines={1}>{profile.highlight}</Text>

        {/* Verified work amount */}
        <Text style={ss.verifiedAmt}>₹ {profile.verifiedAmt.replace('₹', '')} verified work</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CategoryListScreen({ navigation, route }) {
  const { category = 'Professionals', profileType = 'professional' } = route?.params || {};
  const profiles = getSampleProfiles(category, profileType);
  const destScreen = PROFILE_SCREEN[profileType] || 'ProfessionalProfile';

  const typeLabel = {
    professional: 'professionals',
    worker:       'workers',
    supplier:     'suppliers',
    business:     'companies',
  }[profileType] || 'profiles';

  // Zomato uses ~124 as the displayed total — use profiles.length here
  const countLabel = `${profiles.length * 24} ${typeLabel} found`;

  return (
    <View style={ss.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── HEADER ── */}
      <View style={ss.header}>
        <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()}>
          <Text style={ss.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={ss.headerCenter}>
          <Text style={ss.headerTitle} numberOfLines={1}>{category}</Text>
          <Text style={ss.headerCount}>{countLabel}</Text>
        </View>
        <TouchableOpacity
          style={ss.sortBtn}
          onPress={() => Alert.alert('Sort & Filter', 'Coming soon!')}
        >
          <Text style={ss.sortIcon}>⇅</Text>
          <Text style={ss.sortLabel}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* ── SEARCH BAR ── */}
      <View style={ss.searchWrap}>
        <View style={ss.searchBar}>
          <Text style={ss.searchIcon}>🔍</Text>
          <TextInput
            style={ss.searchInput}
            placeholder={`Search ${category.toLowerCase()}...`}
            placeholderTextColor="#AAAAAA"
            returnKeyType="search"
          />
        </View>
      </View>

      {/* ── LIST ── */}
      <ScrollView
        style={ss.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ss.listContent}
      >
        {profiles.map((profile, i) => (
          <ProfileCard
            key={i}
            profile={profile}
            isLast={i === profiles.length - 1}
            onPress={() => navigation.navigate(destScreen, { category, profile })}
          />
        ))}

        <TouchableOpacity
          style={ss.loadMore}
          onPress={() => Alert.alert('Loading more…', 'More profiles coming soon!')}
        >
          <Text style={ss.loadMoreText}>Show more results</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: '#111', fontWeight: '700' },
  headerCenter: { flex: 1, paddingHorizontal: 10 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#111' },
  headerCount: { fontSize: 12, color: '#888', fontWeight: '500', marginTop: 1 },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F5F5F5', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  sortIcon: { fontSize: 14, color: '#333' },
  sortLabel: { fontSize: 13, fontWeight: '700', color: '#333' },

  // Search bar
  searchWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: '#111', padding: 0 },

  // List
  list: { flex: 1 },
  listContent: { paddingTop: 4 },

  // Card — full width, divider style (Zomato)
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardLast: { borderBottomWidth: 0 },

  // Square image (80x80, rounded 12)
  thumb: {
    width: 80, height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  thumbEmoji: { fontSize: 36 },

  // Green rating badge — top-right of image
  ratingBadge: {
    position: 'absolute',
    bottom: 0, right: 0,
    backgroundColor: '#2E7D32',
    borderTopLeftRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  ratingText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },

  // Info section
  info: { flex: 1, paddingTop: 2 },
  name: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 3 },
  desig: { fontSize: 12, color: '#666', fontWeight: '500', marginBottom: 3 },
  meta: { fontSize: 11, color: '#999', fontWeight: '400', marginBottom: 5 },
  highlight: { fontSize: 12, color: '#1565C0', fontWeight: '600', marginBottom: 6 },
  verifiedAmt: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },

  // Load more
  loadMore: {
    margin: 16,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 11,
  },
  loadMoreText: { fontSize: 13, fontWeight: '700', color: '#444' },
});
