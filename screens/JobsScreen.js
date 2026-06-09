import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, StatusBar, ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { getAllJobs } from '../services/jobService';

const filters = ['All', 'Full Time', 'Part Time', 'Contract', 'Urgent'];

const jobs = [
  {
    emoji: '🏗️',
    bg: '#EFF6FF',
    accent: '#3B82F6',
    title: 'Site Engineer',
    company: 'Shapoorji Pallonji',
    location: 'Ahmedabad, Gujarat',
    pay: '₹45,000/mo',
    type: 'Full Time',
    urgent: false,
    posted: '2 days ago',
    applicants: 34,
    exp: '3-5 years',
    skills: ['RCC', 'AutoCAD', 'Site Management'],
    desc: 'Looking for experienced site engineer for G+10 residential project in Bopal, Ahmedabad.',
  },
  {
    emoji: '⚡',
    bg: '#FEFCE8',
    accent: '#D97706',
    title: 'Electrical Supervisor',
    company: 'L&T Construction',
    location: 'Gandhinagar, Gujarat',
    pay: '₹55,000/mo',
    type: 'Full Time',
    urgent: true,
    posted: '1 day ago',
    applicants: 12,
    exp: '5+ years',
    skills: ['HT/LT Panels', 'Industrial', 'Safety'],
    desc: 'Urgent requirement for electrical supervisor for industrial project at GIDC Gandhinagar.',
  },
  {
    emoji: '📐',
    bg: '#EEF2FF',
    accent: '#6366F1',
    title: 'AutoCAD Draftsman',
    company: 'Design Arc Studio',
    location: 'Navrangpura, Ahmedabad',
    pay: '₹25,000/mo',
    type: 'Part Time',
    urgent: false,
    posted: '3 days ago',
    applicants: 28,
    exp: '1-2 years',
    skills: ['AutoCAD', '2D Drafting', 'Architecture'],
    desc: 'Part time draftsman needed for residential architecture projects. Work from home option available.',
  },
  {
    emoji: '🏛️',
    bg: '#F0FDF4',
    accent: '#16A34A',
    title: 'Junior Architect',
    company: 'Space Design Co.',
    location: 'Surat, Gujarat',
    pay: '₹30,000/mo',
    type: 'Full Time',
    urgent: false,
    posted: '5 days ago',
    applicants: 56,
    exp: '0-2 years',
    skills: ['SketchUp', 'Revit', '3D Rendering'],
    desc: 'Fresh graduates welcome! Looking for creative junior architect for commercial projects.',
  },
  {
    emoji: '🔧',
    bg: '#F0F9FF',
    accent: '#0EA5E9',
    title: 'Plumbing Contractor',
    company: 'BuildRight Infra',
    location: 'Vadodara, Gujarat',
    pay: '₹40,000/mo',
    type: 'Contract',
    urgent: true,
    posted: 'Today',
    applicants: 8,
    exp: '4+ years',
    skills: ['CPVC', 'SWR', 'Firefighting'],
    desc: 'Contract plumbing work for G+15 residential tower. 6 month contract with extension possible.',
  },
  {
    emoji: '🛋️',
    bg: '#FDF2F8',
    accent: '#EC4899',
    title: 'Interior Designer',
    company: 'Priya Design Studio',
    location: 'Ahmedabad, Gujarat',
    pay: '₹35,000/mo',
    type: 'Full Time',
    urgent: false,
    posted: '1 week ago',
    applicants: 43,
    exp: '2-4 years',
    skills: ['3ds Max', 'AutoCAD', 'Client Handling'],
    desc: 'Creative interior designer needed for luxury residential projects in Ahmedabad.',
  },
];

