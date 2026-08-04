import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ActivityIndicator, Linking,
  Image, Modal, TextInput, Animated, Switch,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PhotoViewer from '../components/PhotoViewer';
import ProjectDetailModal from '../components/ProjectDetailModal';
import AllProjectsModal from '../components/AllProjectsModal';
import { useAutoHideHeader } from '../hooks/useAutoHideHeader';
import { useToast } from '../hooks/useToast';
import { getProfile, recordProfileView, updateProfile } from '../services/userService';
import { getVerifiedWork, getTotalVerifiedAmount } from '../services/workService';
import { getProviderWorkRecords, workRecordToProject, workRecordToVerifiedWork, getClientReviews, WORK_RECORD_STATUS } from '../services/workRecordService';
import ClientReviewsSection from '../components/ClientReviewsSection';
import { getCurrentUid } from '../utils/session';
import { formatAmountIndian, formatJoinedDate } from '../utils/format';

// Slot size is measured from the grid container's ACTUAL laid-out width via
// onLayout, not guessed from useWindowDimensions() minus assumed padding —
// the guessed chrome can be wrong relative to the real rendered content box.
// Measuring the real container removes the guesswork entirely (same pattern
// as Contractor's GalleryGrid / Worker's WorkPhotoGrid).
const GRID_GAP = 8;

