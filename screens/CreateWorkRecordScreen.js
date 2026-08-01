import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StatusBar, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Modal, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { injectFonts } from '../theme/typography';
import PhotoViewer from '../components/PhotoViewer';
import { searchUsers, getProfile } from '../services/userService';
import { createWorkRecord, updateWorkRecord, getWorkRecord, lockWorkRecord, WORK_RECORD_STATUS } from '../services/workRecordService';
import { sendNotification } from '../services/notificationService';
import { createChat, sendWorkRecordMessage } from '../services/chatService';
import { useToast } from '../hooks/useToast';
import { PROJECT_CATEGORIES, WORK_KEYWORDS } from '../constants/categories';

const MAX_KEYWORDS = 10;

const DARK = '#262626';
const GREEN = '#22A559';
const GREEN_LIGHT = '#EAF7EF';
const BG = '#FAF9F5';
const FILL = '#F2F2F2';
const BORDER = '#E5E5E5';
const MID = '#737373';
const LIGHT = '#8E8E8E';
const FAINT = '#B5B5B5';
const ALERT = '#B00020';
const LINK_BLUE = '#1877F2';
const AMBER_BG = '#FFF8E1';
const AMBER_BORDER = '#F5D889';
const AMBER_TEXT = '#8A6A16';

const MAX_PHOTOS = 20;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function roleLabel(u) {
  if (!u) return '';
  const type = (u.profileType || '').toLowerCase();
  if (type === 'personal') return 'Homeowner';
  if (type === 'worker') return u.category || u.workerSkill || u.primarySkill || 'Worker';
  if (type === 'contractor') return u.category || u.contractorType || 'Sub Contractor';
  if (type === 'professional') return u.category || u.designation || 'Professional';
  if (type === 'business' || type === 'supplier') return 'Company';
  return 'User';
}

function roleCityLabel(u) {
  const role = roleLabel(u);
  return u?.city ? `${role} · ${u.city}` : role;
}

