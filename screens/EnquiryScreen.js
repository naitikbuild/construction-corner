import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUid } from '../utils/session';
import { getProfile } from '../services/userService';
import { submitEnquiry } from '../services/enquiryService';
import {
  SOLO_WORKER_CATEGORIES,
  CONTRACTOR_CATEGORIES,
  PROFESSIONAL_CATEGORIES,
} from '../constants/categories';

const DARK = '#262626';
const GREEN = '#22A559';
const GREEN_LIGHT = '#EAF7EF';
const BG = '#FAF9F5';
const FILL = '#F2F2F2';
const BORDER = '#E5E5E5';
const MID = '#737373';
const LIGHT = '#8E8E8E';
const ALERT = '#B00020';
const ALERT_LIGHT = '#FDEBEC';

const TIMELINE_OPTIONS = ['Urgent', 'This week', 'This month', 'Flexible'];

// "Type of work" always shows every category, grouped by provider type — not
// just the viewed provider's own services — so a client can enquire about
// related work in the same request. Pulled from the central categories file
// so it stays in sync when categories are added later.
const WORK_TYPE_GROUPS = [
  { key: 'workers', label: 'SOLO WORKERS', options: SOLO_WORKER_CATEGORIES },
  { key: 'contractors', label: 'SUB CONTRACTORS', options: CONTRACTOR_CATEGORIES },
  { key: 'professionals', label: 'PROFESSIONALS', options: PROFESSIONAL_CATEGORIES },
];

