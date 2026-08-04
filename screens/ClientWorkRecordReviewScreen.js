import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { injectFonts } from '../theme/typography';
import PhotoViewer from '../components/PhotoViewer';
import { getCurrentUid } from '../utils/session';
import { getProfile } from '../services/userService';
import { getWorkRecord, disputeWorkRecord, WORK_RECORD_STATUS } from '../services/workRecordService';
import { sendNotification } from '../services/notificationService';

const DARK   = '#262626';
const GREEN  = '#22A559';
const BG     = '#FAF9F5';
const FILL   = '#F2F2F2';
const BORDER = '#E5E5E5';
const MID    = '#737373';
const LIGHT  = '#8E8E8E';
const ALERT  = '#B00020';
const LINK_BLUE = '#1877F2';

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

function formatINR(n) {
  const num = Number(n) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

function providerTradeLine(p) {
  if (!p) return '';
  const trade = p.category || p.workerSkill || p.primarySkill || p.contractorType || p.designation || '';
  const exp = p.workerExperience || p.contractorExperience || p.experience || '';
  return [trade, exp ? `${exp} yrs exp` : null].filter(Boolean).join(' · ');
}

function DetailCell({ label, value, green }) {
  return (
    <View style={s.detailCell}>
      <Text style={s.detailCellLabel}>{label}</Text>
      <Text style={[s.detailCellValue, green && s.detailCellValueGreen]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// Client-side read-only view of a locked work record — reached by tapping the
// work-record card shared in chat (see ChatScreen's recordId handling and
// CreateWorkRecordScreen's role-based redirect). Lets the client either
// confirm + rate (→ RateWorkRecordScreen) or raise an issue.
export default function ClientWorkRecordReviewScreen({ navigation, route }) {
  const recordId = route?.params?.recordId ?? null;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [provider, setProvider] = useState(null);
  const [myUid, setMyUid] = useState(null);
  const [disputing, setDisputing] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const load = useCallback(async () => {
    if (!recordId) { setLoading(false); return; }
    try {
      // Prefer the live Firebase Auth uid over the cached AsyncStorage copy —
      // a stale cache here would misidentify the client (blocking the real
      // client from reviewing, or attributing a dispute to the wrong uid).
      const me = await getCurrentUid();
      setMyUid(me);
      const rec = await getWorkRecord(recordId);
      setRecord(rec);
      if (rec?.providerId) {
        try { setProvider(await getProfile(rec.providerId)); } catch (_) {}
      }
    } catch (_) {
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isClient = !!myUid && !!record && record.clientId === myUid;
  const photos = record?.photos || [];
  const providerName = provider?.name || provider?.companyName || record?.lockedByName || 'Provider';
  const providerVerified = !!(provider?.verificationNumber || provider?.verified);

  const handleRaiseIssue = () => {
    Alert.alert(
      'Raise an issue?',
      `${providerName} will be notified that you raised an issue with this work record.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Raise Issue', style: 'destructive', onPress: doRaiseIssue },
      ]
    );
  };

  const doRaiseIssue = async () => {
    setDisputing(true);
    try {
      await disputeWorkRecord(recordId, { disputedBy: myUid });
      await sendNotification(
        record.providerId,
        'work_disputed',
        `${record.clientName || 'The client'} raised an issue with "${record.projectName || 'a work record'}"`,
        { recordId }
      );
      setRecord(prev => ({ ...prev, status: WORK_RECORD_STATUS.DISPUTED }));
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit. Please try again.');
    } finally {
      setDisputing(false);
    }
  };

  const handleConfirmAndRate = () => {
    navigation.navigate('RateWorkRecord', { recordId });
  };

  if (loading) {
    return (
      <View style={s.center}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <ActivityIndicator size="large" color={DARK} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={s.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Work Record</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <Text style={s.emptyIcon}>🔍</Text>
          <Text style={s.emptyText}>This work record could not be found.</Text>
        </View>
      </View>
    );
  }

  if (!isClient) {
    return (
      <View style={s.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Work Record</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <Text style={s.emptyIcon}>🔒</Text>
          <Text style={s.emptyText}>Only {record.clientName || 'the client'} can review this work record.</Text>
        </View>
      </View>
    );
  }

  const isPending = record.status === WORK_RECORD_STATUS.SENT_TO_CLIENT;
  const isConfirmed = record.status === WORK_RECORD_STATUS.CONFIRMED;
  const isDisputed = record.status === WORK_RECORD_STATUS.DISPUTED;

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Work Record</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={s.banner}>
          <Text style={s.bannerText}>
            📤 Sent by {record.lockedByName || providerName} on {formatDate(record.lockedAt) || '—'} for your review
          </Text>
        </View>

        {isConfirmed && (
          <View style={s.statusBannerGreen}>
            <Text style={s.statusBannerGreenText}>✓ You confirmed and rated this work{record.rating ? ` — ${record.rating}★` : ''}.</Text>
          </View>
        )}
        {isDisputed && (
          <View style={s.statusBannerAlert}>
            <Text style={s.statusBannerAlertText}>⚑ You raised an issue with this work record. The provider has been notified.</Text>
          </View>
        )}

        <View style={s.providerRow}>
          <View style={s.providerAvatar}>
            {provider?.photoUri ? (
              <Image source={{ uri: provider.photoUri }} style={s.providerAvatarImg} />
            ) : (
              <Text style={{ fontSize: 22 }}>👤</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.providerNameRow}>
              <Text style={s.providerName} numberOfLines={1}>{providerName}</Text>
              {providerVerified && (
                <View style={s.verifiedBadge}>
                  <Text style={s.verifiedBadgeText}>✓</Text>
                </View>
              )}
            </View>
            {providerTradeLine(provider) ? (
              <Text style={s.providerTrade} numberOfLines={1}>{providerTradeLine(provider)}</Text>
            ) : null}
          </View>
        </View>

        <View style={s.titleWrap}>
          <Text style={s.projectName}>{record.projectName || 'Untitled project'}</Text>
          {record.workArea ? <Text style={s.workArea}>{record.workArea}</Text> : null}
        </View>

        <View style={s.detailGrid}>
          <DetailCell label="Planned Start" value={formatDate(record.plannedStart) || '—'} />
          <DetailCell label="Planned Finish" value={formatDate(record.plannedFinish) || '—'} />
          <DetailCell
            label="Contract Value"
            value={record.contractValue ? formatINR(record.contractValue) : '—'}
            green={!!record.contractValue}
          />
          {record.category ? <DetailCell label="Category" value={record.category} /> : null}
        </View>

        {record.keywords?.length > 0 ? (
          <View style={s.compactField}>
            <Text style={s.compactLabel}>Type of Work</Text>
            <View style={s.keywordTagsWrap}>
              {record.keywords.map((k, i) => (
                <View key={i} style={s.keywordTag}>
                  <Text style={s.keywordTagText}>{k}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={s.compactField}>
          <Text style={s.compactLabel}>Work Photos</Text>
          {photos.length > 0 ? (
            <View style={s.photoGrid}>
              {photos.map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.photoSlot}
                  activeOpacity={0.85}
                  onPress={() => { setViewerIndex(i); setViewerOpen(true); }}
                >
                  <Image source={{ uri }} style={s.photoThumb} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={s.readOnlyBox}>
              <Text style={s.readOnlyMuted}>No photos added</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {isPending && (
        <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            style={[s.issueBtn, disputing && s.btnDisabled]}
            onPress={handleRaiseIssue}
            activeOpacity={0.85}
            disabled={disputing}
          >
            {disputing ? <ActivityIndicator color={DARK} /> : <Text style={s.issueBtnText}>Raise an issue</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.confirmBtn, disputing && s.btnDisabled]}
            onPress={handleConfirmAndRate}
            activeOpacity={0.85}
            disabled={disputing}
          >
            <Text style={s.confirmBtnText}>Confirm & Rate ★</Text>
          </TouchableOpacity>
        </View>
      )}

      <PhotoViewer
        visible={viewerOpen}
        photos={photos}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />
    </View>
  );
}

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG, paddingHorizontal: 32, gap: 10 },
  emptyIcon: { fontSize: 36, opacity: 0.6 },
  emptyText: { fontSize: 14, color: LIGHT, fontWeight: '600', textAlign: 'center' },

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

  banner: {
    flexDirection: 'row', marginHorizontal: 14, marginTop: 10, marginBottom: 6, padding: 12,
    borderRadius: 12, backgroundColor: FILL, borderWidth: 1, borderColor: BORDER,
  },
  bannerText: { fontSize: 12, color: MID, fontWeight: '600', lineHeight: 18, flex: 1 },

  statusBannerGreen: {
    marginHorizontal: 14, marginBottom: 6, padding: 12,
    borderRadius: 12, backgroundColor: '#EAF7EF', borderWidth: 1, borderColor: '#B7E4C7',
  },
  statusBannerGreenText: { fontSize: 12, color: GREEN, fontWeight: '700', lineHeight: 18 },
  statusBannerAlert: {
    marginHorizontal: 14, marginBottom: 6, padding: 12,
    borderRadius: 12, backgroundColor: '#FDEAEA', borderWidth: 1, borderColor: '#F3B9B9',
  },
  statusBannerAlertText: { fontSize: 12, color: ALERT, fontWeight: '700', lineHeight: 18 },

  providerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, marginTop: 10,
  },
  providerAvatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  providerAvatarImg: { width: 50, height: 50, borderRadius: 25 },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  providerName: { fontSize: 15, fontWeight: '700', color: DARK, flexShrink: 1 },
  verifiedBadge: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: LINK_BLUE,
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF' },
  providerTrade: { fontSize: 12, color: MID, fontWeight: '500', marginTop: 2 },

  titleWrap: { paddingHorizontal: 14, marginTop: 16 },
  projectName: { fontSize: 18, fontWeight: '700', color: DARK },
  workArea: { fontSize: 13, color: MID, fontWeight: '500', marginTop: 3 },

  detailGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14,
    marginTop: 14, gap: 8,
  },
  detailCell: {
    width: '47.5%', backgroundColor: FILL, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  detailCellLabel: { fontSize: 10, fontWeight: '600', color: LIGHT, marginBottom: 2 },
  detailCellValue: { fontSize: 13, color: DARK, fontWeight: '600' },
  detailCellValueGreen: { color: GREEN, fontWeight: '700' },

  compactField: { paddingHorizontal: 14, marginTop: 16 },
  compactLabel: { fontSize: 12, fontWeight: '600', color: DARK, marginBottom: 8 },

  keywordTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordTag: {
    backgroundColor: '#EAF7EF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  keywordTagText: { fontSize: 12, fontWeight: '600', color: GREEN },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoSlot: { width: 92, height: 92, borderRadius: 10, overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%' },

  readOnlyBox: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: FILL,
  },
  readOnlyMuted: { fontSize: 13, color: LIGHT, fontStyle: 'italic' },

  bottomBar: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 12,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: BORDER,
  },
  issueBtn: {
    flex: 1, height: 50, borderRadius: 14,
    borderWidth: 1.5, borderColor: DARK, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  issueBtnText: { fontSize: 14, fontWeight: '700', color: DARK },
  confirmBtn: {
    flex: 1.3, height: 50, borderRadius: 14,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  btnDisabled: { opacity: 0.6 },
});
