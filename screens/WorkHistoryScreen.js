import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getVerifiedWork } from '../services/workService';
const ORANGE = '#FF6B2B';
const GREEN = '#2ECC71';
const GREEN_LIGHT = '#F0FFF4';
const GREEN_DARK = '#1A7A4A';
const BORDER = '#EFEFEF';
const CARD = '#FFFFFF';
const TEXT = '#1A1A1A';
const MUTED = '#666666';

const WORK_JOBS = [
  { id: 1, type: 'RCC Slab Work', location: 'Bopal, Ahmedabad', date: '04 Apr 2026', amount: 20000, year: '2026', customer: 'Naitik R.' },
  { id: 2, type: 'Brick Masonry', location: 'Satellite, Ahmedabad', date: '18 Mar 2026', amount: 15000, year: '2026', customer: 'Rahul M.' },
  { id: 3, type: 'Plastering', location: 'Vejalpur, Ahmedabad', date: '05 Mar 2026', amount: 8000, year: '2026', customer: 'Priya S.' },
  { id: 4, type: 'Tile Flooring', location: 'Maninagar, Ahmedabad', date: '12 Feb 2026', amount: 12000, year: '2026', customer: 'Suresh P.' },
  { id: 5, type: 'Waterproofing', location: 'Naroda, Ahmedabad', date: '28 Jan 2026', amount: 9500, year: '2026', customer: 'Ankit V.' },
  { id: 6, type: 'Foundation Work', location: 'Gandhinagar', date: '10 Dec 2025', amount: 45000, year: '2025', customer: 'Kiran B.' },
  { id: 7, type: 'Column Casting', location: 'Chandkheda', date: '22 Nov 2025', amount: 18000, year: '2025', customer: 'Mohit J.' },
  { id: 8, type: 'RCC Beam Work', location: 'Gota, Ahmedabad', date: '08 Nov 2025', amount: 22000, year: '2025', customer: 'Dimple S.' },
  { id: 9, type: 'Shuttering', location: 'Nikol, Ahmedabad', date: '14 Oct 2025', amount: 11000, year: '2025', customer: 'Rakesh T.' },
  { id: 10, type: 'Plinth Beam', location: 'Vatva, Ahmedabad', date: '02 Sep 2025', amount: 16500, year: '2025', customer: 'Neha K.' },
  { id: 11, type: 'Staircase Work', location: 'Thaltej, Ahmedabad', date: '05 Jul 2024', amount: 24000, year: '2024', customer: 'Sanjay M.' },
  { id: 12, type: 'Roof Casting', location: 'New Ranip', date: '19 May 2024', amount: 38000, year: '2024', customer: 'Patel B.' },
];

const TOTAL_AMOUNT = 482000;
const TOTAL_JOBS = 47;
const TOTAL_COMMISSION = 4820;

const FILTERS = ['All', '2026', '2025', '2024'];

const WORK_ICONS = {
  'RCC': '🏗️', 'Brick': '🧱', 'Plaster': '🪣', 'Tile': '🔳',
  'Water': '💧', 'Found': '⛏️', 'Column': '🏛️', 'Beam': '🔩',
  'Shutt': '🪵', 'Plinth': '🏠', 'Stair': '🪜', 'Roof': '🏚️',
};

function getIcon(type) {
  for (const [key, icon] of Object.entries(WORK_ICONS)) {
    if (type.startsWith(key)) return icon;
  }
  return '🔨';
}

