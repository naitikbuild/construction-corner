import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { injectFonts } from '../theme/typography';
import {
  getAllProviderWorkRecords, getAllPartnerWorkRecords, getWorkRecordShareAmount,
  deleteWorkRecord, WORK_RECORD_STATUS,
} from '../services/workRecordService';
import { formatAmountIndian } from '../utils/format';
import { getCurrentUid } from '../utils/session';

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
  if (r.status === WORK_RECORD_STATUS.VERIFIED || r.status === WORK_RECORD_STATUS.COMPLETED_PAID) return r.confirmedAt;
  if (r.status === WORK_RECORD_STATUS.DISPUTED) return r.disputedAt;
  if (r.status === WORK_RECORD_STATUS.REJECTED) return r.startRejectedAt;
  if (r.status === WORK_RECORD_STATUS.PARTNER_DECLINED) return r.partnerDeclinedAt;
  if (r.status === WORK_RECORD_STATUS.PENDING_COMPLETION_APPROVAL) return r.completedAt;
  if (r.status === WORK_RECORD_STATUS.ONGOING) return r.startApprovedAt;
  if (r.status === WORK_RECORD_STATUS.PENDING_START_APPROVAL) return r.lockedAt;
  if (r.status === WORK_RECORD_STATUS.PENDING_PARTNER_APPROVAL) return r.lockedAt;
  return r.updatedAt || r.createdAt;
}

const STATUS_META = {
  [WORK_RECORD_STATUS.DRAFT]: { label: 'DRAFT', color: MID, bg: FILL },
  [WORK_RECORD_STATUS.PENDING_PARTNER_APPROVAL]: { label: 'AWAITING PARTNER APPROVAL', color: AMBER_TEXT, bg: AMBER_BG },
  [WORK_RECORD_STATUS.PENDING_START_APPROVAL]: { label: 'AWAITING START APPROVAL', color: AMBER_TEXT, bg: AMBER_BG },
  [WORK_RECORD_STATUS.ONGOING]: { label: 'ONGOING', color: GREEN, bg: GREEN_LIGHT },
  [WORK_RECORD_STATUS.REJECTED]: { label: 'REJECTED', color: ALERT, bg: '#FDEAEA' },
  [WORK_RECORD_STATUS.PARTNER_DECLINED]: { label: 'PARTNER DECLINED', color: ALERT, bg: '#FDEAEA' },
  [WORK_RECORD_STATUS.PENDING_COMPLETION_APPROVAL]: { label: 'AWAITING COMPLETION APPROVAL', color: AMBER_TEXT, bg: AMBER_BG },
  [WORK_RECORD_STATUS.VERIFIED]: { label: 'COMPLETED', color: GREEN, bg: GREEN_LIGHT },
  [WORK_RECORD_STATUS.COMPLETED_PAID]: { label: 'COMPLETED', color: GREEN, bg: GREEN_LIGHT },
  [WORK_RECORD_STATUS.DISPUTED]: { label: 'DISPUTED', color: ALERT, bg: '#FDEAEA' },
};

// PENDING_PARTNER_APPROVAL reads differently depending on which side of the
// partnership `record.myRole` is — the provider is waiting (existing
// STATUS_META entry), but the partner has something to DO, so they get a
// distinct, more urgent-looking badge instead of "awaiting" phrasing that
// would read as if someone else needs to act.
function recordStatusMeta(record) {
  if (record.myRole === 'partner' && record.status === WORK_RECORD_STATUS.PENDING_PARTNER_APPROVAL) {
    return { label: 'ACTION NEEDED', color: AMBER_TEXT, bg: AMBER_BG };
  }
  return STATUS_META[record.status] || STATUS_META[WORK_RECORD_STATUS.DRAFT];
}

