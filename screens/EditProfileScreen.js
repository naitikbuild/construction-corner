import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Switch, Modal, FlatList, Animated, Alert,
  Image, Dimensions, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import { useState, useEffect, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { saveProfile, getProfile } from '../services/userService';
import { auth } from '../config/firebase';
import {
  SOLO_WORKER_CATEGORIES,
  CONTRACTOR_CATEGORIES,
  PROFESSIONAL_CATEGORIES as PROFESSIONAL_SKILLS,
} from '../constants/categories';

const BLUE = '#262626';
const LIGHT_BLUE = '#F2F2F2';
const GREY_BG = '#FAF9F5';
const BORDER = '#E5E5E5';
const TEXT_DARK = '#262626';
const TEXT_MID = '#737373';
const TEXT_LIGHT = '#8E8E8E';

// ─── Data ──────────────────────────────────────────────────────────────────

const LANGUAGES = ['Hindi', 'Gujarati', 'English', 'Marathi', 'Tamil', 'Telugu'];

const CONTRACTOR_OTHER_SKILLS = [
  'Mason Work', 'Electrical Wiring', 'Plumbing', 'Painting', 'Waterproofing', 'Tiling',
  'Carpentry', 'Welding', 'False Ceiling', 'POP Work', 'Glass & Aluminium', 'Demolition',
];


const COMPANY_TYPES = [
  'Sole Proprietorship', 'Partnership', 'Private Limited', 'Public Limited',
  'LLP', 'Joint Venture',
];

const MATERIALS = [
  'Cement', 'Steel / TMT Bars', 'Bricks & Blocks', 'Sand & Aggregate',
  'Tiles & Flooring', 'Plumbing Materials', 'Electrical Materials',
  'Paint & Waterproofing', 'Glass & Aluminium', 'Hardware & Fasteners',
  'Modular Kitchen', 'Ready Mix Concrete (RMC)',
];

const ROLES = [
  { key: 'Professional', icon: '🏛️',   label: 'Professional', sub: 'Architect, Engineer, Designer' },
  { key: 'Worker',       icon: '👷',   label: 'Worker',       sub: 'Mason, Electrician, Plumber' },
  { key: 'Contractor',   icon: '👷‍♂️', label: 'Sub Contractor',   sub: 'Individual contractor with a crew' },
  { key: 'Business',     icon: '🏢',   label: 'Business',     sub: 'Contractor, Developer, Builder' },
  { key: 'Supplier',     icon: '🏭',   label: 'Supplier',     sub: 'Cement, Steel, Tiles, RMC' },
];

const SUPPLIER_CATEGORIES = [
  'Cement', 'Steel / TMT Bars', 'Bricks & Blocks', 'Sand & Aggregate',
  'Tiles & Flooring', 'Plumbing Materials', 'Electrical Materials',
  'Paint & Waterproofing', 'Glass & Aluminium', 'Hardware & Fasteners',
  'Equipment / Machinery', 'Ready Mix Concrete (RMC)',
];

const PAYMENT_TERMS_LIST = [
  'Cash on Delivery', 'Advance Payment', 'Net 7 Days', 'Net 15 Days', 'Net 30 Days', 'Credit 60 Days',
];

const BUSINESS_SERVICES = [
  'Residential Construction', 'Commercial Construction', 'Industrial Construction',
  'Renovation & Interiors', 'Civil Works', 'Electrical & Plumbing',
  'Waterproofing', 'Painting', 'Flooring', 'Glass & Aluminum', 'HVAC',
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function Label({ children, required }) {
  return (
    <Text style={styles.label}>
      {children}{required && <Text style={{ color: '#E53E3E' }}> *</Text>}
    </Text>
  );
}

function Field({ label, required, children }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Label required={required}>{label}</Label> : null}
      {children}
    </View>
  );
}

function Input({ style, ...props }) {
  return <TextInput style={[styles.input, style]} placeholderTextColor={TEXT_LIGHT} {...props} />;
}

function Checkbox({ label, checked, onPress }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
        {checked && <Text style={styles.checkMark}>✓</Text>}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function Dropdown({ label, required, value, options, onSelect, searchable, disabled, disabledHint }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const close = () => { setOpen(false); setQuery(''); };

  // Search only filters which of the fixed options are shown — it can never add a new one.
  const filtered = searchable && query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <Field label={label} required={required}>
      <TouchableOpacity
        style={[styles.input, styles.dropdownTrigger, disabled && styles.dropdownTriggerDisabled]}
        onPress={() => { if (!disabled) setOpen(true); }}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <Text style={value ? { color: TEXT_DARK, fontSize: 15 } : { color: TEXT_LIGHT, fontSize: 15 }}>
          {value || (disabled && disabledHint ? disabledHint : `Select ${label}`)}
        </Text>
        <Text style={styles.dropdownArrow}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open && !disabled} transparent animationType="fade" onRequestClose={close}>
        <TouchableOpacity style={styles.modalOverlay} onPress={close} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            {searchable && (
              <TextInput
                style={styles.modalSearchInput}
                placeholder={`Search ${label.toLowerCase()}...`}
                placeholderTextColor={TEXT_LIGHT}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
            )}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.modalEmptyText}>No matches — try a different search</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, item === value && styles.modalOptionActive]}
                  onPress={() => { onSelect(item); close(); }}
                >
                  <Text style={[styles.modalOptionText, item === value && { color: BLUE, fontWeight: '700' }]}>
                    {item}
                  </Text>
                  {item === value && <Text style={{ color: BLUE }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </Field>
  );
}