function Field({ label, required, error, children }) {
  return (
    <View style={s.fieldWrap}>
      {label ? (
        <Text style={s.fieldLabel}>
          {label}{required ? <Text style={s.required}> *</Text> : null}
        </Text>
      ) : null}
      {children}
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

// Searchable, grouped, multi-select dropdown — same fixed-list-only rule as
// EditProfileScreen's Dropdown/MultiSelectDropdown, but organizes options
// into labeled sections (Skilled / Unskilled / Contractors / Professionals).
// A group header is only rendered when that group still has matches for the
// current search query.
function WorkTypeDropdown({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const close = () => { setOpen(false); setQuery(''); };

  const q = query.trim().toLowerCase();
  const visibleGroups = WORK_TYPE_GROUPS
    .map(g => ({ ...g, filtered: q ? g.options.filter(o => o.toLowerCase().includes(q)) : g.options }))
    .filter(g => g.filtered.length > 0);

  const toggle = (item) => {
    onChange(value.includes(item) ? value.filter(v => v !== item) : [...value, item]);
  };

  const remove = (item) => onChange(value.filter(v => v !== item));

  return (
    <View>
      <TouchableOpacity
        style={[s.input, s.dropdownTrigger, error && s.inputError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={value.length ? s.dropdownValueText : s.dropdownPlaceholder} numberOfLines={1}>
          {value.length ? `${value.length} type${value.length === 1 ? '' : 's'} selected` : 'Select type of work'}
        </Text>
        <Text style={s.dropdownArrow}>▾</Text>
      </TouchableOpacity>

      {value.length > 0 && (
        <View style={[s.chipsWrap, { marginTop: 10 }]}>
          {value.map(item => (
            <View key={item} style={s.selectedChip}>
              <Text style={s.selectedChipText} numberOfLines={1}>{item}</Text>
              <TouchableOpacity onPress={() => remove(item)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={s.selectedChipRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <TouchableOpacity style={s.modalOverlay} onPress={close} activeOpacity={1}>
          <TouchableOpacity style={s.modalSheet} activeOpacity={1} onPress={() => {}}>
            <Text style={s.modalTitle}>Type of work</Text>
            <TextInput
              style={s.modalSearchInput}
              placeholder="Search type of work..."
              placeholderTextColor={LIGHT}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <ScrollView style={s.modalList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {visibleGroups.length === 0 ? (
                <Text style={s.modalEmptyText}>No matches — try a different search</Text>
              ) : (
                visibleGroups.map(g => (
                  <View key={g.key}>
                    <Text style={s.modalGroupHeader}>{g.label}</Text>
                    {g.filtered.map(item => {
                      const checked = value.includes(item);
                      return (
                        <TouchableOpacity
                          key={`${g.key}-${item}`}
                          style={s.modalOption}
                          onPress={() => toggle(item)}
                        >
                          <Text style={[s.modalOptionText, checked && s.modalOptionTextActive]}>{item}</Text>
                          {checked && <Text style={s.modalOptionCheck}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={s.modalDoneBtn} onPress={close}>
              <Text style={s.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function EnquiryScreen({ navigation, route }) {
  const {
    providerId,
    providerName = 'Provider',
    providerRole = '',
    providerEmoji = '👤',
    profileType = '',
  } = route?.params || {};

  const [selectedTypes, setSelectedTypes] = useState([]);
  const [area, setArea] = useState('');
  const [sqft, setSqft] = useState('');
  const [timeline, setTimeline] = useState('Flexible');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [prefilling, setPrefilling] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const uid = await getCurrentUid();
        let cachedName = await AsyncStorage.getItem('userName');
        let cachedPhone = await AsyncStorage.getItem('phone');
        if (uid) {
          try {
            const profile = await getProfile(uid);
            if (profile?.name) cachedName = profile.name;
            if (profile?.phone) cachedPhone = profile.phone;
          } catch (_) {}
        }
        if (cachedName) setName(cachedName);
        if (cachedPhone) setPhone(cachedPhone);
      } catch (_) {}
      finally { setPrefilling(false); }
    })();
  }, []);

  const handleTypesChange = (next) => {
    setSelectedTypes(next);
    if (errors.types) setErrors(prev => ({ ...prev, types: '' }));
  };

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = 'Please enter your name';
    if (!phone.trim()) next.phone = 'Please enter your phone number';
    else if (!/^\d{10}$/.test(phone.trim())) next.phone = 'Enter a valid 10-digit phone number';
    if (selectedTypes.length === 0) next.types = 'Select at least one type of work';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!providerId) { Alert.alert('Error', 'This provider could not be reached. Please try again.'); return; }

    setSubmitting(true);
    try {
      const clientId = await getCurrentUid();
      if (!clientId) throw new Error('No session found. Please restart the app.');

      const { chatId } = await submitEnquiry({
        clientId,
        clientName: name.trim(),
        clientPhone: phone.trim(),
        providerId,
        providerName,
        profileType,
        typesOfWork: selectedTypes,
        area: area.trim(),
        sqft: sqft.trim(),
        timeline,
      });

      Alert.alert(
        'Enquiry Sent! ✅',
        `Your enquiry has been sent to ${providerName}. You can follow up in chat.`,
        [{
          text: 'View Chat',
          onPress: () => navigation.replace('Chat', {
            conversation: {
              id: chatId,
              uid: providerId,
              name: providerName,
              role: providerRole,
              emoji: providerEmoji,
              avatarBg: FILL,
              online: false,
            },
          }),
        }]
      );
    } catch (err) {
      Alert.alert('Could Not Send Enquiry', err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Send Enquiry</Text>
        <View style={{ width: 36 }} />
      </View>

      {prefilling ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={DARK} />
        </View>
      ) : (
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.providerCard}>
            <View style={s.providerAvatar}>
              <Text style={{ fontSize: 24 }}>{providerEmoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.providerName} numberOfLines={1}>{providerName}</Text>
              {providerRole ? <Text style={s.providerRole} numberOfLines={1}>{providerRole}</Text> : null}
            </View>
          </View>

          <Field label="Type of work" required error={errors.types}>
            <WorkTypeDropdown value={selectedTypes} onChange={handleTypesChange} error={!!errors.types} />
          </Field>

          <Field label="Work location / area">
            <TextInput
              style={s.input}
              value={area}
              onChangeText={setArea}
              placeholder="e.g. Bopal, Ahmedabad"
              placeholderTextColor={LIGHT}
            />
          </Field>

          <Field label="Total square feet of work">
            <TextInput
              style={s.input}
              value={sqft}
              onChangeText={(v) => setSqft(v.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 1200"
              placeholderTextColor={LIGHT}
              keyboardType="number-pad"
            />
          </Field>

          <Field label="Timeline">
            <View style={s.chipsWrap}>
              {TIMELINE_OPTIONS.map(opt => {
                const active = timeline === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setTimeline(opt)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          <View style={s.divider} />

          <Field label="Your name" required error={errors.name}>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={(v) => { setName(v); if (errors.name) setErrors(prev => ({ ...prev, name: '' })); }}
              placeholder="Enter your name"
              placeholderTextColor={LIGHT}
            />
          </Field>

          <Field label="Your phone" required error={errors.phone}>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={(v) => { setPhone(v.replace(/[^0-9]/g, '')); if (errors.phone) setErrors(prev => ({ ...prev, phone: '' })); }}
              placeholder="10-digit mobile number"
              placeholderTextColor={LIGHT}
              keyboardType="number-pad"
              maxLength={10}
            />
          </Field>

          <TouchableOpacity
            style={[s.submitBtn, submitting && s.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={s.submitBtnText}>Send Enquiry</Text>}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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

  providerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', margin: 14, padding: 14,
    borderRadius: 14, borderWidth: 1, borderColor: BORDER,
  },
  providerAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  providerName: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 2 },
  providerRole: { fontSize: 12, color: MID, fontWeight: '500' },

  fieldWrap: { paddingHorizontal: 14, marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: DARK, marginBottom: 8 },
  required: { color: ALERT },
  errorText: { fontSize: 11, color: ALERT, fontWeight: '500', marginTop: 6 },

  input: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: DARK, backgroundColor: '#FFFFFF',
  },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: GREEN_LIGHT, borderColor: GREEN },
  chipText: { fontSize: 13, fontWeight: '600', color: MID },
  chipTextActive: { color: GREEN },

  // ── Type of work — searchable grouped multi-select dropdown
  inputError: { borderColor: ALERT },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownValueText: { fontSize: 14, color: DARK },
  dropdownPlaceholder: { fontSize: 14, color: LIGHT },
  dropdownArrow: { fontSize: 16, color: LIGHT },

  selectedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: GREEN_LIGHT, borderWidth: 1, borderColor: GREEN,
    maxWidth: '100%',
  },
  selectedChipText: { fontSize: 12, fontWeight: '600', color: GREEN, flexShrink: 1 },
  selectedChipRemove: { fontSize: 11, fontWeight: '900', color: GREEN },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 20 },
  modalSheet: { maxHeight: '78%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 14 },
  modalSearchInput: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: DARK,
    marginBottom: 10,
  },
  modalList: { maxHeight: 380 },
  modalGroupHeader: {
    fontSize: 11, fontWeight: '700', color: LIGHT, letterSpacing: 0.8,
    paddingTop: 14, paddingBottom: 6,
  },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: BORDER,
  },
  modalOptionText: { fontSize: 14, color: DARK },
  modalOptionTextActive: { color: GREEN, fontWeight: '700' },
  modalOptionCheck: { fontSize: 14, color: GREEN, fontWeight: '900' },
  modalEmptyText: { fontSize: 13, color: LIGHT, textAlign: 'center', paddingVertical: 24 },
  modalDoneBtn: {
    marginTop: 14, height: 46, borderRadius: 12,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  modalDoneBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 14, marginBottom: 18 },

  submitBtn: {
    marginHorizontal: 14, height: 52, borderRadius: 14,
    backgroundColor: DARK, alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