// The small second line under a partnered record's row — differs by role:
// the partner sees whose record it is and their own share; the provider
// sees who the partner is and the agreed split (or, while still pending,
// that they're waiting on the partner specifically).
function partnershipLine(record) {
  if (!record.partnerId) return null;
  if (record.myRole === 'partner') {
    const pct = record.partnerSharePct != null ? `${record.partnerSharePct}%` : '—';
    const verified = record.status === WORK_RECORD_STATUS.VERIFIED || record.status === WORK_RECORD_STATUS.COMPLETED_PAID;
    const amt = verified ? ` = ${formatAmountIndian(getWorkRecordShareAmount(record, record.partnerId))}` : '';
    return `🤝 Partner on ${record.lockedByName || 'the provider'}'s record · Your share ${pct}${amt}`;
  }
  if (record.status === WORK_RECORD_STATUS.PENDING_PARTNER_APPROVAL) {
    return `🤝 Waiting for ${record.partnerName || 'partner'} to approve`;
  }
  const pp = record.providerSharePct != null ? `${record.providerSharePct}%` : '—';
  const ps = record.partnerSharePct != null ? `${record.partnerSharePct}%` : '—';
  return `🤝 Partner: ${record.partnerName || 'Partner'} · ${pp}/${ps}`;
}

// Each section groups records under one header via a role-aware predicate
// (not just a raw status list) — PENDING_PARTNER_APPROVAL in particular
// needs to land in a completely different section depending on whether this
// uid is the record's provider or its partner (see 'partnerRequests' vs
// 'pendingPartner' below). VERIFIED and COMPLETED_PAID both read as
// "COMPLETED" here, they just differ in whether the amount is still
// correctable (see CreateWorkRecordScreen).
const SECTIONS = [
  {
    key: 'partnerRequests', title: 'PARTNERSHIP REQUESTS',
    sub: 'A provider added you as a partner — approve or decline the split',
    match: (r) => r.myRole === 'partner' && r.status === WORK_RECORD_STATUS.PENDING_PARTNER_APPROVAL,
  },
  { key: 'drafts', title: 'DRAFTS', sub: 'In progress, not yet sent', match: (r) => r.status === WORK_RECORD_STATUS.DRAFT },
  {
    key: 'pendingPartner', title: 'AWAITING PARTNER APPROVAL',
    sub: 'Sent to partner — client not notified yet',
    match: (r) => r.myRole === 'provider' && r.status === WORK_RECORD_STATUS.PENDING_PARTNER_APPROVAL,
  },
  { key: 'pendingStart', title: 'AWAITING START APPROVAL', sub: 'Sent to client — still editable until they respond', match: (r) => r.status === WORK_RECORD_STATUS.PENDING_START_APPROVAL },
  { key: 'ongoing', title: 'ONGOING', sub: 'Approved by the client — still editable', match: (r) => r.status === WORK_RECORD_STATUS.ONGOING },
  { key: 'pendingCompletion', title: 'AWAITING COMPLETION APPROVAL', sub: 'Marked complete — still editable until they confirm', match: (r) => r.status === WORK_RECORD_STATUS.PENDING_COMPLETION_APPROVAL },
  { key: 'completed', title: 'COMPLETED', sub: 'Verified', match: (r) => r.status === WORK_RECORD_STATUS.VERIFIED || r.status === WORK_RECORD_STATUS.COMPLETED_PAID },
  { key: 'disputed', title: 'DISPUTED', sub: '', match: (r) => r.status === WORK_RECORD_STATUS.DISPUTED },
  { key: 'rejected', title: 'REJECTED', sub: 'Client declined to start', match: (r) => r.status === WORK_RECORD_STATUS.REJECTED },
  { key: 'partnerDeclined', title: 'PARTNER DECLINED', sub: 'Partner declined the split', match: (r) => r.status === WORK_RECORD_STATUS.PARTNER_DECLINED },
];