function PortfolioGrid({ photos = [], isOwn, onAdd, onReplace, onRemove, onView }) {
  const [gridWidth, setGridWidth] = useState(0);
  const slotSize = gridWidth > 0 ? Math.floor((gridWidth - GRID_GAP * 2) / 3) - 1 : 0;
  const slotBox = { width: slotSize, height: slotSize };
  const filled = Array.isArray(photos) ? photos.filter(Boolean).slice(0, 6) : [];
  const slots = [...filled, ...Array(Math.max(0, 6 - filled.length)).fill(null)];

  return (
    <View style={wp.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
      {gridWidth === 0 ? null : slots.map((uri, i) => (
        <View key={i} style={[wp.slot, slotBox]}>
          {uri ? (
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => onView(i)}>
              <Image source={{ uri }} style={wp.thumb} resizeMode="cover" />
              {isOwn && (
                <>
                  <TouchableOpacity style={wp.replaceBtn} onPress={() => onReplace(i)}>
                    <Text style={wp.replaceBtnText}>🔄</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={wp.removeBtn} onPress={() => onRemove(i)}>
                    <Text style={wp.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          ) : isOwn ? (
            <TouchableOpacity style={wp.addSlot} onPress={onAdd} activeOpacity={0.7}>
              <Text style={wp.addSlotIcon}>+</Text>
            </TouchableOpacity>
          ) : (
            <View style={wp.placeholder}>
              <Text style={wp.placeholderIcon}>🖼️</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const wp = injectFonts({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { borderRadius: 10, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1, backgroundColor: '#F2F2F2',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },
  placeholderIcon: { fontSize: 20, opacity: 0.3 },
  addSlot: {
    flex: 1, backgroundColor: '#F2F2F2',
    borderWidth: 1.5, borderColor: '#E5E5E5', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  addSlotIcon: { fontSize: 26, fontWeight: '300', color: '#8E8E8E' },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  replaceBtn: {
    position: 'absolute', top: 4, left: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  replaceBtnText: { fontSize: 9 },
});

// ─── VERIFIED PROJECTS list ─────────────────────────────────────────────────
// Category + amount reads better than location for scanning a list —
// "Residential · ₹18.5L" tells a client type + scale at a glance.
function projectSubline(p) {
  return [p.category, p.value ? formatAmountIndian(p.value) : null].filter(Boolean).join(' · ');
}

const PROJECTS_PREVIEW_COUNT = 3;

function ProjectsList({ projects = [], onOpenProject }) {
  if (projects.length === 0) {
    return <Text style={s.placeholder}>Add your projects</Text>;
  }
  const visible = projects.slice(0, PROJECTS_PREVIEW_COUNT);
  return (
    <View>
      {visible.map((p, i) => (
        <TouchableOpacity
          key={i}
          style={[pj.row, i > 0 && pj.rowBorder]}
          activeOpacity={0.7}
          onPress={() => onOpenProject(p)}
        >
          <View style={pj.thumb}>
            {p.photoUri ? (
              <Image source={{ uri: p.photoUri }} style={pj.thumbImg} resizeMode="cover" />
            ) : (
              <Text style={pj.thumbIcon}>🏗️</Text>
            )}
          </View>
          <View style={pj.info}>
            <Text style={pj.name} numberOfLines={1}>{p.name || 'Untitled project'}</Text>
            {projectSubline(p) ? <Text style={pj.meta} numberOfLines={1}>{projectSubline(p)}</Text> : null}
          </View>
          <View style={[pj.badge, p.status === 'ongoing' ? pj.badgeOngoing : pj.badgeDone]}>
            <Text style={[pj.badgeText, p.status === 'ongoing' ? pj.badgeTextOngoing : pj.badgeTextDone]}>
              {p.status === 'ongoing' ? 'ONGOING' : 'DONE'}
            </Text>
          </View>
          <Text style={pj.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const pj = injectFonts({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  thumb: {
    width: 46, height: 46, borderRadius: 10,
    backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbIcon: { fontSize: 18, opacity: 0.5 },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: '#262626', marginBottom: 2 },
  meta: { fontSize: 12, color: '#8E8E8E', fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeOngoing: { backgroundColor: '#FFF3E0' },
  badgeDone: { backgroundColor: '#EAF7EF' },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  badgeTextOngoing: { color: '#B26A00' },
  badgeTextDone: { color: '#1E874B' },
  chevron: { fontSize: 18, color: '#B5B5B5', marginLeft: 2 },
});

// ─── Chip list (SERVICES / TOOLS) ───────────────────────────────────────────
function ChipsList({ items = [], emptyText }) {
  if (items.length === 0) {
    return <Text style={s.placeholder}>{emptyText}</Text>;
  }
  return (
    <View style={s.chipsWrap}>
      {items.map((item, i) => (
        <View key={i} style={s.plainChip}>
          <Text style={s.plainChipText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── EXPERIENCE (work history) ──────────────────────────────────────────────
function calcExperienceDuration(entry) {
  const start = Number(entry.startYear);
  if (!start) return '';
  const end = entry.current ? new Date().getFullYear() : (Number(entry.endYear) || start);
  const yrs = Math.max(0, end - start);
  if (yrs <= 0) return '<1 yr';
  return `${yrs} yr${yrs === 1 ? '' : 's'}`;
}

function ExperienceList({ entries = [], isOwn, onEdit, onAdd }) {
  return (
    <View>
      {entries.length === 0 ? (
        <Text style={s.placeholder}>Add your work experience</Text>
      ) : (
        entries.map((e, i) => {
          const row = (
            <View style={[ex.row, i > 0 && ex.rowBorder]}>
              <Text style={ex.icon}>💼</Text>
              <View style={{ flex: 1 }}>
                <Text style={ex.title} numberOfLines={1}>{e.title || 'Role'}</Text>
                <Text style={ex.meta} numberOfLines={1}>
                  {[
                    e.company || null,
                    e.startYear ? `${e.startYear} – ${e.current ? 'Present' : (e.endYear || 'Present')}` : null,
                    calcExperienceDuration(e),
                  ].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {isOwn && <Text style={ex.chevron}>›</Text>}
            </View>
          );
          return isOwn ? (
            <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => onEdit(e)}>{row}</TouchableOpacity>
          ) : (
            <View key={i}>{row}</View>
          );
        })
      )}
      {isOwn && (
        <TouchableOpacity style={ex.addBtn} onPress={onAdd} activeOpacity={0.8}>
          <Text style={ex.addBtnText}>+ Add experience</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const ex = injectFonts({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  icon: { fontSize: 14, marginTop: 1 },
  title: { fontSize: 13, fontWeight: '700', color: '#262626', marginBottom: 2 },
  meta: { fontSize: 12, color: '#8E8E8E', fontWeight: '500' },
  chevron: { fontSize: 16, color: '#B5B5B5' },
  addBtn: { marginTop: 10, alignItems: 'center' },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#262626' },
});

// ─── QUALIFICATIONS: fixed rows (registration/employment) + dynamic entries ──
function QualificationRows({ rows = [] }) {
  if (rows.length === 0) return null;
  return (
    <View>
      {rows.map((r, i) => (
        <View key={r.key} style={[ql.row, i > 0 && ql.rowBorder]}>
          <Text style={ql.label}>{r.label}</Text>
          <Text style={ql.value} numberOfLines={1}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

const ql = injectFonts({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  label: { fontSize: 13, fontWeight: '600', color: '#262626' },
  value: { fontSize: 13, fontWeight: '500', color: '#737373', flexShrink: 1 },
});

function QualificationEntryList({ entries = [], isOwn, onEdit, onAdd }) {
  if (entries.length === 0 && !isOwn) return null;
  return (
    <View>
      {entries.length === 0 ? (
        <Text style={s.placeholder}>Add your qualifications</Text>
      ) : (
        entries.map((e, i) => {
          const row = (
            <View style={[ex.row, i > 0 && ex.rowBorder]}>
              <Text style={ex.icon}>🎓</Text>
              <View style={{ flex: 1 }}>
                <Text style={ex.title} numberOfLines={1}>{e.degree || 'Qualification'}</Text>
                {(e.institution || e.year) ? (
                  <Text style={ex.meta} numberOfLines={1}>{[e.institution, e.year].filter(Boolean).join(' · ')}</Text>
                ) : null}
              </View>
              {isOwn && <Text style={ex.chevron}>›</Text>}
            </View>
          );
          return isOwn ? (
            <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => onEdit(e)}>{row}</TouchableOpacity>
          ) : (
            <View key={i}>{row}</View>
          );
        })
      )}
      {isOwn && (
        <TouchableOpacity style={ex.addBtn} onPress={onAdd} activeOpacity={0.8}>
          <Text style={ex.addBtnText}>+ Add qualification</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Experience / Qualification edit modal ──────────────────────────────────
function ExperienceModal({ visible, isEditing, title, company, startYear, endYear, current, onChangeTitle, onChangeCompany, onChangeStartYear, onChangeEndYear, onToggleCurrent, onCancel, onSave, onDelete }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={em.overlay}>
        <View style={em.sheet}>
          <Text style={em.title}>{isEditing ? 'Edit Experience' : 'Add Experience'}</Text>
          <TextInput style={em.input} value={title} onChangeText={onChangeTitle} placeholder="Job title" placeholderTextColor="#8E8E8E" />
          <TextInput style={[em.input, { marginTop: 10 }]} value={company} onChangeText={onChangeCompany} placeholder="Company" placeholderTextColor="#8E8E8E" />
          <View style={em.row}>
            <TextInput
              style={[em.input, em.halfInput]} value={startYear} onChangeText={onChangeStartYear}
              placeholder="Start year" placeholderTextColor="#8E8E8E" keyboardType="number-pad" maxLength={4}
            />
            {!current && (
              <TextInput
                style={[em.input, em.halfInput]} value={endYear} onChangeText={onChangeEndYear}
                placeholder="End year" placeholderTextColor="#8E8E8E" keyboardType="number-pad" maxLength={4}
              />
            )}
          </View>
          <TouchableOpacity style={em.currentRow} onPress={onToggleCurrent} activeOpacity={0.7}>
            <View style={[em.checkbox, current && em.checkboxActive]}>
              {current && <Text style={em.checkboxTick}>✓</Text>}
            </View>
            <Text style={em.currentLabel}>Currently working here</Text>
          </TouchableOpacity>
          <View style={em.btnRow}>
            <TouchableOpacity style={em.cancelBtn} onPress={onCancel}><Text style={em.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={em.saveBtn} onPress={onSave}><Text style={em.saveBtnText}>Save</Text></TouchableOpacity>
          </View>
          {isEditing && (
            <TouchableOpacity style={em.deleteBtn} onPress={onDelete}>
              <Text style={em.deleteBtnText}>Remove this entry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function QualificationModal({ visible, isEditing, degree, institution, year, onChangeDegree, onChangeInstitution, onChangeYear, onCancel, onSave, onDelete }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={em.overlay}>
        <View style={em.sheet}>
          <Text style={em.title}>{isEditing ? 'Edit Qualification' : 'Add Qualification'}</Text>
          <TextInput style={em.input} value={degree} onChangeText={onChangeDegree} placeholder="Degree / Certification" placeholderTextColor="#8E8E8E" />
          <TextInput style={[em.input, { marginTop: 10 }]} value={institution} onChangeText={onChangeInstitution} placeholder="Institution (optional)" placeholderTextColor="#8E8E8E" />
          <TextInput
            style={[em.input, { marginTop: 10 }]} value={year} onChangeText={onChangeYear}
            placeholder="Year (optional)" placeholderTextColor="#8E8E8E" keyboardType="number-pad" maxLength={4}
          />
          <View style={em.btnRow}>
            <TouchableOpacity style={em.cancelBtn} onPress={onCancel}><Text style={em.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={em.saveBtn} onPress={onSave}><Text style={em.saveBtnText}>Save</Text></TouchableOpacity>
          </View>
          {isEditing && (
            <TouchableOpacity style={em.deleteBtn} onPress={onDelete}>
              <Text style={em.deleteBtnText}>Remove this entry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const em = injectFonts({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
  sheet: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  title: { fontSize: 15, fontWeight: '700', color: '#262626', marginBottom: 14 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#262626',
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  halfInput: { flex: 1, marginTop: 0 },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: '#E5E5E5',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#262626', borderColor: '#262626' },
  checkboxTick: { fontSize: 11, color: '#fff', fontWeight: '900' },
  currentLabel: { fontSize: 13, fontWeight: '500', color: '#262626' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#262626' },
  saveBtn: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#262626', alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  deleteBtn: { marginTop: 12, alignItems: 'center' },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: '#B00020' },
});

// ─── Status pill (Available for projects / Not available) ──────────────────
function AvailabilityPill({ available }) {
  return available ? (
    <View style={s.chipAvail}>
      <View style={s.chipDot} />
      <Text style={s.chipAvailText}>Available for projects</Text>
    </View>
  ) : (
    <View style={s.chipBusy}>
      <Text style={s.chipBusyText}>Not available</Text>
    </View>
  );
}

export default function ProfessionalProfileScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;

  const [loading, setLoading] = useState(true);
  const [professional, setProfessional] = useState(null);
  const [verifiedAmt, setVerifiedAmt] = useState(0);
  const [verifiedWork, setVerifiedWork] = useState([]);
  const [realProjects, setRealProjects] = useState([]);
  const [clientReviews, setClientReviews] = useState([]);
  const [myUid, setMyUid] = useState(null);
  const [viewer, setViewer] = useState({ visible: false, photos: [], index: 0 });
  const [projectDetail, setProjectDetail] = useState(null);
  const [allProjectsOpen, setAllProjectsOpen] = useState(false);
  const { headerAnimatedStyle, headerHeight, onHeaderLayout, onScroll } = useAutoHideHeader();
  const insets = useSafeAreaInsets();
  const { toastMessage, toastOpacity, showToast } = useToast();

  const openViewer = (photos, index = 0) => setViewer({ visible: true, photos, index });
  const closeViewer = () => setViewer(v => ({ ...v, visible: false }));

  const [expModal, setExpModal] = useState(false);
  const [expIndex, setExpIndex] = useState(null);
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expStartYear, setExpStartYear] = useState('');
  const [expEndYear, setExpEndYear] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);

  const [qualModal, setQualModal] = useState(false);
  const [qualIndex, setQualIndex] = useState(null);
  const [qualIsFallback, setQualIsFallback] = useState(false);
  const [qualDegree, setQualDegree] = useState('');
  const [qualInstitution, setQualInstitution] = useState('');
  const [qualYear, setQualYear] = useState('');

  const load = useCallback(async () => {
    try {
      // Prefer the live Firebase Auth uid over the cached AsyncStorage copy —
      // the two can drift (e.g. a stale 'uid' left from an earlier session),
      // and comparing viewUid against a stale "me" silently breaks owner
      // detection even when this really is the signed-in user's own profile.
      // Guests have no auth.currentUser, so they fall back to the cache
      // (see utils/session.js's getCurrentUid — the one shared resolver).
      const me = await getCurrentUid();
      const uid = viewUid || me;
      setMyUid(me);

      if (!uid) { setLoading(false); return; }

      if (uid !== me) {
        recordProfileView(uid, me).catch(() => {});
      }

      // Try Firestore first
      let profile = null;
      try { profile = await getProfile(uid); } catch (_) {}

      // Fallback to AsyncStorage for guest/own profile
      if (!profile && uid === me) {
        try {
          const local = await AsyncStorage.getItem('localProfile');
          if (local) profile = JSON.parse(local);
        } catch (_) {}
      }

      setProfessional(profile);

      // Verified totals — only meaningful for real Firebase users (and demo profiles).
      // Demo profiles keep reading their fixture data via the legacy workService
      // calls (already special-cased for demo uids). Real accounts read their
      // own `work_records` — only 'confirmed'/'completed_paid' records count
      // toward verified totals; 'sent_to_client' ones still show in VERIFIED
      // PROJECTS (as ONGOING) but don't count yet.
      if (uid && !uid.startsWith('guest_')) {
        try {
          if (profile?.isDemo) {
            const [amt, works] = await Promise.all([
              getTotalVerifiedAmount(uid),
              getVerifiedWork(uid),
            ]);
            setVerifiedAmt(amt || 0);
            setVerifiedWork(works || []);
            setRealProjects([]);
          } else {
            const records = await getProviderWorkRecords(uid);
            const confirmed = records.filter(r => r.status === WORK_RECORD_STATUS.CONFIRMED || r.status === WORK_RECORD_STATUS.COMPLETED_PAID);
            setVerifiedAmt(confirmed.reduce((sum, r) => sum + (r.contractValue || 0), 0));
            setVerifiedWork(confirmed.map(workRecordToVerifiedWork));
            setRealProjects(records.map(workRecordToProject));
          }
        } catch (_) {}
        try { setClientReviews(await getClientReviews(uid)); } catch (_) {}
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, [viewUid]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCall = () => {
    if (professional?.available === false) {
      Alert.alert('Not taking projects', 'This professional is marked Busy and is not taking calls right now. Send a message instead.');
      return;
    }
    const phone = professional?.phone;
    if (!phone) { Alert.alert('No phone number', 'This professional has not added a phone number yet.'); return; }
    Linking.openURL(`tel:+91${phone}`).catch(() => Alert.alert('Could not open dialler.'));
  };

  const handleMessage = () => {
    if (!viewUid || viewUid === myUid) { Alert.alert('This is your own profile'); return; }
    if (!myUid || myUid.startsWith('guest_')) {
      Alert.alert(
        'Sign in to chat',
        'Create a free account or sign in to start chatting with providers.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login', { initialScreen: 'login' }) },
        ]
      );
      return;
    }
    // ChatScreen creates the chat itself from conversation.uid — no need to
    // pre-create it here (that redundant call was the thing failing silently).
    navigation.navigate('Chat', {
      conversation: {
        uid: viewUid,
        name: professional?.name || 'Professional',
        role: professional?.designation || 'Professional',
        emoji: '🏛️',
        avatarBg: '#F2F2F2',
        online: false,
      },
    });
  };

  const handleEnquiry = () => {
    if (!viewUid || viewUid === myUid) { Alert.alert('This is your own profile'); return; }
    navigation.navigate('Enquiry', {
      providerId: viewUid,
      providerName: professional?.name || 'Professional',
      providerRole: professional?.designation || '',
      providerEmoji: '🏛️',
      services,
      profileType: 'professional',
    });
  };

  const handleOpenLink = () => {
    const url = professional?.website;
    if (!url) return;
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    Linking.openURL(withScheme).catch(() => Alert.alert('Could not open link.'));
  };

  const handleOpenSettings = () => navigation.navigate('Settings');

  const handleEditProfile = () => navigation.navigate('EditProfile', { profileType: 'professional' });

  const handleEditSection = (section) => {
    navigation.navigate('EditProfile', { profileType: 'professional', focusSection: section });
  };

  // ── Own-profile mutations — patch local state immediately, persist to Firestore
  // (or AsyncStorage for guest sessions) in the background. ──────────────────────
  const persistOwnProfileChange = async (patch) => {
    if (!myUid) return;
    const merged = { ...(professional || {}), ...patch };
    setProfessional(merged);
    try {
      if (myUid.startsWith('guest_')) {
        await AsyncStorage.setItem('localProfile', JSON.stringify(merged));
      } else {
        await updateProfile(myUid, patch);
      }
    } catch (_) {
      Alert.alert('Could not save', 'Your change could not be saved. Please try again.');
    }
  };

  const handleToggleAvailability = (nextAvailable) => {
    persistOwnProfileChange({ available: nextAvailable });
    showToast(nextAvailable ? "You're now available" : "You're now marked busy");
  };

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to change your photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      persistOwnProfileChange({ photoUri: result.assets[0].uri });
    }
  };

  const pickPortfolioImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0].uri;
  };

  const handleAddPortfolioPhoto = async () => {
    const photos = professional?.workPhotos || [];
    if (photos.length >= 6) return;
    const uri = await pickPortfolioImage();
    if (uri) persistOwnProfileChange({ workPhotos: [...photos, uri] });
  };

  const handleReplacePortfolioPhoto = async (index) => {
    const uri = await pickPortfolioImage();
    if (!uri) return;
    const photos = [...(professional?.workPhotos || [])];
    photos[index] = uri;
    persistOwnProfileChange({ workPhotos: photos });
  };

  const handleRemovePortfolioPhoto = (index) => {
    Alert.alert('Remove this photo?', 'This will permanently remove it from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const photos = (professional?.workPhotos || []).filter((_, i) => i !== index);
          persistOwnProfileChange({ workPhotos: photos });
        },
      },
    ]);
  };

  // ── EXPERIENCE entries — add / edit / delete ─────────────────────────────
  const openAddExperience = () => {
    setExpIndex(null);
    setExpTitle(''); setExpCompany(''); setExpStartYear(''); setExpEndYear(''); setExpCurrent(false);
    setExpModal(true);
  };

  const openEditExperience = (entry) => {
    const rawIndex = (professional?.experienceHistory || []).indexOf(entry);
    setExpIndex(rawIndex);
    setExpTitle(entry.title || '');
    setExpCompany(entry.company || '');
    setExpStartYear(entry.startYear || '');
    setExpEndYear(entry.endYear || '');
    setExpCurrent(!!entry.current);
    setExpModal(true);
  };

  const saveExperience = () => {
    if (!expTitle.trim()) { setExpModal(false); return; }
    const list = [...(professional?.experienceHistory || [])];
    const entry = {
      title: expTitle.trim(),
      company: expCompany.trim(),
      startYear: expStartYear.trim(),
      endYear: expCurrent ? '' : expEndYear.trim(),
      current: expCurrent,
    };
    if (expIndex === null) list.push(entry); else list[expIndex] = entry;
    persistOwnProfileChange({ experienceHistory: list });
    setExpModal(false);
  };

  const deleteExperience = () => {
    Alert.alert('Remove this entry?', 'This will permanently remove it from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const list = (professional?.experienceHistory || []).filter((_, i) => i !== expIndex);
          persistOwnProfileChange({ experienceHistory: list });
          setExpModal(false);
        },
      },
    ]);
  };

  // ── QUALIFICATION entries — add / edit / delete ──────────────────────────
  const openAddQualification = () => {
    setQualIndex(null); setQualIsFallback(false);
    setQualDegree(''); setQualInstitution(''); setQualYear('');
    setQualModal(true);
  };

  const openEditQualification = (entry) => {
    if (entry.__fallback) {
      setQualIndex(null);
      setQualIsFallback(true);
    } else {
      const rawIndex = (professional?.qualifications || []).indexOf(entry);
      setQualIndex(rawIndex);
      setQualIsFallback(false);
    }
    setQualDegree(entry.degree || '');
    setQualInstitution(entry.institution || '');
    setQualYear(entry.year || '');
    setQualModal(true);
  };

  const saveQualification = () => {
    if (!qualDegree.trim()) { setQualModal(false); return; }
    const list = [...(professional?.qualifications || [])];
    const entry = { degree: qualDegree.trim(), institution: qualInstitution.trim(), year: qualYear.trim() };
    if (qualIndex === null) list.push(entry); else list[qualIndex] = entry;
    const patch = { qualifications: list };
    if (qualIsFallback) patch.degree = ''; // migrate off the old single-value field once captured in the list
    persistOwnProfileChange(patch);
    setQualModal(false);
  };

  const deleteQualification = () => {
    Alert.alert('Remove this entry?', 'This will permanently remove it from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          if (qualIsFallback) {
            persistOwnProfileChange({ qualifications: [], degree: '' });
          } else {
            const list = (professional?.qualifications || []).filter((_, i) => i !== qualIndex);
            persistOwnProfileChange({ qualifications: list });
          }
          setQualModal(false);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#262626" />
      </View>
    );
  }

  // ── Derived display values ────────────────────────────────────────────────
  const isOwn = !viewUid || viewUid === myUid;

  const name        = professional?.name || 'Add your name';
  const designation = professional?.designation || professional?.category || 'Add your skill';
  const experience  = professional?.experience || null;
  const employment  = professional?.selfEmployed || '';
  const degree      = professional?.degree || '';
  const regNumber   = professional?.regNumber || '';

  const area        = professional?.area || '';
  const city        = professional?.city || '';
  const pincode     = professional?.pincode || '';
  const nativePlace = [professional?.nativePlaceCity, professional?.nativePlaceState].filter(Boolean).join(', ');
  const currentLoc  = [area, city].filter(Boolean).join(', ') + (pincode ? ` — ${pincode}` : '');

  const bio         = professional?.bio || '';
  const extraSkills = professional?.extraSkills?.length > 0 ? professional.extraSkills : (professional?.skillTags || []);
  const services    = professional?.services?.length > 0 ? professional.services : extraSkills;
  const tools       = professional?.tools || [];
  const projects    = professional?.isDemo ? (professional?.projects || []) : realProjects;
  const website     = professional?.website || '';
  const joinedText  = formatJoinedDate(professional?.createdAt);
  const available   = professional?.available !== false;
  const isVerified  = !!(professional?.verificationNumber || professional?.verified);

  const experienceHistory = (professional?.experienceHistory || [])
    .filter(e => e && (e.title || e.company))
    .slice()
    .sort((a, b) => {
      const aKey = a.current ? Infinity : (Number(a.endYear) || Number(a.startYear) || 0);
      const bKey = b.current ? Infinity : (Number(b.endYear) || Number(b.startYear) || 0);
      if (bKey !== aKey) return bKey - aKey;
      return (Number(b.startYear) || 0) - (Number(a.startYear) || 0);
    });

  const qualificationRows = [
    { key: 'reg', label: 'Registration Number', value: regNumber },
    { key: 'employment', label: 'Employment', value: employment },
  ].filter(r => !!r.value);

  const qualificationEntries = professional?.qualifications?.length > 0
    ? professional.qualifications
    : (degree ? [{ degree, institution: '', year: '', __fallback: true }] : []);

  const ratedWork = verifiedWork.filter(w => w.rating && w.rating > 0);
  const ratingCount = ratedWork.length;
  const ratingAvg = ratingCount > 0
    ? (ratedWork.reduce((sum, w) => sum + w.rating, 0) / ratingCount).toFixed(1)
    : null;

  const amtStr = formatAmountIndian(verifiedAmt);
  const jobsCount = verifiedWork.length;
  // A provider with zero completed jobs can't have a real on-time % or star
  // rating yet — always show "—"/"New" for those rather than a stray value.
  const onTimeRate = jobsCount > 0 ? (professional?.onTimeRate || '—') : '—';
  const ratingDisplay = jobsCount === 0 ? 'New' : (ratingCount > 0 ? `★ ${ratingAvg}` : '—');

  const reviews = ratedWork
    .slice()
    .sort((a, b) => {
      const at = a.verifiedAt?.toMillis?.() ?? 0;
      const bt = b.verifiedAt?.toMillis?.() ?? 0;
      return bt - at;
    });

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 1. HEADER (auto-hides on scroll) ───────────────────────────────── */}
      <Animated.View style={[s.nav, s.navFloating, { paddingTop: insets.top + 8 }, headerAnimatedStyle]} onLayout={onHeaderLayout}>
        <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
          <Text style={s.navBack}>←</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Professional</Text>
        {isOwn ? (
          <TouchableOpacity style={s.navBtn} onPress={handleOpenSettings} activeOpacity={0.7}>
            <Text style={s.navShare}>⚙️</Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.navBtn, { backgroundColor: 'transparent' }]} />
        )}
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 24 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >

        <View style={s.sheet}>

          {/* ── 2. IDENTITY ──────────────────────────────────────────────── */}
          <View style={s.heroRow}>
            <TouchableOpacity
              style={s.avatar}
              activeOpacity={0.8}
              onPress={() => professional?.photoUri && openViewer([professional.photoUri])}
            >
              {professional?.photoUri ? (
                <Image source={{ uri: professional.photoUri }} style={s.avatarImg} />
              ) : (
                <Text style={s.avatarIcon}>🏛️</Text>
              )}
              {isOwn && (
                <TouchableOpacity style={s.avatarEditBadge} onPress={handleChangeAvatar} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={s.avatarEditIcon}>📷</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            <View style={s.heroInfo}>
              <View style={s.nameRow}>
                <Text style={s.heroName} numberOfLines={2}>{name}</Text>
                {isVerified && (
                  <View style={s.verifiedBadge}>
                    <Text style={s.verifiedText}>✓</Text>
                  </View>
                )}
              </View>
              <View style={s.designationPill}>
                <Text style={s.designationPillText}>{designation.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* ── 3. LOCATION LINES ───────────────────────────────────────── */}
          <Text style={s.heroLoc} numberOfLines={1}>
            {currentLoc ? `📍 ${currentLoc}` : '📍 Add your location'}
          </Text>
          {nativePlace ? (
            <Text style={s.heroNative} numberOfLines={1}>🏠 {nativePlace}</Text>
          ) : null}

          {/* ── 4. STATUS PILL + LINK ───────────────────────────────────── */}
          <View style={s.availRow}>
            {isOwn ? (
              <View style={s.availToggleRow}>
                <Text style={[s.availToggleLabel, !available && s.availToggleLabelMuted]}>
                  {available ? 'Available for projects' : 'Not available'}
                </Text>
                <Switch
                  value={available}
                  onValueChange={handleToggleAvailability}
                  trackColor={{ false: '#E5E5E5', true: GREEN_LIGHT }}
                  thumbColor={available ? GREEN : '#FFFFFF'}
                />
              </View>
            ) : (
              <AvailabilityPill available={available} />
            )}
          </View>
          {website ? (
            <TouchableOpacity onPress={handleOpenLink} activeOpacity={0.7}>
              <Text style={s.linkText} numberOfLines={1}>🔗 {website}</Text>
            </TouchableOpacity>
          ) : null}

          {joinedText ? <Text style={s.joinedText}>{joinedText}</Text> : null}

          <View style={s.divider} />

          {/* ── 5. VERIFIED WORK (immutable, real completed work only) ─── */}
          <View style={s.verHeader}>
            <Text style={s.verLabel}>✓ {isOwn ? 'COMPLETED JOBS' : 'VERIFIED WORK'}</Text>
          </View>
          {isOwn && <Text style={s.verOwnerNote}>Verified from completed jobs — cannot be edited</Text>}
          <View style={s.verStats}>
            <View style={s.verStat}>
              <Text style={s.verStatAmt}>{amtStr}</Text>
              <Text style={s.verStatLbl}>Revenue</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{jobsCount}</Text>
              <Text style={s.verStatLbl}>Projects</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{onTimeRate}</Text>
              <Text style={s.verStatLbl}>On-time</Text>
            </View>
            <View style={s.verStatSep} />
            <View style={s.verStat}>
              <Text style={s.verStatVal}>{ratingDisplay}</Text>
              <Text style={s.verStatLbl}>Rating</Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* ── 6. ACTION BUTTONS ───────────────────────────────────────── */}
          <View style={s.actionRow}>
            {isOwn ? (
              <>
                <TouchableOpacity style={s.editProfileBtn} onPress={handleEditProfile} activeOpacity={0.85}>
                  <Text style={s.editProfileBtnText}>✏️  Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.newWorkRecordBtn}
                  onPress={() => navigation.push('CreateWorkRecord')}
                  activeOpacity={0.85}
                >
                  <Text style={s.newWorkRecordBtnText}>🧾  New Work Record</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[s.actionCallBtn, !available && s.actionCallBtnLocked]}
                  onPress={handleCall}
                  disabled={!available}
                  activeOpacity={0.85}
                >
                  <Text style={[s.actionCallText, !available && s.actionCallTextLocked]} numberOfLines={1}>
                    {available ? '📞 Call' : '🔒 Call'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionMsgBtn} onPress={handleMessage} activeOpacity={0.85}>
                  <Text style={s.actionMsgText} numberOfLines={1}>💬 Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionEnquiryBtn} onPress={handleEnquiry} activeOpacity={0.85}>
                  <Text style={s.actionEnquiryText} numberOfLines={1}>📋 Enquiry</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={s.divider} />

          {/* ── 7. VERIFIED PROJECTS ─────────────────────────────────────── */}
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>
              PROJECTS{jobsCount > 0 ? ` (${jobsCount})` : ''}
            </Text>
            <View style={s.sectionHeadRight}>
              {projects.length > 0 && (
                <TouchableOpacity onPress={() => setAllProjectsOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.viewAllLink}>View all</Text>
                </TouchableOpacity>
              )}
              {isOwn && (
                <TouchableOpacity onPress={() => navigation.navigate('MyWorkRecords')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.viewAllLink}>My Work Records</Text>
                </TouchableOpacity>
              )}
              {isOwn && (
                <TouchableOpacity onPress={() => handleEditSection('projects')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.editPencil}>✏️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <ProjectsList projects={projects} onOpenProject={setProjectDetail} />

          <View style={s.divider} />

          {/* ── 8. GALLERY (uploaded, up to 6) ──────────────────────────── */}
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>GALLERY</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('portfolio')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <PortfolioGrid
            photos={professional?.workPhotos}
            isOwn={isOwn}
            onAdd={handleAddPortfolioPhoto}
            onReplace={handleReplacePortfolioPhoto}
            onRemove={handleRemovePortfolioPhoto}
            onView={(i) => openViewer(professional?.workPhotos || [], i)}
          />

          <View style={s.divider} />

          {/* ── 9. ABOUT ─────────────────────────────────────────────────── */}
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>ABOUT</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('about')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={bio ? s.aboutText : s.placeholder}>
            {bio || 'Add a short bio to attract more clients'}
          </Text>

          <View style={s.divider} />

          {/* ── 10. EXPERIENCE (hidden if none added, unless own profile) ── */}
          {(experienceHistory.length > 0 || isOwn) && (
            <>
              <View style={s.sectionHeadRow}>
                <Text style={[s.sLabel, { marginBottom: 0 }]}>EXPERIENCE</Text>
                {isOwn && (
                  <TouchableOpacity onPress={() => handleEditSection('experience')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={s.editPencil}>✏️</Text>
                  </TouchableOpacity>
                )}
              </View>
              <ExperienceList entries={experienceHistory} isOwn={isOwn} onEdit={openEditExperience} onAdd={openAddExperience} />
              <View style={s.divider} />
            </>
          )}

          {/* ── 11. SERVICES ─────────────────────────────────────────────── */}
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>SERVICES</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('services')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <ChipsList items={services} emptyText="Add services" />

          <View style={s.divider} />

          {/* ── 12. TOOLS ─────────────────────────────────────────────────── */}
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>TOOLS</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('tools')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <ChipsList items={tools} emptyText="Add tools" />

          <View style={s.divider} />

          {/* ── 13. QUALIFICATIONS ───────────────────────────────────────── */}
          <View style={s.sectionHeadRow}>
            <Text style={[s.sLabel, { marginBottom: 0 }]}>QUALIFICATIONS</Text>
            {isOwn && (
              <TouchableOpacity onPress={() => handleEditSection('qualifications')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.editPencil}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          {qualificationRows.length === 0 && qualificationEntries.length === 0 && !isOwn ? (
            <Text style={s.placeholder}>Not added yet</Text>
          ) : (
            <>
              <QualificationRows rows={qualificationRows} />
              <QualificationEntryList
                entries={qualificationEntries}
                isOwn={isOwn}
                onEdit={openEditQualification}
                onAdd={openAddQualification}
              />
            </>
          )}

          <View style={s.divider} />

          {/* ── 14. REVIEWS ──────────────────────────────────────────────── */}
          <Text style={s.sLabel}>REVIEWS</Text>
          {reviews.length === 0 ? (
            <Text style={s.placeholder}>No reviews yet</Text>
          ) : (
            reviews.map((r, i) => (
              <View key={r.id || i} style={[s.reviewRow, i > 0 && s.reviewRowBorder]}>
                <View style={s.reviewTop}>
                  <Text style={s.reviewName} numberOfLines={2}>{r.customerName || 'Customer'}</Text>
                  <Text style={s.reviewDate}>{r.date || ''}</Text>
                </View>
                <View style={s.reviewStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Text key={star} style={[s.reviewStarIcon, star <= r.rating && s.reviewStarActive]}>
                      {star <= r.rating ? '★' : '☆'}
                    </Text>
                  ))}
                </View>
                {r.review ? <Text style={s.reviewComment}>"{r.review}"</Text> : null}
              </View>
            ))
          )}

          <View style={s.divider} />

          {/* ── 15. REVIEWS AS A CLIENT ─────────────────────────────────── */}
          <Text style={s.sLabel}>REVIEWS AS A CLIENT</Text>
          <ClientReviewsSection reviews={clientReviews} />

        </View>

      </ScrollView>

      <ExperienceModal
        visible={expModal}
        isEditing={expIndex !== null}
        title={expTitle}
        company={expCompany}
        startYear={expStartYear}
        endYear={expEndYear}
        current={expCurrent}
        onChangeTitle={setExpTitle}
        onChangeCompany={setExpCompany}
        onChangeStartYear={setExpStartYear}
        onChangeEndYear={setExpEndYear}
        onToggleCurrent={() => setExpCurrent(v => !v)}
        onCancel={() => setExpModal(false)}
        onSave={saveExperience}
        onDelete={deleteExperience}
      />
      <QualificationModal
        visible={qualModal}
        isEditing={qualIndex !== null || qualIsFallback}
        degree={qualDegree}
        institution={qualInstitution}
        year={qualYear}
        onChangeDegree={setQualDegree}
        onChangeInstitution={setQualInstitution}
        onChangeYear={setQualYear}
        onCancel={() => setQualModal(false)}
        onSave={saveQualification}
        onDelete={deleteQualification}
      />

      <PhotoViewer
        visible={viewer.visible}
        photos={viewer.photos}
        initialIndex={viewer.index}
        onClose={closeViewer}
      />

      <AllProjectsModal
        visible={allProjectsOpen}
        projects={projects}
        verifiedCount={jobsCount}
        onClose={() => setAllProjectsOpen(false)}
        onOpenProject={setProjectDetail}
      />

      <ProjectDetailModal
        visible={!!projectDetail}
        project={projectDetail}
        onClose={() => setProjectDetail(null)}
        onViewPhoto={(photos, index) => openViewer(photos, index)}
      />

      {toastMessage ? (
        <Animated.View style={[s.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Text style={s.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const GREEN       = '#22A559';
const DEEP_GREEN   = '#1E874B';
const GREEN_LIGHT  = '#EAF7EF';
const DARK          = '#262626';
const BG            = '#FAF9F5';
const FILL          = '#F2F2F2';
const BORDER        = '#E5E5E5';
const MID            = '#737373';
const LIGHT          = '#8E8E8E';
const FAINT          = '#B5B5B5';
const STAR           = '#FFB830';
const LINK_BLUE      = '#1877F2';

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },

  // ── 1. HEADER
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  navFloating: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: FILL, alignItems: 'center', justifyContent: 'center',
  },
  navBack:  { fontSize: 20, fontWeight: '700', color: DARK },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: DARK },
  navShare: { fontSize: 18, color: DARK },

  // ── SHEET
  sheet: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 16 },

  // ── 2. IDENTITY
  heroRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: FILL, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarIcon: { fontSize: 34 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: DARK, borderWidth: 2, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditIcon: { fontSize: 10 },
  heroInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  heroName: { fontSize: 18, fontWeight: '700', color: DARK, flexShrink: 1, lineHeight: 22 },
  verifiedBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: LINK_BLUE, alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { fontSize: 10, color: '#fff', fontWeight: '900' },
  designationPill: {
    alignSelf: 'flex-start', backgroundColor: DARK, borderRadius: 5,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6,
  },
  designationPillText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.6 },

  // ── 3. LOCATION
  heroLoc:    { fontSize: 12, color: LIGHT },
  heroNative: { fontSize: 12, color: LIGHT, marginTop: 4 },

  // ── 4. STATUS
  availRow: { marginTop: 12 },
  chipAvail: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GREEN_LIGHT, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  chipAvailText: { fontSize: 13, fontWeight: '600', color: GREEN },
  chipBusy: {
    alignSelf: 'flex-start', backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  chipBusyText: { fontSize: 13, fontWeight: '600', color: LIGHT },
  availToggleRow: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  availToggleLabel: { fontSize: 13, fontWeight: '600', color: GREEN },
  availToggleLabelMuted: { color: LIGHT },
  linkText: { fontSize: 13, fontWeight: '600', color: LINK_BLUE, marginTop: 10 },
  joinedText: { fontSize: 11, fontWeight: '400', color: LIGHT, marginTop: 6 },

  // ── 5. VERIFIED WORK
  verHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12,
  },
  verLabel: { fontSize: 11, fontWeight: '600', color: GREEN, letterSpacing: 0.8 },
  verOwnerNote: { fontSize: 10, color: LIGHT, fontWeight: '500', marginBottom: 10 },
  verStats: { flexDirection: 'row', alignItems: 'center' },
  verStat:  { flex: 1, alignItems: 'center' },
  verStatVal: { fontSize: 16, fontWeight: '700', color: DEEP_GREEN, marginBottom: 2 },
  verStatAmt: { fontSize: 16, fontWeight: '700', color: DEEP_GREEN, marginBottom: 2 },
  verStatLbl: { fontSize: 10, fontWeight: '500', color: LIGHT },
  verStatSep: { width: 1, height: 28, backgroundColor: BORDER },

  // ── SECTION LABEL (shared)
  sLabel: {
    fontSize: 11, fontWeight: '600', color: LIGHT,
    letterSpacing: 1, marginBottom: 12,
  },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  viewAllLink: { fontSize: 12, fontWeight: '700', color: GREEN },
  editPencil: { fontSize: 13 },
  placeholder: { fontSize: 13, color: FAINT, fontStyle: 'italic' },

  // ── 6. ACTIONS (inline)
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 16 },
  actionCallBtn: {
    flex: 1.3, height: 46, borderRadius: 12,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  actionCallText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  actionCallBtnLocked: { backgroundColor: FILL },
  actionCallTextLocked: { color: LIGHT },
  actionMsgBtn: {
    flex: 1, height: 46, borderRadius: 12,
    borderWidth: 1.5, borderColor: DARK,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
  },
  actionMsgText: { color: DARK, fontWeight: '600', fontSize: 11 },
  actionEnquiryBtn: {
    flex: 1.2, height: 46, borderRadius: 12,
    borderWidth: 1.5, borderColor: DARK,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
  },
  actionEnquiryText: { color: DARK, fontWeight: '600', fontSize: 11 },
  editProfileBtn: {
    flex: 1, height: 46, borderRadius: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  editProfileBtnText: { color: DARK, fontWeight: '600', fontSize: 15 },
  newWorkRecordBtn: {
    flex: 1, height: 46, borderRadius: 12,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  newWorkRecordBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },

  // ── 7/8. SERVICES / TOOLS chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  plainChip: {
    backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  plainChipText: { fontSize: 12, fontWeight: '500', color: MID },

  // ── 9. ABOUT
  aboutText: { fontSize: 14, color: MID, lineHeight: 22 },

  // ── 13. REVIEWS
  reviewRow: { paddingVertical: 12 },
  reviewRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  reviewName: { fontSize: 13, fontWeight: '700', color: DARK, flex: 1, flexShrink: 1, lineHeight: 16 },
  reviewDate: { fontSize: 11, color: LIGHT, fontWeight: '500', flexShrink: 0, marginLeft: 8 },
  reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 6 },
  reviewStarIcon: { fontSize: 14, color: BORDER },
  reviewStarActive: { color: STAR },
  reviewComment: { fontSize: 13, color: MID, lineHeight: 20, fontStyle: 'italic' },

  // ── TOAST (brief confirmation, e.g. availability toggled)
  toast: {
    position: 'absolute', left: 24, right: 24, bottom: 40,
    backgroundColor: DARK, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
