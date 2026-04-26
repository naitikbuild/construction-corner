import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, StatusBar
} from 'react-native';
import { useState, useEffect } from 'react';
import { getCompanies } from '../services';

const categories = [
  { icon: '🏗️', label: 'All' },
  { icon: '🏛️', label: 'Developers' },
  { icon: '🏭', label: 'Suppliers' },
  { icon: '👷', label: 'Contractors' },
  { icon: '📐', label: 'Engineers' },
  { icon: '🛋️', label: 'Designers' },
];

const businesses = [
  {
    emoji: '🏢',
    bg: '#EFF6FF',
    accent: '#3B82F6',
    name: 'Shapoorji Pallonji',
    type: 'Developer',
    location: 'Ahmedabad, Gujarat',
    rating: '4.9',
    reviews: 234,
    projects: '500+',
    verified: true,
    tags: ['Residential', 'Commercial', 'Infrastructure'],
    desc: 'One of India\'s largest construction companies with 150+ years of excellence.',
    profileKey: 'civil_engineer',
  },
  {
    emoji: '🏭',
    bg: '#F1F5F9',
    accent: '#0EA5E9',
    name: 'Gujarat Ready Mix Co.',
    type: 'RMC Supplier',
    location: 'Odhav, Ahmedabad',
    rating: '4.8',
    reviews: 320,
    projects: '480+',
    verified: true,
    tags: ['M15-M60', 'GPS Tracking', 'ISO 9001'],
    desc: 'Gujarat\'s most trusted RMC supplier with 3 plants and 19 years experience.',
    profileKey: 'rmc_company',
  },
  {
    emoji: '⚙️',
    bg: '#F8FAFC',
    accent: '#475569',
    name: 'Tata Steel Retailer',
    type: 'Steel Supplier',
    location: 'Vatva GIDC, Ahmedabad',
    rating: '4.7',
    reviews: 189,
    projects: '300+',
    verified: true,
    tags: ['TMT Bars', 'Structural Steel', 'Bulk Orders'],
    desc: 'Authorized Tata Steel dealer offering best prices on TMT bars and structural steel.',
    profileKey: 'civil_engineer',
  },
  {
    emoji: '🏛️',
    bg: '#EEF2FF',
    accent: '#6366F1',
    name: 'Design Arc Studio',
    type: 'Architecture Firm',
    location: 'Navrangpura, Ahmedabad',
    rating: '4.9',
    reviews: 98,
    projects: '120+',
    verified: true,
    tags: ['Residential', 'Commercial', 'Interior'],
    desc: 'Award-winning architecture firm specializing in modern sustainable design.',
    profileKey: 'civil_engineer',
  },
  {
    emoji: '🔌',
    bg: '#FEFCE8',
    accent: '#D97706',
    name: 'Voltex Electrical',
    type: 'Electrical Contractor',
    location: 'Satellite, Ahmedabad',
    rating: '4.6',
    reviews: 76,
    projects: '200+',
    verified: false,
    tags: ['Industrial', 'Residential', 'Solar'],
    desc: 'Complete electrical solutions for residential and industrial projects.',
    profileKey: 'civil_engineer',
  },
  {
    emoji: '🪟',
    bg: '#F0FDF4',
    accent: '#16A34A',
    name: 'AluTech Windows',
    type: 'Windows & Doors',
    location: 'Nikol, Ahmedabad',
    rating: '4.7',
    reviews: 143,
    projects: '350+',
    verified: true,
    tags: ['UPVC', 'Aluminium', 'Soundproof'],
    desc: 'Premium UPVC and aluminium windows and doors manufacturer.',
    profileKey: 'civil_engineer',
  },
];

const skilledWorkers = [
  { icon: '🧱', name: 'Mason', bg: '#FFF7ED', category: 'Mason' },
  { icon: '⚡', name: 'Electrician', bg: '#FEFCE8', category: 'Electrician' },
  { icon: '🔧', name: 'Plumber', bg: '#EFF6FF', category: 'Plumber' },
  { icon: '🪚', name: 'Carpenter', bg: '#FFF7ED', category: 'Carpenter' },
  { icon: '🎨', name: 'Painter', bg: '#FDF4FF', category: 'Painter' },
  { icon: '🔩', name: 'Welder', bg: '#F1F5F9', category: 'Welder' },
  { icon: '🟫', name: 'Tile Fixer', bg: '#FFFBEB', category: 'Tile Fixer' },
  { icon: '💧', name: 'Waterproofing', bg: '#EFF6FF', category: 'Waterproofing' },
  { icon: '⚙️', name: 'Steel\nFabricator', bg: '#F8FAFC', category: 'Steel Fabricator' },
  { icon: '🦺', name: 'Safety\nOfficer', bg: '#FFF7ED', category: 'Safety Officer' },
];

const featured = [
  { emoji: '🏗️', name: 'L&T Construction', type: 'Contractor', location: 'Pan India', rating: '5.0', bg: '#1a1a2e' },
  { emoji: '🧱', name: 'UltraTech Cement', type: 'Cement Supplier', location: 'Gujarat', rating: '4.9', bg: '#7A3500' },
  { emoji: '🛋️', name: 'Space Matrix', type: 'Interior Design', location: 'Ahmedabad', rating: '4.8', bg: '#4A0080' },
];