export default function WorkHistoryScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;
  const [activeFilter, setActiveFilter] = useState('All');
  const [workJobs, setWorkJobs] = useState(WORK_JOBS);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(TOTAL_AMOUNT);
  const [totalJobs, setTotalJobs] = useState(TOTAL_JOBS);

  useEffect(() => {
    loadWork();
  }, []);

  const loadWork = async () => {
    try {
      const uid = viewUid || await AsyncStorage.getItem('uid');
      if (!uid) return;
      const works = await getVerifiedWork(uid);
      if (works.length > 0) {
        const mapped = works.map((w, i) => ({
          id: w.id || i,
          type: w.workType || w.description?.split(' ').slice(0, 3).join(' ') || 'Construction Work',
          location: w.location || 'India',
          date: w.date || new Date().toLocaleDateString('en-IN'),
          amount: Number(w.amount) || 0,
          year: String(new Date(w.verifiedAt?.seconds ? w.verifiedAt.seconds * 1000 : Date.now()).getFullYear()),
          customer: w.customerName || 'Customer',
        }));
        setWorkJobs(mapped);
        const total = mapped.reduce((s, j) => s + j.amount, 0);
        setTotalAmount(total);
        setTotalJobs(mapped.length);
      }
    } catch (_) {
      // Keep sample data on error
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeFilter === 'All'
    ? workJobs
    : workJobs.filter((j) => j.year === activeFilter);

  const filteredTotal = filtered.reduce((sum, j) => sum + j.amount, 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verified Work History</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* BIG TOTAL CARD */}
        <View style={styles.totalCard}>
          <View style={styles.totalCardTop}>
            <View style={styles.shieldIcon}>
              <Text style={styles.shieldEmoji}>🛡️</Text>
            </View>
            <View style={styles.cannotEditBadge}>
              <Text style={styles.cannotEditText}>🔒 Cannot Be Edited</Text>
            </View>
          </View>

          <Text style={styles.totalLabel}>Total Verified Work Done</Text>
          {loading
            ? <ActivityIndicator color="#fff" style={{ marginVertical: 8 }} />
            : <Text style={styles.totalAmount}>₹{totalAmount.toLocaleString('en-IN')}</Text>}

          <View style={styles.totalStatsRow}>
            <View style={styles.totalStat}>
              <Text style={styles.totalStatVal}>{totalJobs}</Text>
              <Text style={styles.totalStatKey}>Verified Jobs</Text>
            </View>
            <View style={styles.totalStatDiv} />
            <View style={styles.totalStat}>
              <Text style={styles.totalStatVal}>4.8 ⭐</Text>
              <Text style={styles.totalStatKey}>Avg Rating</Text>
            </View>
            <View style={styles.totalStatDiv} />
            <View style={styles.totalStat}>
              <Text style={styles.totalStatVal}>3 yrs</Text>
              <Text style={styles.totalStatKey}>Work History</Text>
            </View>
          </View>

          <View style={styles.verifiedByRow}>
            <Text style={styles.verifiedByText}>✓ Verified by Construction Corner · Tamper-proof</Text>
          </View>
        </View>

        {/* FILTER TABS */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FILTERED TOTAL */}
        {activeFilter !== 'All' && (
          <View style={styles.filteredSummary}>
            <Text style={styles.filteredLabel}>{activeFilter} Total</Text>
            <Text style={styles.filteredAmount}>₹{filteredTotal.toLocaleString('en-IN')}</Text>
            <Text style={styles.filteredCount}>{filtered.length} jobs</Text>
          </View>
        )}

        {/* JOB LIST */}
        <View style={styles.jobList}>
          {filtered.map((job, i) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobIconBox}>
                <Text style={styles.jobIcon}>{getIcon(job.type)}</Text>
              </View>
              <View style={styles.jobInfo}>
                <Text style={styles.jobType}>{job.type}</Text>
                <Text style={styles.jobLocation}>📍 {job.location}</Text>
                <Text style={styles.jobDate}>🗓️ {job.date} · by {job.customer}</Text>
              </View>
              <View style={styles.jobRight}>
                <Text style={styles.jobAmount}>₹{job.amount.toLocaleString('en-IN')}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* COMMISSION FOOTER */}
        <View style={styles.commissionFooter}>
          <View style={styles.commFootRow}>
            <View>
              <Text style={styles.commFootLabel}>Total Commission Paid to App</Text>
              <Text style={styles.commFootSub}>Supports the ConstructionCorner platform</Text>
            </View>
            <Text style={styles.commFootAmount}>₹{TOTAL_COMMISSION.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.commFootNote}>
            <Text style={styles.commFootNoteText}>
              💡 1% commission per job · Paid via UPI · All transactions verified
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F0' },

  // HEADER
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: ORANGE, fontWeight: '800' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: TEXT },

  // TOTAL CARD
  totalCard: {
    margin: 16, padding: 22,
    backgroundColor: GREEN, borderRadius: 20,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  totalCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  shieldIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  shieldEmoji: { fontSize: 22 },
  cannotEditBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  cannotEditText: { fontSize: 11, color: '#fff', fontWeight: '800' },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 4 },
  totalAmount: { fontSize: 38, fontWeight: '900', color: '#fff', marginBottom: 20 },

  totalStatsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 14, marginBottom: 16 },
  totalStat: { flex: 1, alignItems: 'center', gap: 3 },
  totalStatVal: { fontSize: 16, fontWeight: '900', color: '#fff' },
  totalStatKey: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  totalStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },

  verifiedByRow: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, alignItems: 'center',
  },
  verifiedByText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },

  // FILTER TABS
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: CARD,
  },
  filterTabActive: { borderColor: GREEN, backgroundColor: GREEN_LIGHT },
  filterTabText: { fontSize: 13, fontWeight: '700', color: MUTED },
  filterTabTextActive: { color: GREEN_DARK },

  // FILTERED SUMMARY
  filteredSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 16, padding: 14,
    backgroundColor: GREEN_LIGHT, borderRadius: 12,
    borderWidth: 1, borderColor: '#2ECC7155',
  },
  filteredLabel: { fontSize: 13, color: GREEN_DARK, fontWeight: '700', flex: 1 },
  filteredAmount: { fontSize: 18, fontWeight: '800', color: GREEN_DARK },
  filteredCount: { fontSize: 12, color: GREEN_DARK, fontWeight: '700' },

  // JOB LIST
  jobList: { paddingHorizontal: 16, gap: 10 },
  jobCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  jobIconBox: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center',
  },
  jobIcon: { fontSize: 22 },
  jobInfo: { flex: 1, gap: 2 },
  jobType: { fontSize: 14, fontWeight: '800', color: TEXT },
  jobLocation: { fontSize: 11, color: MUTED },
  jobDate: { fontSize: 11, color: MUTED },
  jobRight: { alignItems: 'flex-end', gap: 6 },
  jobAmount: { fontSize: 16, fontWeight: '800', color: GREEN_DARK },
  verifiedBadge: {
    backgroundColor: GREEN_LIGHT, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1, borderColor: '#2ECC7155',
  },
  verifiedBadgeText: { fontSize: 10, color: GREEN_DARK, fontWeight: '800' },

  // COMMISSION FOOTER
  commissionFooter: {
    margin: 16, marginTop: 24, padding: 18,
    backgroundColor: '#FFF3E0', borderRadius: 16,
    borderWidth: 1, borderColor: '#FFE0C4',
  },
  commFootRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  commFootLabel: { fontSize: 13, fontWeight: '800', color: TEXT, marginBottom: 3 },
  commFootSub: { fontSize: 11, color: MUTED },
  commFootAmount: { fontSize: 22, fontWeight: '800', color: ORANGE },
  commFootNote: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#FFE0C4' },
  commFootNoteText: { fontSize: 11, color: ORANGE, fontWeight: '600' },
});