function formatDate(d) {
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

// Firestore Timestamp (has .toDate()), ISO string, or Date — normalizes to a JS Date.
function toJsDate(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  return new Date(v);
}

function formatINR(n) {
  const num = Number(n) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

function Field({ label, required, error, hint, children }) {
  return (
    <View style={s.fieldWrap}>
      {label ? (
        <Text style={s.fieldLabel}>
          {label}{required ? <Text style={s.required}> *</Text> : null}
        </Text>
      ) : null}
      {children}
      {hint ? <Text style={s.fieldHint}>{hint}</Text> : null}
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

// ── Client search & select modal — any app user (Personal, Contractor,
// Company, Professional) can be picked as the agreed client.
function ClientPickerModal({ visible, onClose, onSelect, excludeUid }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!visible) { setQuery(''); setResults([]); }
  }, [visible]);

  const runSearch = (text) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = text.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await searchUsers(q);
        setResults(users.filter(u => u.uid !== excludeUid));
      } catch (_) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={s.modalSheet} activeOpacity={1} onPress={() => {}}>
          <Text style={s.modalTitle}>Select client</Text>
          <TextInput
            style={s.modalSearchInput}
            placeholder="Search by name, city or trade..."
            placeholderTextColor={LIGHT}
            value={query}
            onChangeText={runSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <ScrollView style={s.modalList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {searching ? (
              <ActivityIndicator color={DARK} style={{ marginTop: 24 }} />
            ) : query.trim().length < 2 ? (
              <Text style={s.modalEmptyText}>Type at least 2 characters to search</Text>
            ) : results.length === 0 ? (
              <Text style={s.modalEmptyText}>No matching users found</Text>
            ) : (
              results.map(u => (
                <TouchableOpacity
                  key={u.uid}
                  style={s.clientResultRow}
                  onPress={() => { onSelect(u); onClose(); }}
                  activeOpacity={0.7}
                >
                  <View style={s.clientAvatar}>
                    {u.photoUri ? (
                      <Image source={{ uri: u.photoUri }} style={s.clientAvatarImg} />
                    ) : (
                      <Text style={{ fontSize: 18 }}>👤</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.clientResultName} numberOfLines={1}>{u.name || u.companyName || 'Unnamed user'}</Text>
                    <Text style={s.clientResultRole} numberOfLines={1}>{roleCityLabel(u)}</Text>
                  </View>
                  {u.verified ? <Text style={s.verifiedCheck}>✓</Text> : null}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Type of work picker — fixed list only, type to filter, no custom entries.
function KeywordPickerModal({ visible, onClose, onSelect, selected }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const atLimit = selected.length >= MAX_KEYWORDS;
  const q = query.trim().toLowerCase();
  const results = WORK_KEYWORDS.filter(k => !selected.includes(k) && (!q || k.toLowerCase().includes(q)));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={s.modalSheet} activeOpacity={1} onPress={() => {}}>
          <Text style={s.modalTitle}>Add type of work</Text>
          {atLimit ? (
            <Text style={s.keywordLimitText}>Maximum {MAX_KEYWORDS} — remove one below to add another.</Text>
          ) : (
            <TextInput
              style={s.modalSearchInput}
              placeholder="Search type of work, e.g. Waterproofing..."
              placeholderTextColor={LIGHT}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
          )}
          {!atLimit && (
            <ScrollView style={s.modalList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {results.length === 0 ? (
                <Text style={s.modalEmptyText}>No matching results</Text>
              ) : (
                results.map(k => (
                  <TouchableOpacity
                    key={k}
                    style={s.keywordResultRow}
                    onPress={() => { onSelect(k); onClose(); }}
                    activeOpacity={0.7}
                  >
                    <Text style={s.keywordResultText}>{k}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Minimal in-app calendar — avoids adding a native date-picker dependency
// (none exists in this codebase yet) so the screen keeps working in Expo Go.
function CalendarModal({ visible, title, value, onSelect, onClose }) {
  const [viewDate, setViewDate] = useState(value || new Date());

  useEffect(() => {
    if (visible) setViewDate(value || new Date());
  }, [visible]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d) => value && value.getFullYear() === year && value.getMonth() === month && value.getDate() === d;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={s.calendarSheet} activeOpacity={1} onPress={() => {}}>
          <Text style={s.modalTitle}>{title}</Text>
          <View style={s.calendarNav}>
            <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.calendarNavArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={s.calendarMonthLabel}>{MONTH_NAMES[month]} {year}</Text>
            <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.calendarNavArrow}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={s.calendarWeekRow}>
            {WEEKDAYS.map((w, i) => <Text key={i} style={s.calendarWeekday}>{w}</Text>)}
          </View>
          <View style={s.calendarGrid}>
            {cells.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[s.calendarCell, d && isSelected(d) && s.calendarCellActive]}
                disabled={!d}
                onPress={() => { onSelect(new Date(year, month, d)); onClose(); }}
                activeOpacity={0.7}
              >
                {d ? <Text style={[s.calendarCellText, isSelected(d) && s.calendarCellTextActive]}>{d}</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
          {value ? (
            <TouchableOpacity style={s.calendarClearBtn} onPress={() => { onSelect(null); onClose(); }}>
              <Text style={s.calendarClearBtnText}>Clear date</Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Lock confirmation — locking is irreversible, so this is the one gate
// before the record becomes permanently read-only.
function LockConfirmModal({ visible, clientName, labourCharge, onCancel, onConfirm, locking }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={locking ? undefined : onCancel}>
      <TouchableOpacity style={s.modalOverlay} onPress={locking ? undefined : onCancel} activeOpacity={1}>
        <TouchableOpacity style={s.lockSheet} activeOpacity={1} onPress={() => {}}>
          <Text style={s.lockTitle}>Mark work as completed?</Text>
          <Text style={s.lockBody}>
            This permanently locks the record — you won't be able to edit it after. Only do this once the work is finished. {clientName} will then view it and rate your work.
          </Text>
          <View style={s.lockInfoBox}>
            <Text style={s.lockInfoLine}>✓ Record is locked — no further edits</Text>
            <Text style={s.lockInfoLine}>✓ Adds {formatINR(labourCharge)} to your verified work</Text>
          </View>
          <View style={s.lockActionsRow}>
            <TouchableOpacity style={s.lockNotYetBtn} onPress={onCancel} activeOpacity={0.85} disabled={locking}>
              <Text style={s.lockNotYetBtnText}>Not yet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.lockConfirmBtn, locking && s.btnDisabled]} onPress={onConfirm} activeOpacity={0.85} disabled={locking}>
              {locking ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.lockConfirmBtnText}>🔒 Complete & lock</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function CreateWorkRecordScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existingRecordId = route?.params?.recordId ?? null;

  const [providerId, setProviderId] = useState(null);
  const [providerName, setProviderName] = useState('');
  const [recordId, setRecordId] = useState(existingRecordId);
  const [loading, setLoading] = useState(!!existingRecordId);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState('draft');
  const [lockedAt, setLockedAt] = useState(null);
  const [lockedByName, setLockedByName] = useState('');
  const [providerReview, setProviderReview] = useState(null);

  const [client, setClient] = useState(null); // full user object of selected client
  const [projectName, setProjectName] = useState('');
  const [workArea, setWorkArea] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [plannedStart, setPlannedStart] = useState(null);
  const [plannedFinish, setPlannedFinish] = useState(null);
  const [contractValue, setContractValue] = useState('');
  const [labourCharge, setLabourCharge] = useState('');
  const [photos, setPhotos] = useState([]);

  const [errors, setErrors] = useState({});
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [keywordPickerOpen, setKeywordPickerOpen] = useState(false);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [finishPickerOpen, setFinishPickerOpen] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [locking, setLocking] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Once locked (pending confirmation, confirmed, or disputed) a record is
  // permanently read-only for the provider — only 'draft' is editable.
  const isLocked = status !== WORK_RECORD_STATUS.DRAFT;

  const { toastMessage, toastOpacity, showToast } = useToast();

  useEffect(() => {
    (async () => {
      const uid = await AsyncStorage.getItem('uid');
      setProviderId(uid);

      let cachedName = await AsyncStorage.getItem('userName');
      if (uid) {
        try {
          const profile = await getProfile(uid);
          if (profile?.name) cachedName = profile.name;
        } catch (_) {}
      }
      if (cachedName) setProviderName(cachedName);

      if (existingRecordId) {
        try {
          const rec = await getWorkRecord(existingRecordId);
          // This screen is the provider's own editable/locked view. Anyone
          // else who opens it (the client, tapping the record card shared in
          // chat) belongs in the read-only client review flow instead.
          if (rec && rec.providerId !== uid) {
            navigation.replace('WorkRecordReview', { recordId: existingRecordId });
            return;
          }
          if (rec) {
            setClient({
              uid: rec.clientId,
              name: rec.clientName,
              photoUri: rec.clientPhoto,
              _roleLabel: rec.clientRole,
              verified: rec.clientVerified,
            });
            setProjectName(rec.projectName || '');
            setWorkArea(rec.workArea || '');
            setCategory(rec.category || '');
            setLocation(rec.location || '');
            setKeywords(rec.keywords || []);
            setPlannedStart(rec.plannedStart ? new Date(rec.plannedStart) : null);
            setPlannedFinish(rec.plannedFinish ? new Date(rec.plannedFinish) : null);
            setContractValue(rec.contractValue != null ? String(rec.contractValue) : '');
            setLabourCharge(rec.labourCharge != null ? String(rec.labourCharge) : '');
            setPhotos(rec.photos || []);
            setStatus(rec.status || 'draft');
            setLockedAt(toJsDate(rec.lockedAt));
            setLockedByName(rec.lockedByName || '');
            setProviderReview(rec.providerReview || null);
          } else {
            setNotFound(true);
          }
        } catch (_) {
          setNotFound(true);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [existingRecordId]);

  const validate = () => {
    const next = {};
    if (!client) next.client = 'Select the client this work is agreed with';
    if (!projectName.trim()) next.projectName = 'Enter a project name';
    if (!category) next.category = 'Select a project category';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSelectClient = (u) => {
    setClient(u);
    if (errors.client) setErrors(prev => ({ ...prev, client: '' }));
  };

  const handleSelectCategory = (c) => {
    setCategory(c);
    if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
  };

  const handleAddKeyword = (k) => {
    setKeywords(prev => (prev.includes(k) || prev.length >= MAX_KEYWORDS) ? prev : [...prev, k]);
  };

  const handleRemoveKeyword = (k) => {
    setKeywords(prev => prev.filter(x => x !== k));
  };

  const handleAddPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add work photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const buildPayload = () => ({
    clientId: client.uid,
    clientName: client.name || client.companyName || '',
    clientPhoto: client.photoUri || '',
    clientRole: client._roleLabel || roleCityLabel(client),
    clientVerified: !!client.verified,
    projectName: projectName.trim(),
    workArea: workArea.trim(),
    category,
    location: location.trim(),
    keywords,
    plannedStart: plannedStart ? plannedStart.toISOString() : null,
    plannedFinish: plannedFinish ? plannedFinish.toISOString() : null,
    contractValue: contractValue ? Number(contractValue) : null,
    labourCharge: labourCharge ? Number(labourCharge) : null,
    photos,
  });

  const persist = async () => {
    const payload = buildPayload();
    if (recordId) {
      await updateWorkRecord(recordId, payload);
    } else {
      const id = await createWorkRecord(providerId, payload);
      setRecordId(id);
    }
  };

  const handleSaveDetails = async () => {
    if (!validate()) return;
    if (!providerId) { Alert.alert('Error', 'No session found. Please restart the app.'); return; }
    setSaving(true);
    try {
      await persist();
      showToast('Draft saved — find it in My Work Records');
    } catch (err) {
      Alert.alert('Could Not Save', err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = () => {
    if (!validate()) return;
    if (!providerId) { Alert.alert('Error', 'No session found. Please restart the app.'); return; }
    setLockModalOpen(true);
  };

  const handleConfirmLock = async () => {
    setLocking(true);
    try {
      const payload = buildPayload();
      let id = recordId;
      if (!id) {
        id = await createWorkRecord(providerId, payload);
        setRecordId(id);
      }
      const nameForLock = providerName || 'The provider';
      await lockWorkRecord(id, payload, { lockedBy: providerId, lockedByName: nameForLock });
      await sendNotification(
        client.uid,
        'work_locked',
        `${nameForLock} marked work as completed — please review`,
        { recordId: id }
      );
      // Share it into their chat as a tappable card — this is the client's
      // entry point into the read-only review + confirm/rate flow, since
      // there's no notification-tap routing for 'work_locked' yet.
      try {
        const chatId = await createChat(
          { uid: providerId, name: nameForLock },
          { uid: client.uid, name: client.name || client.companyName || 'Client' }
        );
        await sendWorkRecordMessage(chatId, providerId, client.uid, {
          id, projectName, workArea, contractValue: contractValue ? Number(contractValue) : null,
        });
      } catch (_) {}

      setStatus(WORK_RECORD_STATUS.LOCKED_PENDING_CONFIRMATION);
      setLockedAt(new Date());
      setLockedByName(nameForLock);
      setLockModalOpen(false);

      Alert.alert(
        'Work Record Locked ✅',
        `${client.name || client.companyName || 'The client'} has been notified to review it.`,
        [{ text: 'OK', onPress: () => navigation.replace('CreateWorkRecord', { recordId: id }) }]
      );
    } catch (err) {
      Alert.alert('Could Not Lock', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLocking(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Work Record</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={DARK} />
        </View>
      ) : notFound ? (
        <View style={s.center}>
          <Text style={s.emptyStateText}>This work record could not be found.</Text>
        </View>
      ) : (
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {isLocked ? (
            <View style={s.lockedBanner}>
              <Text style={s.lockedBannerText}>
                🔒 Locked by {lockedByName || 'provider'} on {lockedAt ? formatDate(lockedAt) : '—'} — read only
              </Text>
            </View>
          ) : (
            <View style={s.banner}>
              <Text style={s.bannerText}>✏️ Editable anytime — update these details until the work is completed. Locking happens only on completion.</Text>
            </View>
          )}

          {status === WORK_RECORD_STATUS.DISPUTED && (
            <View style={s.disputedBanner}>
              <Text style={s.disputedBannerText}>
                ⚑ {client?.name || client?.companyName || 'The client'} raised an issue with this work record.
              </Text>
            </View>
          )}

          {/* Deliberately shows only whether you've rated this client, never
              the rating/review itself — that only ever appears on the
              client's own profile (see ClientReviewsSection). */}
          {status === WORK_RECORD_STATUS.CONFIRMED && (
            providerReview ? (
              <View style={s.rateClientDoneBanner}>
                <Text style={s.rateClientDoneText}>✓ You've rated {client?.name || client?.companyName || 'this client'}</Text>
              </View>
            ) : (
              <TouchableOpacity style={s.rateClientBtn} onPress={() => navigation.navigate('RateClient', { recordId })} activeOpacity={0.85}>
                <Text style={s.rateClientBtnText}>{client?.name || client?.companyName || 'The client'} confirmed this work — Rate them →</Text>
              </TouchableOpacity>
            )
          )}

          <Field label="Agreed with client" required error={errors.client}>
            {isLocked ? (
              <View style={[s.clientField, s.readOnlyField]}>
                <View style={s.clientAvatar}>
                  {client?.photoUri ? (
                    <Image source={{ uri: client.photoUri }} style={s.clientAvatarImg} />
                  ) : (
                    <Text style={{ fontSize: 18 }}>👤</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.clientResultName} numberOfLines={1}>{client?.name || client?.companyName || 'Unnamed user'}</Text>
                  <Text style={s.clientResultRole} numberOfLines={1}>{client?._roleLabel || roleCityLabel(client)}</Text>
                </View>
                {client?.verified ? <Text style={s.verifiedCheck}>✓</Text> : null}
              </View>
            ) : (
              <TouchableOpacity
                style={[s.clientField, errors.client && s.inputError]}
                onPress={() => setClientPickerOpen(true)}
                activeOpacity={0.8}
              >
                {client ? (
                  <>
                    <View style={s.clientAvatar}>
                      {client.photoUri ? (
                        <Image source={{ uri: client.photoUri }} style={s.clientAvatarImg} />
                      ) : (
                        <Text style={{ fontSize: 18 }}>👤</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.clientResultName} numberOfLines={1}>{client.name || client.companyName || 'Unnamed user'}</Text>
                      <Text style={s.clientResultRole} numberOfLines={1}>{client._roleLabel || roleCityLabel(client)}</Text>
                    </View>
                    {client.verified ? <Text style={s.verifiedCheck}>✓</Text> : null}
                  </>
                ) : (
                  <Text style={s.dropdownPlaceholder}>Search and select client</Text>
                )}
                <Text style={s.dropdownArrow}>▾</Text>
              </TouchableOpacity>
            )}
          </Field>

          <Field label="Project name" required error={errors.projectName}>
            {isLocked ? (
              <View style={s.readOnlyBox}><Text style={s.readOnlyText}>{projectName || '—'}</Text></View>
            ) : (
              <TextInput
                style={s.input}
                value={projectName}
                onChangeText={(v) => { setProjectName(v); if (errors.projectName) setErrors(prev => ({ ...prev, projectName: '' })); }}
                placeholder="e.g. Shah Residence — 2BHK Interior"
                placeholderTextColor={LIGHT}
              />
            )}
          </Field>

          <Field label="Work area">
            {isLocked ? (
              <View style={s.readOnlyBox}><Text style={s.readOnlyText}>{workArea || '—'}</Text></View>
            ) : (
              <TextInput
                style={s.input}
                value={workArea}
                onChangeText={setWorkArea}
                placeholder="e.g. 1,800 sq ft"
                placeholderTextColor={LIGHT}
              />
            )}
          </Field>

          <Field label="Project category" required error={errors.category}>
            {isLocked ? (
              <View style={s.readOnlyBox}><Text style={s.readOnlyText}>{category || '—'}</Text></View>
            ) : (
              <View style={s.categoryRow}>
                {PROJECT_CATEGORIES.map(c => {
                  const active = category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[s.categoryChip, active && s.categoryChipActive]}
                      onPress={() => handleSelectCategory(c)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.categoryChipText, active && s.categoryChipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Field>

          <Field label="Project location">
            {isLocked ? (
              <View style={s.readOnlyBox}><Text style={s.readOnlyText}>{location || '—'}</Text></View>
            ) : (
              <TextInput
                style={s.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Bopal, Ahmedabad"
                placeholderTextColor={LIGHT}
              />
            )}
          </Field>

          <Field
            label="Type of work"
            hint={isLocked ? undefined : 'Optional — extra/specific work done on this project, beyond your primary trade. Up to 10.'}
          >
            <View style={s.keywordChipsWrap}>
              {keywords.map(k => (
                <View key={k} style={s.keywordChip}>
                  <Text style={s.keywordChipText}>{k}</Text>
                  {!isLocked && (
                    <TouchableOpacity onPress={() => handleRemoveKeyword(k)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={s.keywordChipRemove}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {!isLocked && keywords.length < MAX_KEYWORDS && (
                <TouchableOpacity style={s.keywordAddChip} onPress={() => setKeywordPickerOpen(true)} activeOpacity={0.8}>
                  <Text style={s.keywordAddChipText}>+ Add type of work</Text>
                </TouchableOpacity>
              )}
              {keywords.length === 0 && isLocked && (
                <Text style={s.readOnlyText}>—</Text>
              )}
            </View>
          </Field>

          <View style={s.fieldWrap}>
            <View style={s.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Planned start</Text>
                {isLocked ? (
                  <View style={s.readOnlyBox}><Text style={s.readOnlyText}>{plannedStart ? formatDate(plannedStart) : '—'}</Text></View>
                ) : (
                  <TouchableOpacity style={s.dateField} onPress={() => setStartPickerOpen(true)} activeOpacity={0.8}>
                    <Text style={plannedStart ? s.dateFieldValue : s.dropdownPlaceholder}>
                      {plannedStart ? formatDate(plannedStart) : 'Select date'}
                    </Text>
                    <Text style={s.dropdownArrow}>▾</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Planned finish</Text>
                {isLocked ? (
                  <View style={s.readOnlyBox}><Text style={s.readOnlyText}>{plannedFinish ? formatDate(plannedFinish) : '—'}</Text></View>
                ) : (
                  <TouchableOpacity style={s.dateField} onPress={() => setFinishPickerOpen(true)} activeOpacity={0.8}>
                    <Text style={plannedFinish ? s.dateFieldValue : s.dropdownPlaceholder}>
                      {plannedFinish ? formatDate(plannedFinish) : 'Select date'}
                    </Text>
                    <Text style={s.dropdownArrow}>▾</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <Field label="Contract value">
            {isLocked ? (
              <View style={s.readOnlyBox}><Text style={s.readOnlyText}>{contractValue ? formatINR(contractValue) : '—'}</Text></View>
            ) : (
              <View style={s.inputWithHint}>
                <TextInput
                  style={s.inputHintField}
                  value={contractValue}
                  onChangeText={(v) => setContractValue(v.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={LIGHT}
                  keyboardType="number-pad"
                />
                <Text style={s.inputHintText}>total agreed</Text>
              </View>
            )}
          </Field>

          <Field label="Labour charge">
            {isLocked ? (
              <View style={s.readOnlyBox}><Text style={[s.readOnlyText, s.readOnlyGreen]}>{labourCharge ? formatINR(labourCharge) : '—'}</Text></View>
            ) : (
              <View style={s.inputWithHint}>
                <TextInput
                  style={[s.inputHintField, s.labourInput]}
                  value={labourCharge}
                  onChangeText={(v) => setLabourCharge(v.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={LIGHT}
                  keyboardType="number-pad"
                />
                <Text style={s.inputHintText}>after material</Text>
              </View>
            )}
          </Field>

          <View style={s.fieldWrap}>
            <View style={s.sectionHeadRow}>
              <Text style={s.fieldLabel}>Work photos</Text>
              <Text style={s.photoCounter}>{photos.length} / {MAX_PHOTOS} added</Text>
            </View>
            <View style={s.photoGrid}>
              {photos.map((uri, i) => (
                isLocked ? (
                  <TouchableOpacity key={i} style={s.photoSlot} onPress={() => { setViewerIndex(i); setViewerOpen(true); }} activeOpacity={0.85}>
                    <Image source={{ uri }} style={s.photoThumb} />
                  </TouchableOpacity>
                ) : (
                  <View key={i} style={s.photoSlot}>
                    <Image source={{ uri }} style={s.photoThumb} />
                    <TouchableOpacity style={s.photoXBtn} onPress={() => handleRemovePhoto(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={s.photoXBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )
              ))}
              {!isLocked && photos.length < MAX_PHOTOS && (
                <TouchableOpacity style={s.photoAddBtn} onPress={handleAddPhoto} activeOpacity={0.8}>
                  <Text style={s.photoAddIcon}>📷</Text>
                  <Text style={s.photoAddText}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>
            {!isLocked && (
              <Text style={s.fieldHint}>Add up to 20 photos showing the work — progress and finished result.</Text>
            )}
          </View>

          <View style={{ height: 12 }} />
        </ScrollView>
      )}

      {!isLocked && recordId && (
        <TouchableOpacity
          style={s.viewRecordsLink}
          onPress={() => navigation.navigate('MyWorkRecords')}
          activeOpacity={0.7}
        >
          <Text style={s.viewRecordsLinkText}>🧾 Saved as draft — View My Work Records →</Text>
        </TouchableOpacity>
      )}

      {!isLocked && (
        <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            style={[s.saveBtn, saving && s.btnDisabled]}
            onPress={handleSaveDetails}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Text style={s.saveBtnText}>Save details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.completeBtn, saving && s.btnDisabled]}
            onPress={handleMarkCompleted}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.completeBtnText}>Mark completed →</Text>}
          </TouchableOpacity>
        </View>
      )}

      <ClientPickerModal
        visible={clientPickerOpen}
        onClose={() => setClientPickerOpen(false)}
        onSelect={handleSelectClient}
        excludeUid={providerId}
      />
      <KeywordPickerModal
        visible={keywordPickerOpen}
        onClose={() => setKeywordPickerOpen(false)}
        onSelect={handleAddKeyword}
        selected={keywords}
      />
      <CalendarModal
        visible={startPickerOpen}
        title="Planned start"
        value={plannedStart}
        onSelect={setPlannedStart}
        onClose={() => setStartPickerOpen(false)}
      />
      <CalendarModal
        visible={finishPickerOpen}
        title="Planned finish"
        value={plannedFinish}
        onSelect={setPlannedFinish}
        onClose={() => setFinishPickerOpen(false)}
      />
      <LockConfirmModal
        visible={lockModalOpen}
        clientName={client?.name || client?.companyName || 'The client'}
        labourCharge={labourCharge}
        onCancel={() => setLockModalOpen(false)}
        onConfirm={handleConfirmLock}
        locking={locking}
      />
      <PhotoViewer
        visible={viewerOpen}
        photos={photos}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />

      {toastMessage ? (
        <Animated.View style={[s.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Text style={s.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyStateText: { fontSize: 14, color: LIGHT, fontWeight: '600', textAlign: 'center' },

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

  scroll: { flex: 1 },

  banner: {
    flexDirection: 'row', margin: 14, marginBottom: 6, padding: 12,
    borderRadius: 12, backgroundColor: AMBER_BG, borderWidth: 1, borderColor: AMBER_BORDER,
  },
  bannerText: { fontSize: 12, color: AMBER_TEXT, fontWeight: '500', lineHeight: 18, flex: 1 },

  lockedBanner: {
    flexDirection: 'row', margin: 14, marginBottom: 6, padding: 12,
    borderRadius: 12, backgroundColor: FILL, borderWidth: 1, borderColor: BORDER,
  },
  lockedBannerText: { fontSize: 12, color: MID, fontWeight: '600', lineHeight: 18, flex: 1 },

  rateClientBtn: {
    margin: 14, marginBottom: 6, padding: 14, borderRadius: 12,
    backgroundColor: DARK, alignItems: 'center',
  },
  rateClientBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  rateClientDoneBanner: {
    margin: 14, marginBottom: 6, padding: 12, borderRadius: 12,
    backgroundColor: GREEN_LIGHT, borderWidth: 1, borderColor: '#B7E4C7',
  },
  rateClientDoneText: { fontSize: 12, color: GREEN, fontWeight: '700', lineHeight: 18 },

  disputedBanner: {
    margin: 14, marginBottom: 6, padding: 12, borderRadius: 12,
    backgroundColor: '#FDEAEA', borderWidth: 1, borderColor: '#F3B9B9',
  },
  disputedBannerText: { fontSize: 12, color: ALERT, fontWeight: '700', lineHeight: 18 },

  fieldWrap: { paddingHorizontal: 14, marginTop: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: DARK, marginBottom: 8 },
  fieldHint: { fontSize: 11, color: LIGHT, fontWeight: '500', marginTop: 8, lineHeight: 16 },
  required: { color: ALERT },
  errorText: { fontSize: 11, color: ALERT, fontWeight: '500', marginTop: 6 },

  input: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: DARK, backgroundColor: '#FFFFFF',
  },
  inputError: { borderColor: ALERT },

  readOnlyBox: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: FILL,
  },
  readOnlyText: { fontSize: 14, color: DARK, fontWeight: '500' },
  readOnlyGreen: { color: GREEN, fontWeight: '700' },
  readOnlyField: { backgroundColor: FILL },

  inputWithHint: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, backgroundColor: '#FFFFFF',
  },
  inputHintField: {
    flex: 1, paddingVertical: 12, fontSize: 14, color: DARK,
  },
  labourInput: { color: GREEN, fontWeight: '700' },
  inputHintText: { fontSize: 11, color: LIGHT, fontWeight: '500', marginLeft: 8 },

  dropdownPlaceholder: { fontSize: 14, color: LIGHT, flex: 1 },
  dropdownArrow: { fontSize: 16, color: LIGHT },

  // ── Project category chips
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#FFFFFF',
  },
  categoryChipActive: { backgroundColor: DARK, borderColor: DARK },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: DARK },
  categoryChipTextActive: { color: '#FFFFFF' },

  // ── Type of work chips
  keywordChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GREEN_LIGHT, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  keywordChipText: { fontSize: 12, fontWeight: '600', color: GREEN },
  keywordChipRemove: { fontSize: 11, fontWeight: '900', color: GREEN },
  keywordAddChip: {
    borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: FILL,
  },
  keywordAddChipText: { fontSize: 12, fontWeight: '700', color: MID },
  keywordLimitText: { fontSize: 12, color: LIGHT, fontWeight: '500', marginBottom: 10, lineHeight: 18 },
  keywordResultRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: BORDER },
  keywordResultText: { fontSize: 14, fontWeight: '600', color: DARK },

  // ── Client field / picker
  clientField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF',
  },
  clientAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  clientAvatarImg: { width: 38, height: 38, borderRadius: 19 },
  clientResultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: BORDER,
  },
  clientResultName: { fontSize: 14, fontWeight: '700', color: DARK },
  clientResultRole: { fontSize: 12, color: MID, fontWeight: '500', marginTop: 1 },
  verifiedCheck: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: LINK_BLUE,
    color: '#FFFFFF', fontSize: 11, fontWeight: '900',
    textAlign: 'center', lineHeight: 18, overflow: 'hidden',
  },

  // ── Modals (search sheet)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 20 },
  modalSheet: { maxHeight: '78%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 14 },
  modalSearchInput: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: DARK,
    marginBottom: 4,
  },
  modalList: { maxHeight: 380 },
  modalEmptyText: { fontSize: 13, color: LIGHT, textAlign: 'center', paddingVertical: 24 },

  // ── Calendar
  calendarSheet: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  calendarNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  calendarNavArrow: { fontSize: 22, fontWeight: '700', color: DARK, paddingHorizontal: 12 },
  calendarMonthLabel: { fontSize: 14, fontWeight: '700', color: DARK },
  calendarWeekRow: { flexDirection: 'row' },
  calendarWeekday: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '700', color: LIGHT, marginBottom: 4 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calendarCellActive: { backgroundColor: GREEN, borderRadius: 999 },
  calendarCellText: { fontSize: 13, color: DARK, fontWeight: '500' },
  calendarCellTextActive: { color: '#FFFFFF', fontWeight: '700' },
  calendarClearBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
  calendarClearBtnText: { fontSize: 13, color: ALERT, fontWeight: '600' },

  // ── Date row
  dateRow: { flexDirection: 'row', gap: 10 },
  dateField: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFFFF',
  },
  dateFieldValue: { fontSize: 14, color: DARK, fontWeight: '500' },

  // ── Photo grid
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  photoCounter: { fontSize: 12, color: LIGHT, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoSlot: { width: 92, height: 92, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoThumb: { width: '100%', height: '100%' },
  photoXBtn: {
    position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  photoXBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  photoAddBtn: {
    width: 92, height: 92, borderRadius: 10,
    borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  photoAddIcon: { fontSize: 20, marginBottom: 4 },
  photoAddText: { fontSize: 12, fontWeight: '700', color: MID },

  // ── Bottom actions
  viewRecordsLink: {
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
    backgroundColor: GREEN_LIGHT, borderTopWidth: 1, borderTopColor: BORDER,
  },
  viewRecordsLinkText: { fontSize: 12, fontWeight: '700', color: GREEN },
  bottomBar: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 12,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: BORDER,
  },
  saveBtn: {
    flex: 1, height: 50, borderRadius: 14,
    borderWidth: 1.5, borderColor: DARK, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: DARK },
  completeBtn: {
    flex: 1.3, height: 50, borderRadius: 14,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  completeBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  btnDisabled: { opacity: 0.6 },

  // ── Lock confirmation
  lockSheet: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  lockTitle: { fontSize: 16, fontWeight: '700', color: DARK, marginBottom: 10 },
  lockBody: { fontSize: 13, color: MID, fontWeight: '500', lineHeight: 20, marginBottom: 16 },
  lockInfoBox: {
    backgroundColor: FILL, borderRadius: 12, padding: 14, marginBottom: 18, gap: 8,
  },
  lockInfoLine: { fontSize: 13, color: DARK, fontWeight: '600' },
  lockActionsRow: { flexDirection: 'row', gap: 10 },
  lockNotYetBtn: {
    flex: 1, height: 48, borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  lockNotYetBtnText: { fontSize: 14, fontWeight: '700', color: DARK },
  lockConfirmBtn: {
    flex: 1.3, height: 48, borderRadius: 12,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  lockConfirmBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // ── Toast
  toast: {
    position: 'absolute', left: 24, right: 24, bottom: 90,
    backgroundColor: DARK, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center',
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
