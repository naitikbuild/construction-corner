import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { injectFonts } from '../theme/typography';

import { getVerifiedWork } from '../services/workService';
import { getProviderWorkRecords, WORK_RECORD_STATUS } from '../services/workRecordService';
import { isDemoUid } from '../demoData';
import { getCurrentUid } from '../utils/session';
const ORANGE = '#262626';
const GREEN = '#22A559';
const GREEN_LIGHT = '#EAF7EF';
const GREEN_DARK = '#1A7A4A';
const BORDER = '#E5E5E5';
const CARD = '#FFFFFF';
const TEXT = '#262626';
const MUTED = '#737373';

const FILTERS = ['All', '2026', '2025', '2024'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toJsDate(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(v) {
  const d = toJsDate(v);
  if (!d) return null;
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

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
  const [workJobs, setWorkJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [avgRating, setAvgRating] = useState(null);

  // Demo profiles keep their fixture data (getVerifiedWork already
  // special-cases demo uids). Real accounts read CONFIRMED work_records —
  // the same source the provider's own profile now uses — never the old
  // hardcoded sample jobs. Guests have no real records, so they land on the
  // empty state.
  const loadWork = useCallback(async () => {
    try {
      const uid = viewUid || (await getCurrentUid());
      if (!uid) { setLoading(false); return; }

      let mapped = [];
      if (isDemoUid(uid)) {
        const works = await getVerifiedWork(uid);
        mapped = works.map((w, i) => ({
          id: w.id || i,
          type: w.workType || 'Construction Work',
          location: w.location || 'India',
          date: w.date || new Date().toLocaleDateString('en-IN'),
          amount: Number(w.amount) || 0,
          year: String(new Date(w.verifiedAt?.seconds ? w.verifiedAt.seconds * 1000 : Date.now()).getFullYear()),
          customer: w.customerName || 'Customer',
          rating: Number(w.rating) || 0,
        }));
      } else if (!uid.startsWith('guest_')) {
        const records = await getProviderWorkRecords(uid);
        const confirmed = records.filter(r => r.status === WORK_RECORD_STATUS.VERIFIED || r.status === WORK_RECORD_STATUS.COMPLETED_PAID);
        mapped = confirmed.map(r => ({
          id: r.id,
          type: r.projectName || 'Construction Work',
          location: r.location || 'India',
          date: formatDate(r.confirmedAt) || new Date().toLocaleDateString('en-IN'),
          amount: Number(r.labourCharge) || 0,
          year: String(toJsDate(r.confirmedAt)?.getFullYear() || new Date().getFullYear()),
          customer: r.clientName || 'Client',
          rating: Number(r.rating) || 0,
        }));
      }

      setWorkJobs(mapped);
      const total = mapped.reduce((s, j) => s + j.amount, 0);
      setTotalAmount(total);
      setTotalJobs(mapped.length);
      const rated = mapped.filter(j => j.rating > 0);
      setAvgRating(rated.length > 0 ? (rated.reduce((s, j) => s + j.rating, 0) / rated.length).toFixed(1) : null);
    } catch (_) {
      setWorkJobs([]);
      setTotalAmount(0);
      setTotalJobs(0);
      setAvgRating(null);
    } finally {
      setLoading(false);
    }
  }, [viewUid]);

  useFocusEffect(useCallback(() => { loadWork(); }, [loadWork]));

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
              <Text style={styles.totalStatVal}>{avgRating ? `${avgRating} ⭐` : '—'}</Text>
              <Text style={styles.totalStatKey}>Avg Rating</Text>
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
        {!loading && workJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>No work history yet</Text>
            <Text style={styles.emptySub}>Confirmed work records will show up here once a client confirms them.</Text>
          </View>
        ) : (
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
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = injectFonts({
  root: { flex: 1, backgroundColor: '#FAF9F5' },

  // HEADER
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center',
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

  // EMPTY STATE
  emptyState: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 40, opacity: 0.6 },
  emptyText: { fontSize: 15, fontWeight: '700', color: TEXT },
  emptySub: { fontSize: 12, color: MUTED, textAlign: 'center', lineHeight: 18 },

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
});