const contractorBusinesses = businesses.filter(b =>
  ['Electrical Contractor', 'Architecture Firm', 'Developer', 'EPC Contractor', 'Turnkey', 'RMC Supplier', 'Steel Supplier', 'Windows & Doors'].includes(b.type) ||
  b.type.toLowerCase().includes('contractor') ||
  b.type.toLowerCase().includes('developer') ||
  b.type.toLowerCase().includes('supplier')
);

export default function B2BScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('contractors');
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState('');
  const [bizData, setBizData] = useState(businesses);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await getCompanies();
      if (data.length > 0) setBizData(data);
    } catch (_) {}
  };

  const filtered = bizData.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>B2B Connect</Text>
          <Text style={styles.headerSub}>Find business partners</Text>
        </View>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="Search companies, suppliers..."
            placeholderTextColor="#AAAAAA"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ fontSize: 16, color: '#999' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contractors' && styles.tabActive]}
          onPress={() => setActiveTab('contractors')}
        >
          <Text style={[styles.tabText, activeTab === 'contractors' && styles.tabTextActive]}>🏗️ Contractors</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'serviceproviders' && styles.tabActive]}
          onPress={() => setActiveTab('serviceproviders')}
        >
          <Text style={[styles.tabText, activeTab === 'serviceproviders' && styles.tabTextActive]}>👷 Service Providers</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {activeTab === 'contractors' && (
          <>
            {/* FEATURED */}
            {search.length === 0 && (
              <View style={styles.featuredSection}>
                <View style={styles.secHead}>
                  <Text style={styles.secTitle}>⭐ Featured Contractors</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}>
                  {featured.map((f, i) => (
                    <TouchableOpacity key={i} style={[styles.featuredCard, { backgroundColor: f.bg }]} onPress={() => navigation.navigate('BusinessProfile', { company: f })}>
                      <Text style={styles.featuredEmoji}>{f.emoji}</Text>
                      <Text style={styles.featuredName}>{f.name}</Text>
                      <Text style={styles.featuredType}>{f.type}</Text>
                      <View style={styles.featuredFooter}>
                        <Text style={styles.featuredLocation}>📍 {f.location}</Text>
                        <Text style={styles.featuredRating}>⭐ {f.rating}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* CATEGORIES */}
            {search.length === 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
                {categories.map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.catChip, activeCategory === i && styles.catChipActive]}
                    onPress={() => setActiveCategory(i)}
                  >
                    <Text style={styles.catIcon}>{c.icon}</Text>
                    <Text style={[styles.catLabel, activeCategory === i && styles.catLabelActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* STATS BAR */}
            {search.length === 0 && (
              <View style={styles.statsBar}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>12,400+</Text>
                  <Text style={styles.statLab}>Companies</Text>
                </View>
                <View style={styles.statDiv} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>8,200+</Text>
                  <Text style={styles.statLab}>Verified</Text>
                </View>
                <View style={styles.statDiv} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>24 States</Text>
                  <Text style={styles.statLab}>Coverage</Text>
                </View>
              </View>
            )}

            {/* CONTRACTOR LISTINGS */}
            <View style={styles.secHead}>
              <Text style={styles.secTitle}>
                {search.length > 0 ? `Results for "${search}"` : '🏢 Contractor Companies'}
              </Text>
              <Text style={styles.secCount}>{filtered.length} found</Text>
            </View>

            <View style={styles.listingsWrap}>
              {filtered.map((b, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.bizCard}
                  onPress={() => navigation.navigate('BusinessProfile', { company: b })}
                >
                  <View style={styles.bizCardTop}>
                    <View style={[styles.bizAvatar, { backgroundColor: b.bg }]}>
                      <Text style={{ fontSize: 28 }}>{b.emoji}</Text>
                    </View>
                    <View style={styles.bizInfo}>
                      <View style={styles.bizNameRow}>
                        <Text style={styles.bizName}>{b.name}</Text>
                        {b.verified && (
                          <View style={[styles.verifiedBadge, { backgroundColor: b.accent }]}>
                            <Text style={styles.verifiedText}>✓</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.bizType}>{b.type}</Text>
                      <Text style={styles.bizLocation}>📍 {b.location}</Text>
                    </View>
                    <View style={styles.bizRating}>
                      <Text style={styles.bizRatingNum}>⭐ {b.rating}</Text>
                      <Text style={styles.bizReviews}>({b.reviews})</Text>
                    </View>
                  </View>
                  <Text style={styles.bizDesc}>{b.desc}</Text>
                  <View style={styles.bizTags}>
                    {b.tags.map((t, ti) => (
                      <View key={ti} style={[styles.bizTag, { borderColor: b.accent }]}>
                        <Text style={[styles.bizTagText, { color: b.accent }]}>{t}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.bizFooter}>
                    <Text style={styles.bizProjects}>📁 {b.projects} projects</Text>
                    <View style={styles.bizActions}>
                      <TouchableOpacity style={[styles.connectBtn, { backgroundColor: b.accent }]} onPress={() => navigation.navigate('ChatList')}>
                        <Text style={styles.connectBtnText}>Connect</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.msgBtn} onPress={() => navigation.navigate('ChatList')}>
                        <Text style={styles.msgBtnText}>💬</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {activeTab === 'serviceproviders' && (
          <>
            <View style={styles.secHead}>
              <Text style={styles.secTitle}>👷 Individual Service Providers</Text>
            </View>
            <Text style={styles.spSubtitle}>Hire skilled tradespeople for your project</Text>
            <View style={styles.workerGrid}>
              {skilledWorkers.map((w, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.workerCard}
                  onPress={() => navigation.navigate('WorkerList', { workerType: w.category })}
                >
                  <View style={[styles.workerCardIcon, { backgroundColor: w.bg }]}>
                    <Text style={styles.workerCardEmoji}>{w.icon}</Text>
                  </View>
                  <Text style={styles.workerCardName}>{w.name}</Text>
                  <Text style={styles.workerCardArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0ED' },

  // HEADER
  header: { backgroundColor: '#0EA5E9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18, color: 'white', fontWeight: '700' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: 'white' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  filterIconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  // SEARCH
  searchWrap: { backgroundColor: '#0EA5E9', paddingHorizontal: 14, paddingBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 13, color: '#111', fontWeight: '600' },

  // TABS
  tabsRow: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1.5, borderBottomColor: '#E8E0D8' },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#0EA5E9' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6B6560' },
  tabTextActive: { color: '#0EA5E9' },

  // SERVICE PROVIDERS GRID
  spSubtitle: { fontSize: 11, color: '#6B6560', fontWeight: '600', paddingHorizontal: 16, marginTop: -4, marginBottom: 14 },
  workerGrid: { paddingHorizontal: 14, gap: 10 },
  workerCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#D9D4CC', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  workerCardIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  workerCardEmoji: { fontSize: 26 },
  workerCardName: { flex: 1, fontSize: 14, fontWeight: '800', color: '#111' },
  workerCardArrow: { fontSize: 22, color: '#CCC', fontWeight: '300' },

  // SKILLED WORKERS (legacy horizontal scroll kept for possible reuse)
  skilledSection: { paddingTop: 16 },
  workerItem: { alignItems: 'center', gap: 6, width: 68 },
  workerIconBox: { width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  workerEmoji: { fontSize: 28 },
  workerName: { fontSize: 10, fontWeight: '700', color: '#333', textAlign: 'center', lineHeight: 14 },

  // FEATURED
  featuredSection: { paddingTop: 16 },
  featuredCard: { width: 150, borderRadius: 14, padding: 14, justifyContent: 'flex-end', height: 130 },
  featuredEmoji: { fontSize: 32, marginBottom: 8 },
  featuredName: { fontSize: 13, fontWeight: '800', color: 'white', marginBottom: 2 },
  featuredType: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 8 },
  featuredFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  featuredLocation: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  featuredRating: { fontSize: 10, color: 'white', fontWeight: '700' },

  // CATEGORIES
  catScroll: { paddingVertical: 14 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#E8E0D8' },
  catChipActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '700', color: '#555' },
  catLabelActive: { color: 'white' },

  // STATS BAR
  statsBar: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 14, borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '900', color: '#0EA5E9', marginBottom: 2 },
  statLab: { fontSize: 10, fontWeight: '600', color: '#6B6560' },
  statDiv: { width: 1, backgroundColor: '#E8E0D8' },

  // SECTION HEAD
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  secTitle: { fontSize: 15, fontWeight: '900', color: '#111' },
  secCount: { fontSize: 12, fontWeight: '600', color: '#6B6560', backgroundColor: '#D9D4CC', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },

  // BIZ CARDS
  listingsWrap: { paddingHorizontal: 14, gap: 12 },
  bizCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#D9D4CC', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  bizCardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  bizAvatar: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bizInfo: { flex: 1 },
  bizNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  bizName: { fontSize: 14, fontWeight: '800', color: '#111' },
  verifiedBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  verifiedText: { fontSize: 10, color: 'white', fontWeight: '900' },
  bizType: { fontSize: 11, color: '#6B6560', fontWeight: '600', marginBottom: 2 },
  bizLocation: { fontSize: 11, color: '#999' },
  bizRating: { alignItems: 'flex-end' },
  bizRatingNum: { fontSize: 12, fontWeight: '700', color: '#111' },
  bizReviews: { fontSize: 10, color: '#999' },
  bizDesc: { fontSize: 12, color: '#6B6560', lineHeight: 18, marginBottom: 10 },
  bizTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  bizTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1.5, backgroundColor: '#FAFAFA' },
  bizTagText: { fontSize: 10, fontWeight: '700' },
  bizFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 10 },
  bizProjects: { fontSize: 11, color: '#6B6560', fontWeight: '600' },
  bizActions: { flexDirection: 'row', gap: 8 },
  connectBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  connectBtnText: { fontSize: 12, fontWeight: '700', color: 'white' },
  msgBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F5EFE8', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8E0D8' },
  msgBtnText: { fontSize: 16 },
});