export default function JobsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState(0);
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState([]);
  const [jobsData, setJobsData] = useState(jobs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await getAllJobs();
      if (data.length > 0) {
        const mapped = data.map(j => ({
          emoji: '🏗️',
          bg: '#EFF6FF',
          accent: '#3B82F6',
          title: j.title || 'Job Opening',
          company: j.company || j.postedBy || 'Company',
          location: j.location || 'India',
          pay: j.salary ? `₹${Number(j.salary).toLocaleString('en-IN')}/${j.salaryPer === 'Day' ? 'day' : 'mo'}` : 'Negotiable',
          type: j.jobType || 'Full Time',
          urgent: j.urgent || false,
          posted: 'Recently',
          applicants: (j.applicants || []).length,
          exp: j.experience || '',
          skills: j.skills || [],
          desc: j.description || '',
          id: j.id,
          ...j,
        }));
        setJobsData(mapped);
      }
    } catch (_) {
      // Keep sample jobs on error
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (i) => {
    setSaved(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const filtered = jobsData.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 0 ? true :
      activeFilter === 4 ? j.urgent :
      j.type === filters[activeFilter];
    return matchSearch && matchFilter;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Job Board</Text>
          <Text style={styles.headerSub}>{loading ? 'Loading...' : `${jobsData.length} jobs available`}</Text>
        </View>
        <TouchableOpacity style={styles.postJobBtn} onPress={() => navigation.navigate('PostJob')}>
          <Text style={styles.postJobText}>+ Post Job</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="Search jobs, companies..."
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

      <View style={styles.statsRow}>
        <Text style={styles.statInline}><Text style={styles.statNum}>2,400+</Text> Jobs</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.statInline}><Text style={styles.statNum}>840+</Text> Companies</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.statInline}><Text style={styles.statNum}>12</Text> Urgent</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.statInline}>📍 Gujarat</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
        {filters.map((f, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.filterChip, activeFilter === i && styles.filterChipActive, f === 'Urgent' && styles.filterChipUrgent, f === 'Urgent' && activeFilter === i && styles.filterChipUrgentActive]}
            onPress={() => setActiveFilter(i)}
          >
            {f === 'Urgent' && <Text style={{ fontSize: 12 }}>🔥</Text>}
            <Text style={[styles.filterText, activeFilter === i && styles.filterTextActive, f === 'Urgent' && styles.filterTextUrgent]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>{filtered.length} jobs found</Text>
          <TouchableOpacity style={styles.sortBtn}>
            <Text style={styles.sortText}>Sort: Latest ↓</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.jobsList}>
          {filtered.map((j, i) => (
            <TouchableOpacity key={i} style={styles.jobCard} onPress={() => navigation.navigate('PostJob')}>
              {/* TOP ROW */}
              <View style={styles.jobCardTop}>
                <View style={[styles.jobAvatar, { backgroundColor: j.bg }]}>
                  <Text style={{ fontSize: 28 }}>{j.emoji}</Text>
                </View>
                <View style={styles.jobInfo}>
                  <View style={styles.jobTitleRow}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{j.title}</Text>
                    {j.urgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>🔥 Urgent</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.jobCompany} numberOfLines={1}>{j.company}</Text>
                  <Text style={styles.jobLocation} numberOfLines={1}>📍 {j.location}</Text>
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={() => toggleSave(i)}>
                  <Text style={{ fontSize: 18 }}>{saved.includes(i) ? '🔖' : '🏷️'}</Text>
                </TouchableOpacity>
              </View>

              {/* BOTTOM ROW */}
              <View style={styles.jobFooter}>
                <View style={styles.jobMetaLeft}>
                  <View style={[styles.jobTypeBadge, { backgroundColor: j.bg }]}>
                    <Text style={[styles.jobTypeText, { color: j.accent }]}>{j.type}</Text>
                  </View>
                  <Text style={styles.jobPosted}>{j.posted}</Text>
                  <Text style={styles.jobApplicants}>· 👥 {j.applicants}</Text>
                </View>
                <View style={styles.jobMetaRight}>
                  <Text style={styles.jobPay}>{j.pay}</Text>
                  <TouchableOpacity style={styles.applyBtn} onPress={() => navigation.navigate('ChatList')}>
                    <Text style={styles.applyBtnText}>Apply →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  // Header
  header: { backgroundColor: '#0EA5E9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14, gap: 12 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18, color: 'white', fontWeight: '700' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: 'white' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  postJobBtn: { backgroundColor: '#FC8019', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  postJobText: { fontSize: 12, fontWeight: '800', color: 'white' },

  // Search
  searchWrap: { backgroundColor: '#0EA5E9', paddingHorizontal: 14, paddingBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 13, color: '#111', fontWeight: '500' },

  // Stats — single compact line
  statsRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    backgroundColor: 'white', marginHorizontal: 14, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 9, marginTop: 12,
    gap: 6,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statInline: { fontSize: 12, color: '#666', fontWeight: '500' },
  statNum: { fontSize: 12, fontWeight: '800', color: '#0EA5E9' },
  statDot: { fontSize: 12, color: '#CCC', fontWeight: '700' },

  // Filter chips — compact Zomato style
  filterScroll: { paddingVertical: 10 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: 'white', borderWidth: 1, borderColor: '#E8E8E8' },
  filterChipActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  filterChipUrgent: { borderColor: '#F97316' },
  filterChipUrgentActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#555' },
  filterTextActive: { color: 'white' },
  filterTextUrgent: { color: '#F97316' },

  // List
  scroll: { flex: 1 },
  resultsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  resultsText: { fontSize: 12, fontWeight: '600', color: '#888' },
  sortBtn: { backgroundColor: '#EEEEEE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  sortText: { fontSize: 11, fontWeight: '700', color: '#555' },

  // Cards — Zomato compact
  jobsList: { paddingHorizontal: 14, gap: 10 },
  jobCard: {
    backgroundColor: 'white', borderRadius: 14,
    padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  jobCardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  jobAvatar: { width: 60, height: 60, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  jobInfo: { flex: 1, justifyContent: 'center' },
  jobTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' },
  jobTitle: { fontSize: 14, fontWeight: '800', color: '#111' },
  urgentBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  urgentText: { fontSize: 10, fontWeight: '700', color: '#E65100' },
  jobCompany: { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 2 },
  jobLocation: { fontSize: 11, color: '#999' },
  saveBtn: { padding: 2, alignSelf: 'flex-start' },

  // Footer row
  jobFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 10,
  },
  jobMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jobTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  jobTypeText: { fontSize: 10, fontWeight: '700' },
  jobPosted: { fontSize: 11, color: '#AAAAAA', fontWeight: '500' },
  jobApplicants: { fontSize: 11, color: '#AAAAAA', fontWeight: '500' },
  jobMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobPay: { fontSize: 13, fontWeight: '900', color: '#2E7D32' },
  applyBtn: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  applyBtnText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
});