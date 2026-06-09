import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Modal, FlatList, KeyboardAvoidingView,
  Platform, Animated, Alert,
} from 'react-native';
import { useState, useMemo, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postJob } from '../services/jobService';

import { BLUE } from '../constants/colors';

const LIGHT_BLUE = '#E0F5FE';
const GREY_BG = '#F2F0ED';
const BORDER = '#E2E8F0';
const TEXT_DARK = '#1A202C';
const TEXT_MID = '#4A5568';
const TEXT_LIGHT = '#A0ADB8';
const GREEN = '#38A169';

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Civil Engineering', 'Structural Engineering', 'Architecture',
  'Interior Design', 'Electrical', 'Plumbing & Sanitation',
  'MEP Engineering', 'Painting & Finishing', 'Waterproofing',
  'Steel & Fabrication', 'Flooring & Tiling', 'Carpentry & Woodwork',
  'Project Management', 'Quantity Surveying', 'Safety & QC',
  'Landscaping', 'HVAC', 'Surveying & GIS',
];

const EXPERIENCE_OPTIONS = [
  'Fresher (0-1 yr)', '1-2 Years', '2-3 Years', '3-5 Years',
  '5-8 Years', '8-10 Years', '10+ Years',
];

const JOB_TYPES = [
  { key: 'Full Time',   icon: '🏢', desc: 'Permanent role' },
  { key: 'Part Time',   icon: '⏱️', desc: 'Flexible hours' },
  { key: 'Contract',    icon: '📄', desc: 'Fixed duration' },
  { key: 'Daily Wage',  icon: '📅', desc: 'Per day basis' },
];

const CONTACT_OPTIONS = [
  { key: 'Phone',  icon: '📞', desc: 'Call preferred' },
  { key: 'Chat',   icon: '💬', desc: 'In-app messages' },
  { key: 'Both',   icon: '🔗', desc: 'Any channel' },
];