function RecordRow({ record, onPress, onDelete }) {
  const meta = recordStatusMeta(record);
  const date = formatDate(recordDate(record));
  const partnerLine = partnershipLine(record);
  // Drafts and declined (rejected/partner-declined) records are deletable —
  // none is part of an actual engagement yet. Once sent and acted on beyond
  // that, it's part of the verified/dispute trail (see
  // workRecordService.deleteWorkRecord) — and only the LEAD PROVIDER can
  // ever delete a record at all (deleteWorkRecord enforces this too), so a
  // partner-side row never shows the delete button regardless of status.
  const canDelete = record.myRole === 'provider' && (
    record.status === WORK_RECORD_STATUS.DRAFT
    || record.status === WORK_RECORD_STATUS.REJECTED
    || record.status === WORK_RECORD_STATUS.PARTNER_DECLINED
  );
  return (
    <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowName} numberOfLines={1}>{record.projectName || 'Untitled project'}</Text>
        <Text style={s.rowMeta} numberOfLines={1}>
          {record.clientName || 'No client'}{date ? ` · ${date}` : ''}
        </Text>
        {partnerLine ? <Text style={s.rowPartnership} numberOfLines={1}>{partnerLine}</Text> : null}
      </View>
      <View style={s.rowRight}>
        <Text style={s.rowAmount}>{record.contractValue ? formatAmountIndian(record.contractValue) : '—'}</Text>
        <View style={[s.badge, { backgroundColor: meta.bg }]}>
          <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      {canDelete && (
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.6}
        >
          <Text style={s.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      )}
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// Lists every work record this uid is party to — as the lead provider
// (including drafts, which are otherwise orphaned: excluded from the
// profile's Verified Projects, and nothing else surfaces them) AND as a
// partner (including still-pending or already-declined partnerships, so
// there's somewhere to see and act on a partnership request — see
// workRecordService.getAllProviderWorkRecords / getAllPartnerWorkRecords).
// Each record is tagged with `myRole` so RecordRow/SECTIONS/openRecord all
// know which side of the record this uid is on.
export default function MyWorkRecordsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [uid, setUid] = useState(null);

  const load = useCallback(async () => {
    try {
      const currentUid = await getCurrentUid();
      setUid(currentUid);
      if (!currentUid || currentUid.startsWith('guest_')) {
        setRecords([]);
        return;
      }
      const [asProvider, asPartner] = await Promise.all([
        getAllProviderWorkRecords(currentUid),
        getAllPartnerWorkRecords(currentUid),
      ]);
      setRecords([
        ...asProvider.map(r => ({ ...r, myRole: 'provider' })),
        ...asPartner.map(r => ({ ...r, myRole: 'partner' })),
      ]);
    } catch (_) {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDeleteRecord = (record) => {
    const isDraft = record.status === WORK_RECORD_STATUS.DRAFT;
    Alert.alert(
      isDraft ? 'Delete this draft?' : 'Delete this record?',
      isDraft
        ? 'This will permanently remove the draft work record. This cannot be undone.'
        : 'This will permanently remove this declined work record. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => performDeleteRecord(record) },
      ]
    );
  };

  // Removes from the list immediately for a responsive feel; if the delete
  // actually fails (network, or the record's status changed underneath us),
  // put it back and tell the provider rather than leaving the list wrong.
  const performDeleteRecord = async (record) => {
    setRecords(prev => prev.filter(r => r.id !== record.id));
    try {
      await deleteWorkRecord(record.id, uid);
    } catch (err) {
      setRecords(prev => [...prev, record]);
      Alert.alert('Could Not Delete', err.message || 'Something went wrong. Please try again.');
    }
  };

  // push (not navigate) so re-opening a record from this list always mounts a
  // fresh screen instance for that exact recordId — reusing an existing
  // stack instance via navigate() would keep stale form state/recordId from
  // whatever record was open before, which is what caused a provider's
  // second saved record to silently overwrite their first. A partner-side
  // record has no editable form at all — it always opens PartnerApproval,
  // which is read-only past the pending stage.
  const openRecord = (record) => {
    if (record.myRole === 'partner') {
      navigation.push('PartnerApproval', { recordId: record.id });
    } else {
      navigation.push('CreateWorkRecord', { recordId: record.id });
    }
  };

  const sections = SECTIONS
    .map(sec => ({ ...sec, records: records.filter(sec.match) }))
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
            onPress={() => navigation.push('CreateWorkRecord')}
            activeOpacity={0.85}
          >
            <Text style={s.emptyBtnText}>Create work record</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {sections.map(sec => (
            <View key={sec.key} style={s.section}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>{sec.title} ({sec.records.length})</Text>
                {sec.sub ? <Text style={s.sectionSub}>{sec.sub}</Text> : null}
              </View>
              <View style={s.sectionCard}>
                {sec.records.map((r, i) => (
                  <View key={r.id} style={i > 0 ? s.rowBorder : null}>
                    <RecordRow record={r} onPress={() => openRecord(r)} onDelete={() => confirmDeleteRecord(r)} />
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
  rowPartnership: { fontSize: 11, color: GREEN, fontWeight: '600', marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowAmount: { fontSize: 13, fontWeight: '800', color: GREEN },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  chevron: { fontSize: 18, color: '#B5B5B5', marginLeft: 2 },
  deleteBtn: { padding: 4, marginLeft: 6 },
  deleteBtnText: { fontSize: 15 },
});