// Searchable multi-select — same fixed-list-only rule as Dropdown, but toggles
// multiple values and shows them as hashtag chips underneath.
function MultiSelectDropdown({ label, values, options, onToggle, hint }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const close = () => { setOpen(false); setQuery(''); };

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <Field label={label}>
      <TouchableOpacity
        style={[styles.input, styles.dropdownTrigger]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text
          style={values.length ? { color: TEXT_DARK, fontSize: 15, flex: 1 } : { color: TEXT_LIGHT, fontSize: 15, flex: 1 }}
          numberOfLines={1}
        >
          {values.length ? values.join(', ') : `Select ${label}`}
        </Text>
        <Text style={styles.dropdownArrow}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <TouchableOpacity style={styles.modalOverlay} onPress={close} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TextInput
              style={styles.modalSearchInput}
              placeholder={`Search ${label.toLowerCase()}...`}
              placeholderTextColor={TEXT_LIGHT}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.modalEmptyText}>No matches — try a different search</Text>
              }
              renderItem={({ item }) => {
                const checked = values.includes(item);
                return (
                  <TouchableOpacity
                    style={[styles.modalOption, checked && styles.modalOptionActive]}
                    onPress={() => onToggle(item)}
                  >
                    <Text style={[styles.modalOptionText, checked && { color: BLUE, fontWeight: '700' }]}>
                      {item}
                    </Text>
                    {checked && <Text style={{ color: BLUE }}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.modalDoneBtn} onPress={close}>
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {hint ? <Text style={styles.skillHint}>{hint}</Text> : null}
      {values.length > 0 && (
        <View style={[styles.tagsWrap, { marginTop: 10 }]}>
          {values.map(v => (
            <View key={v} style={styles.hashChipEdit}>
              <Text style={styles.hashChipEditText}>#{v.toLowerCase().replace(/\s+/g, '')}</Text>
            </View>
          ))}
        </View>
      )}
    </Field>
  );
}

function SkillTag({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.skillTag, selected && styles.skillTagActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.skillTagText, selected && styles.skillTagTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PhotoCircle({ label, emoji = '👤', photoUri, onPick }) {
  return (
    <TouchableOpacity
      style={styles.photoCircleWrap}
      onPress={onPick}
      activeOpacity={onPick ? 0.8 : 1}
      disabled={!onPick}
    >
      <View style={styles.photoCircle}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoCircleImg} />
        ) : (
          <Text style={styles.photoEmoji}>{emoji}</Text>
        )}
        <View style={styles.cameraIcon}>
          <Text style={styles.cameraEmoji}>📷</Text>
        </View>
      </View>
      <Text style={styles.photoCircleLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function CoverPhoto() {
  return (
    <View style={styles.coverPhotoWrap}>
      <View style={styles.coverPhoto}>
        <Text style={styles.coverPhotoIcon}>🖼️</Text>
        <Text style={styles.coverPhotoLabel}>Add Cover Photo</Text>
      </View>
    </View>
  );
}

// ─── Current Location (GPS auto-detect, confirmable) ────────────────────────

function CurrentLocationField({ data, setData }) {
  const [detecting, setDetecting] = useState(false);

  const detectLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location permission denied',
          'You can still enter your city, state and pincode manually below.'
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const results = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const place = results?.[0];
      if (place) {
        setData({
          ...data,
          city: place.city || place.subregion || place.district || data.city,
          state: place.region || data.state,
          pincode: place.postalCode || data.pincode,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      } else {
        Alert.alert('Could not detect location', 'Please enter your city, state and pincode manually below.');
      }
    } catch (_) {
      Alert.alert('Location detection failed', 'Please enter your city, state and pincode manually below.');
    } finally {
      setDetecting(false);
    }
  };

  const hasLocation = !!(data.city || data.state);

  return (
    <Field label="Current Location" required>
      <TouchableOpacity
        style={styles.detectBtn}
        onPress={detectLocation}
        disabled={detecting}
        activeOpacity={0.8}
      >
        {detecting ? (
          <ActivityIndicator color={BLUE} size="small" />
        ) : (
          <Text style={styles.detectBtnText}>
            {hasLocation ? '🔄  Re-detect my location' : '📍  Detect my location'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={[styles.locationRow, { marginTop: 12 }]}>
        <Input
          style={{ flex: 1 }}
          value={data.city}
          onChangeText={(v) => setData({ ...data, city: v, lat: null, lng: null })}
          placeholder="City"
        />
        <Input
          style={{ flex: 1 }}
          value={data.state}
          onChangeText={(v) => setData({ ...data, state: v, lat: null, lng: null })}
          placeholder="State"
        />
      </View>
      <Text style={styles.skillHint}>
        Auto-detected from your device — you can edit if it's not quite right
      </Text>
      {!(data.city.trim() && data.state.trim()) && (
        <Text style={styles.locationRequiredHint}>
          Please add your city and state to continue — if detection didn't work, enter them manually above.
        </Text>
      )}
    </Field>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ step, total, labels }) {
  const steps = labels || ['Basic Info', 'Role', 'Details', 'Review'];
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        {[...Array(total)].map((_, i) => (
          <View key={i} style={[styles.progressSegment, i < step && styles.progressSegmentActive]} />
        ))}
      </View>
      <View style={styles.progressLabels}>
        {steps.map((s, i) => (
          <Text
            key={i}
            style={[styles.progressLabel, i + 1 === step && styles.progressLabelActive]}
          >
            {s}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Step 1: Basic Info ──────────────────────────────────────────────────────

function Step1({ data, setData, profileType }) {
  const isCompany = profileType === 'business' || profileType === 'supplier';
  // Contractor, Solo Worker and Professional skip the manual area/city/state fields and
  // cover photo / languages, using GPS auto-detect for current location instead.
  const usesGpsLocation = profileType === 'contractor' || profileType === 'worker' || profileType === 'professional';

  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setData({ ...data, photoUri: result.assets[0].uri });
    }
  };

  const toggleLanguage = (lang) => {
    const current = data.languages || [];
    if (current.includes(lang)) {
      setData({ ...data, languages: current.filter((l) => l !== lang) });
    } else {
      setData({ ...data, languages: [...current, lang] });
    }
  };

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSub}>
        {isCompany ? 'Tell the community about your business' : 'Let the community know who you are'}
      </Text>

      {/* Photo */}
      {!isCompany && !usesGpsLocation && <CoverPhoto />}
      <View style={styles.photoRow}>
        <PhotoCircle
          label={isCompany ? 'Company Logo' : 'Profile Photo'}
          emoji={isCompany ? '🏢' : '👤'}
          photoUri={data.photoUri}
          onPick={pickProfilePhoto}
        />
      </View>

      {/* Name */}
      <Field label={isCompany ? 'Company Name' : 'Full Name'} required>
        <Input
          value={isCompany ? data.companyName : data.name}
          onChangeText={(v) => setData(isCompany ? { ...data, companyName: v } : { ...data, name: v })}
          placeholder={isCompany ? 'e.g. Rathod Constructions Pvt. Ltd.' : 'e.g. Rahul Sharma'}
        />
      </Field>

      {/* Phone */}
      <Field label="Mobile Number">
        <View style={styles.phonePreview}>
          <Text style={styles.phoneFlag}>🇮🇳 +91</Text>
          <Text style={styles.phoneValue}>{data.phone || '9876543210'}</Text>
          <Text style={styles.phoneLocked}>🔒 Verified</Text>
        </View>
      </Field>

      {/* Area / City / State — manual entry (not for Contractor / Solo Worker, which auto-detect below) */}
      {!usesGpsLocation && (
        <>
          <Field label="Area / Locality">
            <Input
              value={data.area}
              onChangeText={(v) => setData({ ...data, area: v })}
              placeholder="e.g. Bopal, Navrangpura"
            />
          </Field>

          <Field label="City & State" required>
            <View style={styles.locationRow}>
              <Input
                style={{ flex: 1 }}
                value={data.city}
                onChangeText={(v) => setData({ ...data, city: v })}
                placeholder="City"
              />
              <Input
                style={{ flex: 1 }}
                value={data.state}
                onChangeText={(v) => setData({ ...data, state: v })}
                placeholder="State"
              />
            </View>
          </Field>
        </>
      )}

      {/* Current Location — Contractor / Solo Worker, GPS auto-detect */}
      {usesGpsLocation && (
        <CurrentLocationField data={data} setData={setData} />
      )}

      {/* Pincode */}
      <Field label="Pincode">
        <Input
          value={data.pincode}
          onChangeText={(v) => setData({ ...data, pincode: v })}
          placeholder="6-digit pincode"
          keyboardType="number-pad"
          maxLength={6}
        />
      </Field>

      {/* Languages — only for personal profiles (not Contractor / Solo Worker) */}
      {!isCompany && !usesGpsLocation && (
        <Field label="Languages Spoken">
          <View style={styles.checkGrid}>
            {LANGUAGES.map((lang) => (
              <Checkbox
                key={lang}
                label={lang}
                checked={(data.languages || []).includes(lang)}
                onPress={() => toggleLanguage(lang)}
              />
            ))}
          </View>
        </Field>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Step 2: Role Selection ──────────────────────────────────────────────────

function Step2({ data, setData }) {
  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>I am a...</Text>
      <Text style={styles.stepSub}>Choose your primary role on Construction Corner</Text>

      <View style={styles.rolesGrid}>
        {ROLES.map((role) => {
          const selected = data.role === role.key;
          return (
            <TouchableOpacity
              key={role.key}
              style={[styles.roleCard, selected && styles.roleCardActive]}
              onPress={() => setData({ ...data, role: role.key })}
              activeOpacity={0.8}
            >
              <Text style={styles.roleIcon}>{role.icon}</Text>
              <Text style={[styles.roleLabel, selected && styles.roleLabelActive]}>{role.label}</Text>
              <Text style={styles.roleSub}>{role.sub}</Text>
              {selected && (
                <View style={styles.roleCheck}>
                  <Text style={styles.roleCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Step 3: Professional Details ───────────────────────────────────────────

function Step3Professional({ data, setData }) {
  const slotSize = Math.floor((Dimensions.get('window').width - 48) / 3);

  const toggleExtraSkill = (skill) => {
    const current = data.extraSkills || [];
    setData({
      ...data,
      extraSkills: current.includes(skill)
        ? current.filter(s => s !== skill)
        : [...current, skill],
    });
  };

  const pickPortfolioPhoto = async () => {
    const photos = data.workPhotos || [];
    if (photos.length >= 6) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add portfolio photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setData({ ...data, workPhotos: [...photos, result.assets[0].uri] });
    }
  };

  const removePortfolioPhoto = (index) => {
    const next = (data.workPhotos || []).filter((_, i) => i !== index);
    setData({ ...data, workPhotos: next });
  };

  const updateExperience = (index, field, value) => {
    const next = [...(data.experienceHistory || [])];
    next[index] = { ...next[index], [field]: value };
    if (field === 'current' && value) next[index].endYear = '';
    setData({ ...data, experienceHistory: next });
  };

  const addExperience = () => {
    setData({
      ...data,
      experienceHistory: [
        ...(data.experienceHistory || []),
        { title: '', company: '', startYear: '', endYear: '', current: false },
      ],
    });
  };

  const removeExperience = (index) => {
    setData({ ...data, experienceHistory: (data.experienceHistory || []).filter((_, i) => i !== index) });
  };

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Professional Details</Text>
      <Text style={styles.stepSub}>Showcase your expertise to get more clients</Text>

      <Dropdown
        label="Primary Skill"
        required
        value={data.designation}
        options={PROFESSIONAL_SKILLS}
        onSelect={(v) => setData({ ...data, designation: v })}
        searchable
      />

      <Field label="Company / Employment">
        <View style={styles.pillRow}>
          {['Self Employed', 'Working at Company'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.pill, data.selfEmployed === opt && styles.pillActive]}
              onPress={() => setData({ ...data, selfEmployed: opt })}
            >
              <Text style={[styles.pillText, data.selfEmployed === opt && styles.pillTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Experience (optional)">
        {(data.experienceHistory || []).map((entry, index) => (
          <View key={index} style={styles.expCard}>
            <View style={styles.expCardTop}>
              <Text style={styles.expCardTitle}>Role {index + 1}</Text>
              <TouchableOpacity style={styles.expRemoveBtn} onPress={() => removeExperience(index)}>
                <Text style={styles.expRemoveBtnText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>

            <Input
              style={{ marginBottom: 10 }}
              value={entry.title}
              onChangeText={(v) => updateExperience(index, 'title', v)}
              placeholder="Job title, e.g. Senior Architect"
            />
            <Input
              style={{ marginBottom: 10 }}
              value={entry.company}
              onChangeText={(v) => updateExperience(index, 'company', v)}
              placeholder="Company name, e.g. Shah Associates"
            />

            <View style={[styles.toggleRow, { marginBottom: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleMain}>
                  {entry.current ? '✅ Currently working here' : '⏸️ Not currently working here'}
                </Text>
                <Text style={styles.toggleSub}>Toggle on if this is your current job</Text>
              </View>
              <Switch
                value={!!entry.current}
                onValueChange={(v) => updateExperience(index, 'current', v)}
                trackColor={{ false: '#CBD5E0', true: LIGHT_BLUE }}
                thumbColor={entry.current ? BLUE : '#EDF2F7'}
              />
            </View>

            <View style={styles.locationRow}>
              <Input
                style={{ flex: 1 }}
                value={entry.startYear}
                onChangeText={(v) => updateExperience(index, 'startYear', v)}
                placeholder="Start year"
                keyboardType="number-pad"
                maxLength={4}
              />
              {!entry.current && (
                <Input
                  style={{ flex: 1 }}
                  value={entry.endYear}
                  onChangeText={(v) => updateExperience(index, 'endYear', v)}
                  placeholder="End year"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addExpBtn} onPress={addExperience} activeOpacity={0.8}>
          <Text style={styles.addExpBtnText}>+ Add experience</Text>
        </TouchableOpacity>
      </Field>

      <Field label="Degree / Qualification (optional)">
        <Input
          value={data.degree}
          onChangeText={(v) => setData({ ...data, degree: v })}
          placeholder="e.g. B.Arch, B.Tech Civil"
        />
      </Field>

      <Field label="Years of Experience" required>
        <Input
          value={data.experience}
          onChangeText={(v) => setData({ ...data, experience: v })}
          placeholder="e.g. 8"
          keyboardType="number-pad"
        />
      </Field>

      <Field label="Registration Number (COA / IEI / IIID)">
        <Input
          value={data.regNumber}
          onChangeText={(v) => setData({ ...data, regNumber: v })}
          placeholder="e.g. COA/GUJ/2016/1234"
          autoCapitalize="characters"
        />
      </Field>

      <Field label="From (Native Place)">
        <View style={styles.locationRow}>
          <Input
            style={{ flex: 1 }}
            value={data.nativePlaceCity}
            onChangeText={(v) => setData({ ...data, nativePlaceCity: v })}
            placeholder="City"
          />
          <Input
            style={{ flex: 1 }}
            value={data.nativePlaceState}
            onChangeText={(v) => setData({ ...data, nativePlaceState: v })}
            placeholder="State"
          />
        </View>
      </Field>

      <MultiSelectDropdown
        label="Extra Skills"
        values={data.extraSkills || []}
        options={PROFESSIONAL_SKILLS}
        onToggle={toggleExtraSkill}
        hint="Optional — shown as #hashtags on your profile"
      />

      <Field label="About / Bio" required>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={data.bio}
          onChangeText={(v) => setData({ ...data, bio: v })}
          placeholder="Tell clients about your work, specialisations and achievements..."
          placeholderTextColor={TEXT_LIGHT}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>

      <Field label="Website">
        <Input
          value={data.website}
          onChangeText={(v) => setData({ ...data, website: v })}
          placeholder="https://yourwebsite.com"
          autoCapitalize="none"
          keyboardType="url"
        />
      </Field>

      <Field label="Verification (Aadhaar or GST)">
        <View style={styles.pillRow}>
          {['aadhaar', 'gst'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.pill, data.verificationType === t && styles.pillActive]}
              onPress={() => setData({ ...data, verificationType: t, verificationNumber: '' })}
            >
              <Text style={[styles.pillText, data.verificationType === t && styles.pillTextActive]}>
                {t === 'aadhaar' ? 'Aadhaar' : 'GST'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {data.verificationType ? (
          <Input
            style={{ marginTop: 10 }}
            value={data.verificationNumber}
            onChangeText={(v) => setData({ ...data, verificationNumber: v })}
            placeholder={data.verificationType === 'aadhaar' ? '12-digit Aadhaar number' : 'e.g. 24AABCS1429B1Z1'}
            keyboardType={data.verificationType === 'aadhaar' ? 'number-pad' : 'default'}
            autoCapitalize="characters"
            maxLength={data.verificationType === 'aadhaar' ? 12 : 15}
          />
        ) : null}
        <Text style={styles.skillHint}>Provide either one — this unlocks your verified badge</Text>
      </Field>

      <Field label="Portfolio Work Photos">
        <View style={styles.photoGrid}>
          {[0, 1, 2, 3, 4, 5].map(i => {
            const photos = data.workPhotos || [];
            const uri = photos[i];
            return (
              <View key={i} style={[styles.photoSlot, { width: slotSize, height: slotSize }]}>
                {uri ? (
                  <>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.photoXBtn} onPress={() => removePortfolioPhoto(i)}>
                      <Text style={styles.photoXText}>✕</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.photoAddBtn}
                    onPress={pickPortfolioPhoto}
                    activeOpacity={0.7}
                    disabled={photos.length >= 6}
                  >
                    <Text style={styles.photoAddIcon}>📷</Text>
                    <Text style={styles.photoAddPlus}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.skillHint}>
          Add up to 6 photos of your work · Beyond 6, more portfolio items can only come from verified completed jobs
        </Text>
      </Field>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Step 3: Worker Details ──────────────────────────────────────────────────

function Step3Worker({ data, setData }) {
  const slotSize = Math.floor((Dimensions.get('window').width - 48) / 3);

  const pickPhoto = async () => {
    const photos = data.workPhotos || [];
    if (photos.length >= 6) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add work photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setData({ ...data, workPhotos: [...photos, result.assets[0].uri] });
    }
  };

  const removePhoto = (index) => {
    const next = (data.workPhotos || []).filter((_, i) => i !== index);
    setData({ ...data, workPhotos: next });
  };

  const selectSkill = (skill) => {
    setData({
      ...data,
      primarySkill: skill,
      workerSkills: [skill],
      skillTags: [],
      workerSkill: skill,
    });
  };

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Worker Details</Text>
      <Text style={styles.stepSub}>Find the right jobs matching your skill</Text>

      <Dropdown
        label="Skill"
        required
        value={data.primarySkill}
        options={SOLO_WORKER_CATEGORIES}
        onSelect={selectSkill}
        searchable
      />

      <Field label="Experience (Years)" required>
        <Input
          value={data.workerExperience}
          onChangeText={(v) => setData({ ...data, workerExperience: v })}
          placeholder="e.g. 5"
          keyboardType="number-pad"
        />
      </Field>

      <Field label="Daily Charge (Optional)">
        <View style={styles.currencyInputWrap}>
          <Text style={styles.currencyPrefix}>₹</Text>
          <TextInput
            style={styles.currencyInputField}
            value={data.dailyCharge}
            onChangeText={(v) => setData({ ...data, dailyCharge: v.replace(/[^0-9]/g, '') })}
            placeholder="e.g. 800"
            placeholderTextColor={TEXT_LIGHT}
            keyboardType="number-pad"
          />
        </View>
        <Text style={styles.skillHint}>
          A rough guide for clients — not verified, and won't block saving if left blank.
        </Text>
      </Field>

      <Field label="Currently Available for Work">
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleMain}>
              {data.available ? '✅ Available' : '⏸️ Not Available'}
            </Text>
            <Text style={styles.toggleSub}>
              {data.available
                ? 'You will appear in search results'
                : 'Toggle on when you are ready for jobs'}
            </Text>
          </View>
          <Switch
            value={!!data.available}
            onValueChange={(v) => setData({ ...data, available: v })}
            trackColor={{ false: '#CBD5E0', true: LIGHT_BLUE }}
            thumbColor={data.available ? BLUE : '#EDF2F7'}
          />
        </View>
      </Field>

      <Field label="About / Bio">
        <TextInput
          style={[styles.input, styles.textarea]}
          value={data.workerAbout}
          onChangeText={(v) => setData({ ...data, workerAbout: v })}
          placeholder="Describe your work experience, past projects and specialities..."
          placeholderTextColor={TEXT_LIGHT}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>

      <Field label="Work Photos">
        <View style={styles.photoGrid}>
          {[0, 1, 2, 3, 4, 5].map(i => {
            const photos = data.workPhotos || [];
            const uri = photos[i];
            return (
              <View key={i} style={[styles.photoSlot, { width: slotSize, height: slotSize }]}>
                {uri ? (
                  <>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.photoXBtn} onPress={() => removePhoto(i)}>
                      <Text style={styles.photoXText}>✕</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.photoAddBtn}
                    onPress={pickPhoto}
                    activeOpacity={0.7}
                    disabled={photos.length >= 6}
                  >
                    <Text style={styles.photoAddIcon}>📷</Text>
                    <Text style={styles.photoAddPlus}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.skillHint}>
          Add up to 6 photos of your past work · Tap to pick from gallery
        </Text>
      </Field>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Step 3: Sub Contractor Details ──────────────────────────────────────────

function Step3Contractor({ data, setData }) {
  const slotSize = Math.floor((Dimensions.get('window').width - 48) / 3);

  const toggleOtherSkill = (skill) => {
    const current = data.otherSkills || [];
    setData({
      ...data,
      otherSkills: current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill],
    });
  };

  const pickWorkPhoto = async () => {
    const photos = data.workPhotos || [];
    if (photos.length >= 6) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add work photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setData({ ...data, workPhotos: [...photos, result.assets[0].uri] });
    }
  };

  const removeWorkPhoto = (index) => {
    const next = (data.workPhotos || []).filter((_, i) => i !== index);
    setData({ ...data, workPhotos: next });
  };

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Sub Contractor Details</Text>
      <Text style={styles.stepSub}>Show clients your crew, trade and track record</Text>

      <Dropdown
        label="Sub Contractor Type / Trade"
        required
        value={data.contractorType}
        options={CONTRACTOR_CATEGORIES}
        onSelect={(v) => setData({ ...data, contractorType: v })}
        searchable
      />

      <Field label="Years of Experience" required>
        <Input
          value={data.contractorExperience}
          onChangeText={(v) => setData({ ...data, contractorExperience: v })}
          placeholder="e.g. 12"
          keyboardType="number-pad"
        />
      </Field>

      <Field label="From (Native Place)">
        <View style={styles.locationRow}>
          <Input
            style={{ flex: 1 }}
            value={data.nativePlaceCity}
            onChangeText={(v) => setData({ ...data, nativePlaceCity: v })}
            placeholder="City"
          />
          <Input
            style={{ flex: 1 }}
            value={data.nativePlaceState}
            onChangeText={(v) => setData({ ...data, nativePlaceState: v })}
            placeholder="State"
          />
        </View>
      </Field>

      <Field label="Team Size">
        <Input
          value={data.contractorTeamSize}
          onChangeText={(v) => setData({ ...data, contractorTeamSize: v })}
          placeholder="e.g. 8"
          keyboardType="number-pad"
        />
      </Field>

      <Field label="Currently Available for Work">
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleMain}>
              {data.available ? '✅ Available' : '⏸️ Busy'}
            </Text>
            <Text style={styles.toggleSub}>
              {data.available
                ? 'You will appear as Available on your profile'
                : 'Clients will see you as Busy — Call button is hidden'}
            </Text>
          </View>
          <Switch
            value={!!data.available}
            onValueChange={(v) => setData({ ...data, available: v })}
            trackColor={{ false: '#CBD5E0', true: LIGHT_BLUE }}
            thumbColor={data.available ? BLUE : '#EDF2F7'}
          />
        </View>
      </Field>

      <Field label="Bio / About Your Crew">
        <TextInput
          style={[styles.input, styles.textarea]}
          value={data.contractorBio}
          onChangeText={(v) => setData({ ...data, contractorBio: v })}
          placeholder="Describe your crew's experience, past projects and specialities..."
          placeholderTextColor={TEXT_LIGHT}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>

      <Field label="Other Skills">
        <View style={styles.tagsWrap}>
          {CONTRACTOR_OTHER_SKILLS.map(skill => (
            <SkillTag
              key={skill}
              label={skill}
              selected={(data.otherSkills || []).includes(skill)}
              onPress={() => toggleOtherSkill(skill)}
            />
          ))}
        </View>
        <Text style={styles.skillHint}>Tap to select — shown as #hashtags on your profile</Text>
      </Field>

      <Field label="Website / Link">
        <Input
          value={data.contractorWebsite}
          onChangeText={(v) => setData({ ...data, contractorWebsite: v })}
          placeholder="https://yourcrew.com"
          autoCapitalize="none"
          keyboardType="url"
        />
      </Field>

      <Field label="Verification (Aadhaar or GST)">
        <View style={styles.pillRow}>
          {['aadhaar', 'gst'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.pill, data.verificationType === t && styles.pillActive]}
              onPress={() => setData({ ...data, verificationType: t, verificationNumber: '' })}
            >
              <Text style={[styles.pillText, data.verificationType === t && styles.pillTextActive]}>
                {t === 'aadhaar' ? 'Aadhaar' : 'GST'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {data.verificationType ? (
          <Input
            style={{ marginTop: 10 }}
            value={data.verificationNumber}
            onChangeText={(v) => setData({ ...data, verificationNumber: v })}
            placeholder={data.verificationType === 'aadhaar' ? '12-digit Aadhaar number' : 'e.g. 24AABCS1429B1Z1'}
            keyboardType={data.verificationType === 'aadhaar' ? 'number-pad' : 'default'}
            autoCapitalize="characters"
            maxLength={data.verificationType === 'aadhaar' ? 12 : 15}
          />
        ) : null}
        <Text style={styles.skillHint}>Provide either one — this unlocks your verified badge</Text>
      </Field>

      <Field label="Work Photos">
        <View style={styles.photoGrid}>
          {[0, 1, 2, 3, 4, 5].map(i => {
            const photos = data.workPhotos || [];
            const uri = photos[i];
            return (
              <View key={i} style={[styles.photoSlot, { width: slotSize, height: slotSize }]}>
                {uri ? (
                  <>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.photoXBtn} onPress={() => removeWorkPhoto(i)}>
                      <Text style={styles.photoXText}>✕</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.photoAddBtn}
                    onPress={pickWorkPhoto}
                    activeOpacity={0.7}
                    disabled={photos.length >= 6}
                  >
                    <Text style={styles.photoAddIcon}>📷</Text>
                    <Text style={styles.photoAddPlus}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.skillHint}>Add up to 6 photos of completed work · optional</Text>
      </Field>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Step 3: Business Details ────────────────────────────────────────────────

function Step3Business({ data, setData }) {
  const toggleService = (s) => {
    const current = data.businessServices || [];
    setData({
      ...data,
      businessServices: current.includes(s)
        ? current.filter((x) => x !== s)
        : [...current, s],
    });
  };

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Business Details</Text>
      <Text style={styles.stepSub}>Build trust with a complete business profile</Text>

      <Dropdown
        label="Company Type"
        required
        value={data.companyType}
        options={COMPANY_TYPES}
        onSelect={(v) => setData({ ...data, companyType: v })}
      />

      <Field label="GST Number">
        <Input
          value={data.gst}
          onChangeText={(v) => setData({ ...data, gst: v })}
          placeholder="e.g. 24AABCS1429B1Z1"
          autoCapitalize="characters"
          maxLength={15}
        />
      </Field>

      <Field label="RERA Number (optional)">
        <Input
          value={data.reraNumber}
          onChangeText={(v) => setData({ ...data, reraNumber: v })}
          placeholder="e.g. RAJ/P/2022/001234"
          autoCapitalize="characters"
        />
      </Field>

      <Field label="Team Size">
        <View style={styles.pillRow}>
          {['1-5', '6-20', '21-50', '50-200', '200+'].map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.pill, data.teamSize === size && styles.pillActive]}
              onPress={() => setData({ ...data, teamSize: size })}
            >
              <Text style={[styles.pillText, data.teamSize === size && styles.pillTextActive]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Year Established">
        <Input
          value={data.yearEstablished}
          onChangeText={(v) => setData({ ...data, yearEstablished: v })}
          placeholder="e.g. 2010"
          keyboardType="number-pad"
          maxLength={4}
        />
      </Field>

      <Field label="Services Offered">
        <View style={styles.tagsWrap}>
          {BUSINESS_SERVICES.map((s) => (
            <SkillTag
              key={s}
              label={s}
              selected={(data.businessServices || []).includes(s)}
              onPress={() => toggleService(s)}
            />
          ))}
        </View>
      </Field>

      <Field label="About the Company">
        <TextInput
          style={[styles.input, styles.textarea]}
          value={data.companyAbout}
          onChangeText={(v) => setData({ ...data, companyAbout: v })}
          placeholder="Describe your company, services offered and major projects..."
          placeholderTextColor={TEXT_LIGHT}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>

      <Field label="Website">
        <Input
          value={data.businessWebsite}
          onChangeText={(v) => setData({ ...data, businessWebsite: v })}
          placeholder="https://yourcompany.com"
          autoCapitalize="none"
          keyboardType="url"
        />
      </Field>

      <Field label="LinkedIn">
        <Input
          value={data.businessLinkedin}
          onChangeText={(v) => setData({ ...data, businessLinkedin: v })}
          placeholder="linkedin.com/company/yourcompany"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Instagram">
        <Input
          value={data.businessInstagram}
          onChangeText={(v) => setData({ ...data, businessInstagram: v })}
          placeholder="@yourcompany"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Google Maps Link">
        <Input
          value={data.googleMaps}
          onChangeText={(v) => setData({ ...data, googleMaps: v })}
          placeholder="maps.google.com/..."
          autoCapitalize="none"
        />
      </Field>

      <Field label="WhatsApp Number">
        <Input
          value={data.whatsapp}
          onChangeText={(v) => setData({ ...data, whatsapp: v })}
          placeholder="10-digit number"
          keyboardType="phone-pad"
          maxLength={10}
        />
      </Field>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Step 3: Supplier Details ────────────────────────────────────────────────

function Step3Supplier({ data, setData }) {
  const toggleMaterial = (mat) => {
    const current = data.materials || [];
    setData({
      ...data,
      materials: current.includes(mat)
        ? current.filter((m) => m !== mat)
        : [...current, mat],
    });
  };

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Supplier Details</Text>
      <Text style={styles.stepSub}>Connect with buyers across construction projects</Text>

      <Dropdown
        label="Category"
        required
        value={data.supplierCategory}
        options={SUPPLIER_CATEGORIES}
        onSelect={(v) => setData({ ...data, supplierCategory: v })}
      />

      <Field label="GST Number">
        <Input
          value={data.supplierGst}
          onChangeText={(v) => setData({ ...data, supplierGst: v })}
          placeholder="e.g. 24AABCS1429B1Z1"
          autoCapitalize="characters"
          maxLength={15}
        />
      </Field>

      <Field label="Materials Supplied" required>
        <View style={styles.materialGrid}>
          {MATERIALS.map((mat) => (
            <Checkbox
              key={mat}
              label={mat}
              checked={(data.materials || []).includes(mat)}
              onPress={() => toggleMaterial(mat)}
            />
          ))}
        </View>
      </Field>

      <Field label="Delivery Radius (km)">
        <View style={styles.pillRow}>
          {['10 km', '25 km', '50 km', '100 km', 'Pan India'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.pill, data.deliveryRadius === r && styles.pillActive]}
              onPress={() => setData({ ...data, deliveryRadius: r })}
            >
              <Text style={[styles.pillText, data.deliveryRadius === r && styles.pillTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Minimum Order">
        <Input
          value={data.minOrder}
          onChangeText={(v) => setData({ ...data, minOrder: v })}
          placeholder="e.g. 10 bags, ₹5,000 minimum"
        />
      </Field>

      <Dropdown
        label="Payment Terms"
        value={data.paymentTerms}
        options={PAYMENT_TERMS_LIST}
        onSelect={(v) => setData({ ...data, paymentTerms: v })}
      />

      <Field label="About">
        <TextInput
          style={[styles.input, styles.textarea]}
          value={data.supplierAbout}
          onChangeText={(v) => setData({ ...data, supplierAbout: v })}
          placeholder="Describe your business, product quality and coverage area..."
          placeholderTextColor={TEXT_LIGHT}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>

      <Field label="Website">
        <Input
          value={data.supplierWebsite}
          onChangeText={(v) => setData({ ...data, supplierWebsite: v })}
          placeholder="https://yourbusiness.com"
          autoCapitalize="none"
          keyboardType="url"
        />
      </Field>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Step 3 Dispatcher ──────────────────────────────────────────────────────

function Step3({ data, setData }) {
  const pt = data.profileType || data.role;
  switch (pt) {
    case 'professional':
    case 'Professional': return <Step3Professional data={data} setData={setData} />;
    case 'worker':
    case 'Worker':       return <Step3Worker       data={data} setData={setData} />;
    case 'contractor':
    case 'Contractor':   return <Step3Contractor   data={data} setData={setData} />;
    case 'business':
    case 'Business':     return <Step3Business     data={data} setData={setData} />;
    case 'supplier':
    case 'Supplier':     return <Step3Supplier     data={data} setData={setData} />;
    default:             return null;
  }
}

// ─── Step 4: Review & Save ───────────────────────────────────────────────────

function Step4({ data, onEdit, profileType }) {
  const pt = profileType || data.profileType || data.role;
  const emojiMap = {
    professional: '🏛️', worker: '👷', contractor: '👷‍♂️', business: '🏢', supplier: '🏭',
    Professional: '🏛️', Worker: '👷', Contractor: '👷‍♂️', Business: '🏢', Supplier: '🏭',
  };
  const detailStep = profileType ? 2 : 3;
  const basicStep = 1;
  const roleStep = profileType ? null : 2;

  const displayName = (pt === 'business' || pt === 'Business') ? data.companyName
    : (pt === 'supplier' || pt === 'Supplier') ? (data.companyName || data.businessName)
    : data.name;

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Profile Preview</Text>
      <Text style={styles.stepSub}>Review your information before saving</Text>

      {/* Avatar */}
      <View style={styles.reviewAvatarWrap}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarEmoji}>{emojiMap[pt] || '👤'}</Text>
        </View>
      </View>

      <Text style={styles.reviewName}>{displayName || 'Your Name'}</Text>
      <Text style={styles.reviewRole}>{data.role || pt || 'Role'}</Text>
      {data.city ? (
        <Text style={styles.reviewLocation}>📍 {data.city}{data.state ? `, ${data.state}` : ''}</Text>
      ) : null}

      {/* Basic info card */}
      <ReviewCard title="Basic Info" onEdit={() => onEdit(basicStep)}>
        <ReviewRow icon="👤" label="Name" value={displayName} />
        <ReviewRow icon="📱" label="Phone" value={data.phone ? `+91 ${data.phone}` : ''} />
        <ReviewRow icon="📍" label="Location" value={[data.area, data.city, data.state].filter(Boolean).join(', ') + (data.pincode ? ` — ${data.pincode}` : '')} />
        {!profileType && <ReviewRow icon="🗣️" label="Languages" value={(data.languages || []).join(', ')} />}
      </ReviewCard>

      {/* Role card — only in original 4-step flow */}
      {roleStep && (
        <ReviewCard title="Role" onEdit={() => onEdit(roleStep)}>
          <ReviewRow icon={emojiMap[data.role] || '❓'} label="Role" value={data.role} />
        </ReviewCard>
      )}

      {/* Professional */}
      {(pt === 'professional' || pt === 'Professional') && (
        <ReviewCard title="Professional Details" onEdit={() => onEdit(detailStep)}>
          <ReviewRow icon="🎓" label="Primary Skill" value={data.designation} />
          <ReviewRow icon="🏛️" label="Employment" value={data.selfEmployed} />
          <ReviewRow icon="📅" label="Experience" value={data.experience ? `${data.experience} years` : ''} />
          <ReviewRow icon="🪪" label="Reg. Number" value={data.regNumber} />
          <ReviewRow icon="🏠" label="Native Place" value={[data.nativePlaceCity, data.nativePlaceState].filter(Boolean).join(', ')} />
          <ReviewRow icon="#️⃣" label="Extra Skills" value={(data.extraSkills || []).slice(0, 3).join(', ')} />
          <ReviewRow icon="✅" label="Verification" value={data.verificationNumber ? `${data.verificationType === 'gst' ? 'GST' : 'Aadhaar'} added` : ''} />
        </ReviewCard>
      )}

      {/* Worker */}
      {(pt === 'worker' || pt === 'Worker') && (
        <ReviewCard title="Worker Details" onEdit={() => onEdit(detailStep)}>
          <ReviewRow icon="⭐" label="Skill" value={data.primarySkill || data.workerSkills?.[0] || data.workerSkill} />
          <ReviewRow icon="📅" label="Experience" value={data.workerExperience ? `${data.workerExperience} years` : ''} />
          <ReviewRow icon="💰" label="Daily Charge" value={data.dailyCharge ? `₹${data.dailyCharge} / day` : ''} />
          <ReviewRow icon="✅" label="Available" value={data.available ? 'Yes' : 'No'} />
        </ReviewCard>
      )}

      {/* Contractor */}
      {(pt === 'contractor' || pt === 'Contractor') && (
        <ReviewCard title="Sub Contractor Details" onEdit={() => onEdit(detailStep)}>
          <ReviewRow icon="🏗️" label="Trade" value={data.contractorType} />
          <ReviewRow icon="📅" label="Experience" value={data.contractorExperience ? `${data.contractorExperience} years` : ''} />
          <ReviewRow icon="👥" label="Team Size" value={data.contractorTeamSize} />
          <ReviewRow icon="🏠" label="Native Place" value={[data.nativePlaceCity, data.nativePlaceState].filter(Boolean).join(', ')} />
          <ReviewRow icon="#️⃣" label="Other Skills" value={(data.otherSkills || []).slice(0, 3).join(', ')} />
          <ReviewRow icon="✅" label="Verification" value={data.verificationNumber ? `${data.verificationType === 'gst' ? 'GST' : 'Aadhaar'} added` : ''} />
        </ReviewCard>
      )}

      {/* Business */}
      {(pt === 'business' || pt === 'Business') && (
        <ReviewCard title="Business Details" onEdit={() => onEdit(detailStep)}>
          <ReviewRow icon="🏢" label="Company" value={data.companyName} />
          <ReviewRow icon="🏭" label="Type" value={data.companyType} />
          <ReviewRow icon="📋" label="GST" value={data.gst} />
          <ReviewRow icon="🏗️" label="RERA" value={data.reraNumber} />
          <ReviewRow icon="👥" label="Team Size" value={data.teamSize} />
          <ReviewRow icon="📅" label="Est." value={data.yearEstablished} />
          <ReviewRow icon="🔧" label="Services" value={(data.businessServices || []).slice(0, 3).join(', ')} />
        </ReviewCard>
      )}

      {/* Supplier */}
      {(pt === 'supplier' || pt === 'Supplier') && (
        <ReviewCard title="Supplier Details" onEdit={() => onEdit(detailStep)}>
          <ReviewRow icon="🏪" label="Company" value={data.companyName || data.businessName} />
          <ReviewRow icon="📦" label="Category" value={data.supplierCategory} />
          <ReviewRow icon="📋" label="GST" value={data.supplierGst} />
          <ReviewRow icon="🚚" label="Delivery" value={data.deliveryRadius} />
          <ReviewRow icon="💳" label="Payment" value={data.paymentTerms} />
        </ReviewCard>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function ReviewCard({ title, onEdit, children }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewCardHeader}>
        <Text style={styles.reviewCardTitle}>{title}</Text>
        <TouchableOpacity onPress={onEdit}>
          <Text style={styles.reviewCardEdit}>Edit ✏️</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

function ReviewRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewRowIcon}>{icon}</Text>
      <Text style={styles.reviewRowLabel}>{label}</Text>
      <Text style={styles.reviewRowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function EditProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const phone = route?.params?.phone || '';
  const profileType = route?.params?.profileType || null;
  const roleParam = route?.params?.role || '';
  const focusSection = route?.params?.focusSection || null;

  // When coming from BusinessTypeScreen: 3 steps (Basic → Details → Review)
  // Original flow: 4 steps (Basic → Role → Details → Review)
  const TOTAL_STEPS = profileType ? 3 : 4;
  const PROGRESS_LABELS = profileType
    ? ['Basic Info', 'Details', 'Review']
    : ['Basic Info', 'Role', 'Details', 'Review'];

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [data, setData] = useState({
    phone,
    profileType: profileType || '',
    role: roleParam,
    photoUri: '',
    // personal
    name: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    lat: null,
    lng: null,
    languages: [],
    // company identity (business / supplier)
    companyName: '',
    // professional
    designation: '',
    selfEmployed: '',
    degree: '',
    experience: '',
    regNumber: '',
    bio: '',
    extraSkills: [],
    website: '',
    // professional — work history (optional, LinkedIn-style, multiple entries)
    experienceHistory: [],
    // worker
    workPhotos: [],
    workerSkills: [],
    primarySkill: '',
    skillTags: [],
    workerSkill: '',
    workerExperience: '',
    available: true,
    workerAbout: '',
    dailyCharge: '',
    // contractor
    contractorType: '',
    contractorExperience: '',
    nativePlaceCity: '',
    nativePlaceState: '',
    contractorTeamSize: '',
    contractorBio: '',
    otherSkills: [],
    contractorWebsite: '',
    verificationType: '',
    verificationNumber: '',
    // business
    gst: '',
    reraNumber: '',
    companyType: '',
    teamSize: '',
    yearEstablished: '',
    businessServices: [],
    companyAbout: '',
    businessWebsite: '',
    businessLinkedin: '',
    businessInstagram: '',
    googleMaps: '',
    whatsapp: '',
    // supplier
    supplierCategory: '',
    supplierGst: '',
    materials: [],
    deliveryRadius: '',
    minOrder: '',
    paymentTerms: '',
    supplierAbout: '',
    supplierWebsite: '',
  });

  // Editing an existing profile (Edit Profile / pencil-icon entry points) must start
  // pre-filled with the saved data — otherwise saving would blank out fields the user
  // didn't touch. Fresh signups simply find no existing profile and fall through.
  useEffect(() => {
    (async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        if (!uid) { setProfileLoading(false); return; }
        let existing = null;
        try { existing = await getProfile(uid); } catch (_) {}
        if (!existing) {
          try {
            const local = await AsyncStorage.getItem('localProfile');
            if (local) existing = JSON.parse(local);
          } catch (_) {}
        }
        if (existing) {
          setData(prev => ({ ...prev, ...existing, phone: prev.phone || existing.phone || '' }));
          if (focusSection) {
            setStep(profileType ? 2 : 3);
          }
        }
      } catch (_) {}
      finally { setProfileLoading(false); }
    })();
  }, []);

  const canProceed = () => {
    if (step === 1) {
      const isCompany = profileType === 'business' || profileType === 'supplier';
      const isProvider = profileType === 'worker' || profileType === 'contractor' || profileType === 'professional';
      const primaryName = isCompany ? data.companyName : data.name;
      // Providers must supply both city and state (current location); other
      // profile types only need city, matching the manual City & State field.
      const hasLocation = isProvider
        ? data.city.trim().length > 0 && data.state.trim().length > 0
        : data.city.trim().length > 0;
      return primaryName.trim().length > 0 && hasLocation;
    }
    // Original flow step 2: role selection
    if (!profileType && step === 2) return data.role.length > 0;
    // Detail step
    const detailStep = profileType ? 2 : 3;
    if (step === detailStep) {
      const pt = profileType || data.role;
      if (pt === 'professional' || pt === 'Professional') return data.designation.length > 0;
      if (pt === 'worker'       || pt === 'Worker')       return (data.workerSkills || []).length > 0;
      if (pt === 'contractor'   || pt === 'Contractor')   return data.contractorType.length > 0 && data.contractorExperience.trim().length > 0;
      if (pt === 'business'     || pt === 'Business')     return data.companyName.trim().length > 0;
      if (pt === 'supplier'     || pt === 'Supplier')     return data.supplierCategory.length > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const PROFILE_DEST = {
    professional: 'ProfessionalProfile',
    worker: 'WorkerProfile',
    contractor: 'ContractorProfile',
    business: 'BusinessProfile',
    supplier: 'SupplierProfile',
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) throw new Error('No session found. Please restart the app.');

      const pt = (profileType || data.role || '').toLowerCase();
      const displayName = (pt === 'business' || pt === 'supplier')
        ? (data.companyName || data.name || '')
        : (data.name || '');

      // Build location string and clean up worker-specific fields
      const { dailyWage: _removed, ...cleanData } = data;
      const workerSkills = cleanData.workerSkills || [];
      const primarySkill = cleanData.primarySkill || workerSkills[0] || '';
      const skillTags = (cleanData.skillTags?.length > 0 ? cleanData.skillTags : workerSkills.slice(1));
      const area = cleanData.area || '';
      const city = cleanData.city || '';
      const pincode = cleanData.pincode || '';
      const locationStr = [area, city].filter(Boolean).join(', ') + (pincode ? ` — ${pincode}` : '');

      // Coordinates: GPS-detected ones already live on cleanData.lat/lng. If the
      // provider set location manually (or edited city/state after a GPS detect,
      // which clears them), approximate coordinates by geocoding the city/state
      // text so distance-based ("near me") search still has something to work
      // with. Never block saving on this — falls back to null on any failure,
      // and Search already handles providers with no coordinates gracefully.
      let lat = typeof cleanData.lat === 'number' ? cleanData.lat : null;
      let lng = typeof cleanData.lng === 'number' ? cleanData.lng : null;
      if (lat == null && lng == null && (city || cleanData.state)) {
        try {
          const address = [city, cleanData.state].filter(Boolean).join(', ');
          const geocoded = await Location.geocodeAsync(address);
          if (geocoded?.[0]) {
            lat = geocoded[0].latitude;
            lng = geocoded[0].longitude;
          }
        } catch (_) {
          // geocoding unavailable/failed — lat/lng stay null
        }
      }

      // Contractor / Professional only: verification is either an Aadhaar or a GST number
      // (never both required), and drives the green verified badge — never write `verified`
      // for other profile types.
      const verificationExtra = (pt === 'contractor' || pt === 'professional')
        ? { verified: !!(cleanData.verificationNumber && cleanData.verificationNumber.trim()) }
        : {};

      const extraSkillsByType = {
        contractor: cleanData.otherSkills || [],
        professional: cleanData.extraSkills || [],
      };

      const profileData = {
        ...cleanData,
        profileType: pt,
        role: cleanData.role || profileType || '',
        phone: cleanData.phone || (await AsyncStorage.getItem('phone')) || '',
        category: cleanData.designation || primarySkill || cleanData.supplierCategory || cleanData.contractorType || '',
        workerSkills,
        primarySkill,
        skillTags: extraSkillsByType[pt] ?? skillTags,
        workerSkill: primarySkill || cleanData.workerSkill || '',
        area,
        city,
        pincode,
        lat,
        lng,
        location: locationStr,
        ccScore: 500,
        createdAt: new Date().toISOString(),
        ...verificationExtra,
      };

      if (displayName) await AsyncStorage.setItem('userName', displayName);

      if (!auth.currentUser) {
        // Guest / skipped login — save locally only
        await AsyncStorage.setItem('localProfile', JSON.stringify({ ...profileData, uid }));
        Alert.alert(
          'Profile Saved! 🎉',
          'Your profile has been saved on this device. Sign up anytime to go live and connect with clients.',
          [{ text: 'Continue', onPress: () => navigation.replace('Home') }]
        );
      } else {
        // Authenticated user — save to Firestore
        await saveProfile(uid, profileData);
        Alert.alert(
          'Profile Saved! 🎉',
          'Your profile is now live on Construction Corner.',
          [{
            text: 'View Profile',
            onPress: () => {
              const dest = PROFILE_DEST[pt] || 'Home';
              navigation.replace(dest, { uid });
            },
          }]
        );
      }
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const goToStep = (s) => setStep(s);

  const isLastStep = step === TOTAL_STEPS;
  const nextLabel = isLastStep ? (saving ? 'Saving…' : 'Save Profile ✓') : 'Next →';

  const headerTitle = () => {
    if (step === 1) return 'Basic Info';
    if (!profileType && step === 2) return 'Choose Role';
    if (profileType ? step === 2 : step === 3) return 'Profile Details';
    return 'Review & Save';
  };

  if (profileLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle()}</Text>
        <TouchableOpacity onPress={() => navigation.replace('Home')}>
          <Text style={styles.skipBtn}>Later</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <ProgressBar step={step} total={TOTAL_STEPS} labels={PROGRESS_LABELS} />

      {/* Step Content */}
      <View style={{ flex: 1 }}>
        {step === 1 && <Step1 data={data} setData={setData} profileType={profileType} />}
        {!profileType && step === 2 && <Step2 data={data} setData={setData} />}
        {(profileType ? step === 2 : step === 3) && <Step3 data={data} setData={setData} />}
        {(profileType ? step === 3 : step === 4) && <Step4 data={data} onEdit={goToStep} profileType={profileType} />}
      </View>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {step > 1 && (
          <TouchableOpacity style={styles.prevBtn} onPress={handleBack}>
            <Text style={styles.prevBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            step === 1 && { flex: 1 },
            (!canProceed() || saving) && styles.nextBtnDisabled,
          ]}
          onPress={isLastStep ? handleSave : handleNext}
          disabled={!canProceed() || saving}
        >
          <Text style={styles.nextBtnText}>{nextLabel}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = injectFonts({
  container: { flex: 1, backgroundColor: 'white' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: GREY_BG,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 24, color: TEXT_DARK, lineHeight: 28 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  skipBtn: { fontSize: 13, fontWeight: '700', color: TEXT_LIGHT },

  // Progress
  progressWrap: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white' },
  progressTrack: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  progressSegment: {
    flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0',
  },
  progressSegmentActive: { backgroundColor: BLUE },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 10, fontWeight: '600', color: TEXT_LIGHT },
  progressLabelActive: { color: BLUE, fontWeight: '800' },

  // Step
  stepScroll: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  stepTitle: { fontSize: 22, fontWeight: '900', color: TEXT_DARK, marginBottom: 4 },
  stepSub: { fontSize: 13, color: TEXT_MID, marginBottom: 24, lineHeight: 20 },

  // Photos
  photoRow: { alignItems: 'center', marginBottom: 24 },
  photoCircleWrap: { alignItems: 'center', gap: 8 },
  photoCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: GREY_BG,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BORDER, borderStyle: 'dashed',
  },
  photoEmoji: { fontSize: 40 },
  photoCircleImg: { width: 90, height: 90, borderRadius: 45 },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'white',
  },
  cameraEmoji: { fontSize: 13 },
  photoCircleLabel: { fontSize: 11, fontWeight: '700', color: TEXT_MID },
  coverPhotoWrap: { marginBottom: 16 },
  coverPhoto: {
    height: 110, borderRadius: 14, backgroundColor: GREY_BG,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed',
  },
  coverPhotoIcon: { fontSize: 28 },
  coverPhotoLabel: { fontSize: 12, fontWeight: '700', color: TEXT_MID },

  // Field
  fieldWrap: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '800', color: TEXT_MID, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Input
  input: {
    backgroundColor: GREY_BG, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 13, fontSize: 15, color: TEXT_DARK,
    borderWidth: 1.5, borderColor: BORDER, fontWeight: '500',
  },
  textarea: { minHeight: 110, paddingTop: 12 },

  currencyInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: GREY_BG, borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 14,
  },
  currencyPrefix: { fontSize: 15, fontWeight: '700', color: TEXT_DARK, marginRight: 4 },
  currencyInputField: { flex: 1, paddingVertical: 13, fontSize: 15, color: TEXT_DARK, fontWeight: '500' },

  // Phone
  phonePreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EAF7EF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: '#CFEFDC',
  },
  phoneFlag: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  phoneValue: { flex: 1, fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  phoneLocked: { fontSize: 11, fontWeight: '700', color: '#38A169' },

  // Location
  locationRow: { flexDirection: 'row', gap: 10 },
  detectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: LIGHT_BLUE, borderRadius: 12, paddingVertical: 13,
    borderWidth: 1.5, borderColor: BLUE, borderStyle: 'dashed',
  },
  detectBtnText: { fontSize: 14, fontWeight: '800', color: BLUE },

  // Checkboxes
  checkGrid: { gap: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkBox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'white',
  },
  checkBoxActive: { backgroundColor: BLUE, borderColor: BLUE },
  checkMark: { fontSize: 13, fontWeight: '900', color: 'white' },
  checkLabel: { fontSize: 14, fontWeight: '500', color: TEXT_DARK },

  // Dropdown
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownTriggerDisabled: { backgroundColor: LIGHT_BLUE, opacity: 0.6 },
  dropdownArrow: { fontSize: 16, color: TEXT_LIGHT },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '70%',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK, marginBottom: 16, textAlign: 'center' },
  modalSearchInput: {
    backgroundColor: GREY_BG, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 11, fontSize: 15, color: TEXT_DARK,
    borderWidth: 1.5, borderColor: BORDER, marginBottom: 12,
  },
  modalEmptyText: { fontSize: 13, color: TEXT_LIGHT, textAlign: 'center', paddingVertical: 24, fontStyle: 'italic' },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalOptionActive: { backgroundColor: LIGHT_BLUE, borderRadius: 8, paddingHorizontal: 8 },
  modalOptionText: { fontSize: 14, fontWeight: '500', color: TEXT_DARK },
  modalDoneBtn: { marginTop: 14, backgroundColor: BLUE, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  modalDoneBtnText: { fontSize: 14, fontWeight: '800', color: 'white' },

  // Skill Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillHint: { fontSize: 11, color: TEXT_LIGHT, marginTop: 8, fontStyle: 'italic', fontWeight: '500' },
  locationRequiredHint: { fontSize: 11, color: '#E53E3E', marginTop: 8, fontWeight: '600' },
  hashChipEdit: {
    backgroundColor: LIGHT_BLUE, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: BLUE,
  },
  hashChipEditText: { fontSize: 12, fontWeight: '700', color: BLUE },

  // Work Photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoSlot: { borderRadius: 12, overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%', borderRadius: 12 },
  photoXBtn: {
    position: 'absolute', top: 5, right: 5,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoXText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  photoAddBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: GREY_BG,
    borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed',
  },
  photoAddIcon: { fontSize: 22 },
  photoAddPlus: { fontSize: 13, fontWeight: '800', color: TEXT_LIGHT },
  skillTag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, backgroundColor: 'white' },
  skillTagActive: { backgroundColor: LIGHT_BLUE, borderColor: BLUE },
  skillTagText: { fontSize: 12, fontWeight: '600', color: TEXT_MID },
  skillTagTextActive: { color: BLUE, fontWeight: '700' },

  // Pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: 'white' },
  pillActive: { backgroundColor: BLUE, borderColor: BLUE },
  pillText: { fontSize: 12, fontWeight: '600', color: TEXT_MID },
  pillTextActive: { color: 'white', fontWeight: '700' },

  // Currency
  currencyRow: { flexDirection: 'row' },
  currencyBadge: {
    backgroundColor: GREY_BG, borderWidth: 1.5, borderColor: BORDER,
    borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
    paddingHorizontal: 14, justifyContent: 'center',
  },
  currencySign: { fontSize: 18, fontWeight: '700', color: TEXT_MID },

  // Experience (repeatable entries)
  expCard: {
    backgroundColor: GREY_BG, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER,
    padding: 14, marginBottom: 12,
  },
  expCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  expCardTitle: { fontSize: 12, fontWeight: '800', color: TEXT_MID, textTransform: 'uppercase', letterSpacing: 0.5 },
  expRemoveBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  expRemoveBtnText: { fontSize: 12, fontWeight: '700', color: '#E53E3E' },
  addExpBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: LIGHT_BLUE, borderRadius: 12, paddingVertical: 13,
    borderWidth: 1.5, borderColor: BLUE, borderStyle: 'dashed',
  },
  addExpBtnText: { fontSize: 14, fontWeight: '800', color: BLUE },

  // Toggle
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: GREY_BG, borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: BORDER,
  },
  toggleMain: { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginBottom: 3 },
  toggleSub: { fontSize: 11, color: TEXT_MID, lineHeight: 16 },

  // Material grid
  materialGrid: { gap: 2 },

  // Roles
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roleCard: {
    width: '47%', backgroundColor: 'white', borderRadius: 18,
    padding: 20, alignItems: 'center', gap: 6,
    borderWidth: 2, borderColor: BORDER,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  roleCardActive: { borderColor: BLUE, backgroundColor: LIGHT_BLUE },
  roleIcon: { fontSize: 42, marginBottom: 4 },
  roleLabel: { fontSize: 16, fontWeight: '900', color: TEXT_DARK },
  roleLabelActive: { color: BLUE },
  roleSub: { fontSize: 10, fontWeight: '500', color: TEXT_LIGHT, textAlign: 'center', lineHeight: 15 },
  roleCheck: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
  },
  roleCheckText: { fontSize: 12, fontWeight: '900', color: 'white' },

  // Review
  reviewAvatarWrap: { alignItems: 'center', marginBottom: 12, marginTop: 8 },
  reviewAvatar: {
    width: 86, height: 86, borderRadius: 43, backgroundColor: LIGHT_BLUE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: BLUE,
  },
  reviewAvatarEmoji: { fontSize: 44 },
  reviewRoleBadge: {
    position: 'absolute', bottom: 0, right: '37%',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BORDER,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  reviewName: { textAlign: 'center', fontSize: 20, fontWeight: '900', color: TEXT_DARK, marginBottom: 4 },
  reviewRole: {
    textAlign: 'center', fontSize: 13, fontWeight: '700', color: BLUE,
    backgroundColor: LIGHT_BLUE, alignSelf: 'center',
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginBottom: 4,
  },
  reviewLocation: { textAlign: 'center', fontSize: 12, color: TEXT_MID, marginBottom: 20 },
  reviewCard: {
    backgroundColor: GREY_BG, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  reviewCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reviewCardTitle: { fontSize: 13, fontWeight: '800', color: TEXT_DARK },
  reviewCardEdit: { fontSize: 12, fontWeight: '700', color: BLUE },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  reviewRowIcon: { fontSize: 15, width: 24 },
  reviewRowLabel: { fontSize: 12, fontWeight: '600', color: TEXT_MID, width: 80 },
  reviewRowValue: { flex: 1, fontSize: 13, fontWeight: '600', color: TEXT_DARK },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row', gap: 10, padding: 16,
    backgroundColor: 'white', borderTopWidth: 1, borderTopColor: BORDER,
  },
  prevBtn: {
    paddingHorizontal: 20, paddingVertical: 15, borderRadius: 14,
    borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  prevBtnText: { fontSize: 14, fontWeight: '700', color: TEXT_MID },
  nextBtn: {
    flex: 2, backgroundColor: BLUE, paddingVertical: 15,
    borderRadius: 14, alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: '#B5B5B5' },
  nextBtnText: { fontSize: 16, fontWeight: '900', color: 'white' },
});