const SUGGESTED_SKILLS = [
  'AutoCAD', 'Revit', 'SketchUp', 'Site Supervision', 'RCC Design',
  'MS Project', 'STAAD Pro', 'Estimation', '3ds Max', 'RERA',
  'Safety Management', 'BOQ Preparation', 'Vastu Shastra', 'BIM',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionHeadIcon}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View>
        <Text style={styles.sectionHeadTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionHeadSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function FieldLabel({ children, required }) {
  return (
    <Text style={styles.fieldLabel}>
      {children}
      {required ? <Text style={{ color: '#E53E3E' }}> *</Text> : null}
    </Text>
  );
}

function DropdownField({ label, required, value, placeholder, options, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <TouchableOpacity
        style={[styles.input, styles.dropdownRow, value && styles.inputFilled]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownChevron}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, item === value && styles.modalOptionSelected]}
                  onPress={() => { onSelect(item); setOpen(false); }}
                >
                  <Text style={[styles.modalOptionText, item === value && { color: BLUE, fontWeight: '700' }]}>
                    {item}
                  </Text>
                  {item === value && <Text style={{ color: BLUE, fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function RadioGroup({ label, required, options, value, onChange }) {
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <View style={styles.radioGrid}>
        {options.map((opt) => {
          const selected = value === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.radioCard, selected && styles.radioCardSelected]}
              onPress={() => onChange(opt.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.radioIcon}>{opt.icon}</Text>
              <Text style={[styles.radioKey, selected && styles.radioKeySelected]}>{opt.key}</Text>
              <Text style={styles.radioDesc}>{opt.desc}</Text>
              {selected && <View style={styles.radioCheck}><Text style={styles.radioCheckText}>✓</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function SkillsInput({ skills, onChange }) {
  const [input, setInput] = useState('');

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !skills.includes(s)) onChange([...skills, s]);
    setInput('');
  };

  const removeSkill = (s) => onChange(skills.filter((sk) => sk !== s));

  return (
    <View style={styles.fieldWrap}>
      <FieldLabel>Skills Required</FieldLabel>
      <View style={styles.skillInputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Type a skill and press +"
          placeholderTextColor={TEXT_LIGHT}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => addSkill(input)}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addSkillBtn, !input.trim() && styles.addSkillBtnDim]}
          onPress={() => addSkill(input)}
          disabled={!input.trim()}
        >
          <Text style={styles.addSkillBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {/* Added tags */}
      {skills.length > 0 && (
        <View style={styles.tagsRow}>
          {skills.map((s) => (
            <View key={s} style={styles.tag}>
              <Text style={styles.tagText}>{s}</Text>
              <TouchableOpacity onPress={() => removeSkill(s)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={styles.tagRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {/* Suggestions */}
      <Text style={styles.suggestLabel}>Suggestions:</Text>
      <View style={styles.suggestRow}>
        {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 6).map((s) => (
          <TouchableOpacity key={s} style={styles.suggestChip} onPress={() => addSkill(s)}>
            <Text style={styles.suggestText}>+ {s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 350, useNativeDriver: false }).start();
  }, [pct]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width }]} />
      </View>
      <Text style={styles.progressLabel}>{Math.round(pct)}% complete</Text>
    </View>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ onPostAnother, onViewJob }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.successWrap, { opacity }]}>
      <Animated.View style={[styles.successIconWrap, { transform: [{ scale }] }]}>
        <Text style={styles.successIcon}>✅</Text>
      </Animated.View>
      <Text style={styles.successTitle}>Job Posted Successfully!</Text>
      <Text style={styles.successSub}>
        Your job listing is now live. Qualified candidates will start applying soon.
      </Text>

      <View style={styles.successStats}>
        {[
          { icon: '👁️', label: 'Estimated views', value: '200-500' },
          { icon: '👥', label: 'Avg applicants', value: '15-40' },
          { icon: '⏱️', label: 'Time to hire', value: '3-7 days' },
        ].map((s) => (
          <View key={s.label} style={styles.successStat}>
            <Text style={styles.successStatIcon}>{s.icon}</Text>
            <Text style={styles.successStatValue}>{s.value}</Text>
            <Text style={styles.successStatLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.viewJobBtn} onPress={onViewJob}>
        <Text style={styles.viewJobBtnText}>View Posted Job →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.postAnotherBtn} onPress={onPostAnother}>
        <Text style={styles.postAnotherText}>+ Post Another Job</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const INITIAL = {
  title: '',
  category: '',
  jobType: '',
  location: '',
  experience: '',
  salary: '',
  salaryPer: 'Month',
  workers: '1',
  description: '',
  skills: [],
  startDate: '',
  contactPref: 'Both',
};

export default function PostJobScreen({ navigation }) {
  const [form, setForm] = useState(INITIAL);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  // Required fields for progress
  const REQUIRED = ['title', 'category', 'jobType', 'location', 'experience', 'salary', 'description'];
  const filledCount = REQUIRED.filter((k) => form[k].trim?.() !== '' || form[k] !== '').length;
  const pct = (filledCount / REQUIRED.length) * 100;

  const canPost = filledCount === REQUIRED.length;

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      const uid = await AsyncStorage.getItem('uid');
      await postJob({ ...form, postedBy: uid });
      setPosted(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to post job. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const resetForm = () => {
    setForm(INITIAL);
    setPosted(false);
  };

  if (posted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={BLUE} />
        <View style={[styles.header, { justifyContent: 'flex-start', gap: 12 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Posted</Text>
        </View>
        <SuccessScreen
          onPostAnother={resetForm}
          onViewJob={() => navigation.navigate('Jobs')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Post a Job</Text>
          <Text style={styles.headerSub}>Find the right candidate fast</Text>
        </View>
        <View style={styles.headerDraftBtn}>
          <Text style={styles.headerDraftText}>Save Draft</Text>
        </View>
      </View>

      {/* Progress */}
      <ProgressBar pct={pct} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Section 1: Job Basics ── */}
          <SectionHeader icon="📋" title="Job Basics" subtitle="Required information" />

          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <FieldLabel required>Job Title</FieldLabel>
              <TextInput
                style={[styles.input, form.title && styles.inputFilled]}
                placeholder="e.g. Senior Site Engineer"
                placeholderTextColor={TEXT_LIGHT}
                value={form.title}
                onChangeText={(v) => set('title', v)}
              />
            </View>

            <DropdownField
              label="Job Category"
              required
              value={form.category}
              placeholder="Select category"
              options={CATEGORIES}
              onSelect={(v) => set('category', v)}
            />

            <RadioGroup
              label="Job Type"
              required
              options={JOB_TYPES}
              value={form.jobType}
              onChange={(v) => set('jobType', v)}
            />
          </View>

          {/* ── Section 2: Location & Requirements ── */}
          <SectionHeader icon="📍" title="Location & Requirements" />

          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <FieldLabel required>Job Location</FieldLabel>
              <TextInput
                style={[styles.input, form.location && styles.inputFilled]}
                placeholder="e.g. Ahmedabad, Gujarat"
                placeholderTextColor={TEXT_LIGHT}
                value={form.location}
                onChangeText={(v) => set('location', v)}
              />
            </View>

            <DropdownField
              label="Experience Required"
              required
              value={form.experience}
              placeholder="Select experience level"
              options={EXPERIENCE_OPTIONS}
              onSelect={(v) => set('experience', v)}
            />

            <View style={styles.fieldWrap}>
              <FieldLabel>Number of Openings</FieldLabel>
              <View style={styles.countRow}>
                <TouchableOpacity
                  style={styles.countBtn}
                  onPress={() => set('workers', String(Math.max(1, Number(form.workers) - 1)))}
                >
                  <Text style={styles.countBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.countInput}
                  value={form.workers}
                  onChangeText={(v) => set('workers', v.replace(/[^0-9]/g, '') || '1')}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.countBtn}
                  onPress={() => set('workers', String(Number(form.workers) + 1))}
                >
                  <Text style={styles.countBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.countLabel}>position{Number(form.workers) > 1 ? 's' : ''}</Text>
              </View>
            </View>
          </View>

          {/* ── Section 3: Compensation ── */}
          <SectionHeader icon="💰" title="Compensation" subtitle="Attract better candidates" />

          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <FieldLabel required>Salary / Wage</FieldLabel>
              <View style={styles.salaryRow}>
                <View style={styles.salaryPrefix}>
                  <Text style={styles.salaryPrefixText}>₹</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.salaryInput, form.salary && styles.inputFilled]}
                  placeholder="e.g. 45000"
                  placeholderTextColor={TEXT_LIGHT}
                  value={form.salary}
                  onChangeText={(v) => set('salary', v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                />
                <View style={styles.perToggle}>
                  {['Month', 'Day'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.perBtn, form.salaryPer === p && styles.perBtnActive]}
                      onPress={() => set('salaryPer', p)}
                    >
                      <Text style={[styles.perBtnText, form.salaryPer === p && styles.perBtnTextActive]}>
                        /{p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {form.salary ? (
                <Text style={styles.salaryPreview}>
                  ₹{Number(form.salary).toLocaleString('en-IN')}/{form.salaryPer === 'Month' ? 'mo' : 'day'}
                  {form.salaryPer === 'Month' ? `  ·  ₹${Math.round(Number(form.salary) / 26).toLocaleString('en-IN')}/day` : ''}
                </Text>
              ) : null}
            </View>
          </View>

          {/* ── Section 4: Job Details ── */}
          <SectionHeader icon="📝" title="Job Details" subtitle="Help candidates understand the role" />

          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <FieldLabel required>Job Description</FieldLabel>
              <TextInput
                style={[styles.input, styles.textarea, form.description && styles.inputFilled]}
                placeholder="Describe responsibilities, requirements, project details, site location, and what makes this role great..."
                placeholderTextColor={TEXT_LIGHT}
                value={form.description}
                onChangeText={(v) => set('description', v)}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{form.description.length}/500 characters</Text>
            </View>

            <SkillsInput
              skills={form.skills}
              onChange={(v) => set('skills', v)}
            />

            <View style={styles.fieldWrap}>
              <FieldLabel>Expected Start Date</FieldLabel>
              <TextInput
                style={[styles.input, form.startDate && styles.inputFilled]}
                placeholder="e.g. 15 July 2025 or Immediate"
                placeholderTextColor={TEXT_LIGHT}
                value={form.startDate}
                onChangeText={(v) => set('startDate', v)}
              />
            </View>
          </View>

          {/* ── Section 5: Contact ── */}
          <SectionHeader icon="📞" title="Contact Preference" />

          <View style={styles.card}>
            <RadioGroup
              label="How should candidates reach you?"
              options={CONTACT_OPTIONS}
              value={form.contactPref}
              onChange={(v) => set('contactPref', v)}
            />
          </View>

          {/* ── Validation hint ── */}
          {!canPost && (
            <View style={styles.validationHint}>
              <Text style={styles.validationIcon}>ℹ️</Text>
              <Text style={styles.validationText}>
                Fill in all required fields (*) to post your job
              </Text>
            </View>
          )}

          {/* ── Post Button ── */}
          <TouchableOpacity
            style={[styles.postBtn, (!canPost || posting) && styles.postBtnDim]}
            onPress={handlePost}
            disabled={!canPost || posting}
            activeOpacity={0.85}
          >
            {posting ? (
              <Text style={styles.postBtnText}>Publishing Job…</Text>
            ) : (
              <Text style={styles.postBtnText}>
                {canPost ? '🚀  Post Job Now' : `Complete ${REQUIRED.length - filledCount} more field${REQUIRED.length - filledCount > 1 ? 's' : ''} to post`}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Your job will be reviewed and live within minutes. Free for first 3 posts.
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREY_BG },

  // Header
  header: {
    backgroundColor: BLUE, flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 26, color: 'white', lineHeight: 30 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: 'white' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 1 },
  headerDraftBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  headerDraftText: { fontSize: 12, fontWeight: '700', color: 'white' },

  // Progress
  progressWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: BLUE },
  progressLabel: { fontSize: 11, fontWeight: '700', color: BLUE, width: 80, textAlign: 'right' },

  // Form
  formContent: { padding: 14, gap: 4 },

  // Section header
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 18, paddingBottom: 10, paddingHorizontal: 2,
  },
  sectionHeadIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: LIGHT_BLUE, alignItems: 'center', justifyContent: 'center',
  },
  sectionHeadTitle: { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  sectionHeadSub: { fontSize: 11, fontWeight: '500', color: TEXT_LIGHT, marginTop: 1 },

  // Card
  card: {
    backgroundColor: 'white', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    gap: 2,
  },

  // Fields
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: TEXT_MID, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: GREY_BG, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: TEXT_DARK, fontWeight: '500',
    borderWidth: 1.5, borderColor: BORDER,
  },
  inputFilled: { borderColor: `${BLUE}55`, backgroundColor: '#FAFBFF' },
  textarea: { minHeight: 120, paddingTop: 12 },
  charCount: { fontSize: 10, fontWeight: '600', color: TEXT_LIGHT, textAlign: 'right', marginTop: 4 },

  // Dropdown
  dropdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownValue: { fontSize: 15, color: TEXT_DARK, fontWeight: '500', flex: 1 },
  dropdownPlaceholder: { fontSize: 15, color: TEXT_LIGHT, flex: 1 },
  dropdownChevron: { fontSize: 16, color: TEXT_LIGHT },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '70%',
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK, marginBottom: 14, textAlign: 'center' },
  modalOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  modalOptionSelected: { backgroundColor: LIGHT_BLUE, borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -6 },
  modalOptionText: { fontSize: 14, fontWeight: '500', color: TEXT_DARK },

  // Radio
  radioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radioCard: {
    flex: 1, minWidth: '45%', borderRadius: 12, padding: 12, alignItems: 'center',
    backgroundColor: GREY_BG, borderWidth: 1.5, borderColor: BORDER,
    gap: 3,
  },
  radioCardSelected: { backgroundColor: LIGHT_BLUE, borderColor: BLUE },
  radioIcon: { fontSize: 20, marginBottom: 2 },
  radioKey: { fontSize: 13, fontWeight: '700', color: TEXT_MID },
  radioKeySelected: { color: BLUE },
  radioDesc: { fontSize: 10, fontWeight: '500', color: TEXT_LIGHT },
  radioCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9, backgroundColor: BLUE,
    alignItems: 'center', justifyContent: 'center',
  },
  radioCheckText: { fontSize: 10, fontWeight: '900', color: 'white' },

  // Worker count
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBtn: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: LIGHT_BLUE,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: BLUE,
  },
  countBtnText: { fontSize: 22, fontWeight: '700', color: BLUE, lineHeight: 26 },
  countInput: {
    width: 60, height: 40, borderRadius: 10, fontSize: 18, fontWeight: '800',
    color: TEXT_DARK, backgroundColor: GREY_BG, borderWidth: 1.5, borderColor: BORDER,
  },
  countLabel: { fontSize: 13, fontWeight: '600', color: TEXT_MID },

  // Salary
  salaryRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  salaryPrefix: {
    width: 44, height: 48, backgroundColor: GREY_BG,
    borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
    borderWidth: 1.5, borderRightWidth: 0, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  salaryPrefixText: { fontSize: 18, fontWeight: '700', color: TEXT_MID },
  salaryInput: {
    flex: 1, borderRadius: 0, borderLeftWidth: 0, borderRightWidth: 0,
  },
  perToggle: { flexDirection: 'column', borderWidth: 1.5, borderColor: BORDER, borderTopRightRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden' },
  perBtn: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: GREY_BG },
  perBtnActive: { backgroundColor: BLUE },
  perBtnText: { fontSize: 12, fontWeight: '700', color: TEXT_MID },
  perBtnTextActive: { color: 'white' },
  salaryPreview: { fontSize: 12, fontWeight: '700', color: GREEN, marginTop: 6 },

  // Skills
  skillInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  addSkillBtn: {
    width: 46, height: 46, borderRadius: 12, backgroundColor: BLUE,
    alignItems: 'center', justifyContent: 'center',
  },
  addSkillBtnDim: { backgroundColor: '#A0BFEE' },
  addSkillBtnText: { fontSize: 24, color: 'white', fontWeight: '300', lineHeight: 28 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: LIGHT_BLUE, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: `${BLUE}55`,
  },
  tagText: { fontSize: 13, fontWeight: '600', color: BLUE },
  tagRemove: { fontSize: 11, color: BLUE, fontWeight: '800' },
  suggestLabel: { fontSize: 11, fontWeight: '700', color: TEXT_LIGHT, marginBottom: 6 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  suggestChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, backgroundColor: GREY_BG,
    borderWidth: 1.5, borderColor: BORDER,
  },
  suggestText: { fontSize: 11, fontWeight: '600', color: TEXT_MID },

  // Validation
  validationHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FCD34D', marginTop: 6,
  },
  validationIcon: { fontSize: 16 },
  validationText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#92400E' },

  // Post button
  postBtn: {
    backgroundColor: BLUE, borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', marginTop: 14,
    shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  postBtnDim: { backgroundColor: '#A0BFEE', shadowOpacity: 0 },
  postBtnText: { fontSize: 16, fontWeight: '900', color: 'white' },
  footerNote: { fontSize: 12, color: TEXT_LIGHT, textAlign: 'center', marginTop: 10, lineHeight: 18 },

  // Success
  successWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, backgroundColor: 'white',
  },
  successIconWrap: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0FFF4',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 3, borderColor: '#C6F6D5',
  },
  successIcon: { fontSize: 52 },
  successTitle: { fontSize: 24, fontWeight: '900', color: TEXT_DARK, marginBottom: 10, textAlign: 'center' },
  successSub: { fontSize: 14, color: TEXT_MID, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  successStats: {
    flexDirection: 'row', gap: 12, marginBottom: 32,
    backgroundColor: GREY_BG, borderRadius: 16, padding: 16,
    width: '100%', borderWidth: 1, borderColor: BORDER,
  },
  successStat: { flex: 1, alignItems: 'center', gap: 4 },
  successStatIcon: { fontSize: 20 },
  successStatValue: { fontSize: 14, fontWeight: '900', color: BLUE },
  successStatLabel: { fontSize: 10, fontWeight: '600', color: TEXT_LIGHT, textAlign: 'center' },
  viewJobBtn: {
    backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', width: '100%', marginBottom: 12,
    shadowColor: BLUE, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  viewJobBtnText: { fontSize: 16, fontWeight: '900', color: 'white' },
  postAnotherBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    width: '100%', borderWidth: 1.5, borderColor: BLUE, backgroundColor: LIGHT_BLUE,
  },
  postAnotherText: { fontSize: 15, fontWeight: '700', color: BLUE },
});
