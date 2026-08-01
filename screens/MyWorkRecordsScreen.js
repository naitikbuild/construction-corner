import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { injectFonts } from '../theme/typography';
import { getAllProviderWorkRecords, WORK_RECORD_STATUS } from '../services/workRecordService';
import { formatAmountIndian } from '../utils/format';
import { auth } from '../config/firebase';

const DARK   = '#262626';
const GREEN  = '#22A559';
const GREEN_LIGHT = '#EAF7EF';
const BG     = '#FAF9F5';
const FILL   = '#F2F2F2';
const BORDER = '#E5E5E5';
const MID    = '#737373';
const LIGHT  = '#8E8E8E';
const ALERT  = '#B00020';
const AMBER_BG = '#FFF3E0';
const AMBER_TEXT = '#B26A00';

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

// The most relevant timestamp for a record's current status.
function recordDate(r) {
  if (r.status === WORK_RECORD_STATUS.CONFIRMED) return r.confirmedAt;
  if (r.status === WORK_RECORD_STATUS.DISPUTED) return r.disputedAt;
  if (r.status === WORK_RECORD_STATUS.LOCKED_PENDING_CONFIRMATION) return r.lockedAt;
  return r.updatedAt || r.createdAt;
}

const STATUS_META = {
  [WORK_RECORD_STATUS.DRAFT]: { label: 'DRAFT', color: MID, bg: FILL },
  [WORK_RECORD_STATUS.LOCKED_PENDING_CONFIRMATION]: { label: 'AWAITING CONFIRMATION', color: AMBER_TEXT, bg: AMBER_BG },
  [WORK_RECORD_STATUS.CONFIRMED]: { label: 'COMPLETED', color: GREEN, bg: GREEN_LIGHT },
  [WORK_RECORD_STATUS.DISPUTED]: { label: 'DISPUTED', color: ALERT, bg: '#FDEAEA' },
};

const SECTIONS = [
  { status: WORK_RECORD_STATUS.DRAFT, title: 'DRAFTS', sub: 'In progress, not yet completed' },
  { status: WORK_RECORD_STATUS.LOCKED_PENDING_CONFIRMATION, title: 'AWAITING CONFIRMATION', sub: 'Locked, waiting for client to confirm & rate' },
  { status: WORK_RECORD_STATUS.CONFIRMED, title: 'COMPLETED', sub: 'Verified' },
  { status: WORK_RECORD_STATUS.DISPUTED, title: 'DISPUTED', sub: '' },
];

function RecordRow({ record, onPress }) {
  const meta = STATUS_META[record.status] || STATUS_META[WORK_RECORD_STATUS.DRAFT];
  const date = formatDate(recordDate(record));
  return (
    <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowName} numberOfLines={1}>{record.projectName || 'Untitled project'}</Text>
        <Text style={s.rowMeta} numberOfLines={1}>
          {record.clientName || 'No client'}{date ? ` · ${date}` : ''}
        </Text>
      </View>
      <View style={s.rowRight}>
        <Text style={s.rowAmount}>{record.contractValue ? formatAmountIndian(record.contractValue) : '—'}</Text>
        <View style={[s.badge, { backgroundColor: meta.bg }]}>
          <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// Lists every work record a provider has — including drafts, which are
// otherwise orphaned (excluded from the profile's Verified Projects, and
// nothing else surfaces them). See workRecordService.getAllProviderWorkRecords.
export default function MyWorkRecordsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);

  const load = useCallback(async () => {
    try {
      const cachedUid = await AsyncStorage.getItem('uid');
      const uid = auth.currentUser?.uid || cachedUid;
      if (!uid || uid.startsWith('guest_')) {
        setRecords([]);
        return;
      }
      const all = await getAllProviderWorkRecords(uid);
      setRecords(all);
    } catch (_) {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openRecord = (record) => {
    navigation.navigate('CreateWorkRecord', { recordId: record.id });
  };

  const sections = SECTIONS
    .map(sec => ({ ...sec, records: records.filter(r => r.status === sec.status) }))
    .filter(sec => sec.records.length > 0);

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Work Records</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={DARK} />
        </View>
      ) : records.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>🧾</Text>
          <Text style={s.emptyText}>No work records yet</Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => navigation.navigate('CreateWorkRecord')}
            activeOpacity={0.85}
          >
            <Text style={s.emptyBtnText}>Create work record</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {sections.map(sec => (
            <View key={sec.status} style={s.section}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>{sec.title} ({sec.records.length})</Text>
                {sec.sub ? <Text style={s.sectionSub}>{sec.sub}</Text> : null}
              </View>
              <View style={s.sectionCard}>
                {sec.records.map((r, i) => (
                  <View key={r.id} style={i > 0 ? s.rowBorder : null}>
                    <RecordRow record={r} onPress={() => openRecord(r)} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, fontWeight: '700', color: DARK },
  headerTitle: { fontSize: 15, fontWeight: '600', color: DARK },

  emptyIcon: { fontSize: 40, opacity: 0.6 },
  emptyText: { fontSize: 14, color: LIGHT, fontWeight: '600' },
  emptyBtn: {
    marginTop: 8, backgroundColor: DARK, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 24,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  section: { marginTop: 18, paddingHorizontal: 14 },
  sectionHead: { marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: LIGHT, letterSpacing: 0.8 },
  sectionSub: { fontSize: 11, color: LIGHT, fontWeight: '500', marginTop: 2 },
  sectionCard: {
    borderRadius: 14, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  rowName: { fontSize: 13, fontWeight: '700', color: DARK },
  rowMeta: { fontSize: 11, color: LIGHT, fontWeight: '500', marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowAmount: { fontSize: 13, fontWeight: '800', color: GREEN },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  chevron: { fontSize: 18, color: '#B5B5B5', marginLeft: 2 },
});
