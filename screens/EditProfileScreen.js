import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Switch, Modal, FlatList, Animated, Alert,
} from 'react-native';
import { useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { saveProfile } from '../services/userService';

const BLUE = '#FF6B2B';
const LIGHT_BLUE = '#FFF3E0';
const GREY_BG = '#F5F5F0';
const BORDER = '#EFEFEF';
const TEXT_DARK = '#1A1A1A';
const TEXT_MID = '#666666';
const TEXT_LIGHT = '#888888';

// ─── Data ──────────────────────────────────────────────────────────────────

const LANGUAGES = ['Hindi', 'Gujarati', 'English', 'Marathi', 'Tamil', 'Telugu'];

const DESIGNATIONS = [
  'Architect', 'Civil Engineer', 'Interior Designer', 'Structural Engineer',
  'Project Manager', 'MEP Engineer', 'Urban Planner', 'Landscape Architect',
  'Quantity Surveyor', 'Construction Manager',
];

const WORKER_SKILLS = [
  'Mason', 'Electrician', 'Plumber', 'Carpenter', 'Painter',
  'Welder', 'Steel Fixer', 'Tiler', 'Waterproofing', 'Glass & Aluminium',
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
  { key: 'Professional', icon: '🏛️', label: 'Professional', sub: 'Architect, Engineer, Designer' },
  { key: 'Worker',       icon: '👷', label: 'Worker',       sub: 'Mason, Electrician, Plumber' },
  { key: 'Business',     icon: '🏢', label: 'Business',     sub: 'Contractor, Developer, Builder' },
  { key: 'Supplier',     icon: '🏭', label: 'Supplier',     sub: 'Cement, Steel, Tiles, RMC' },
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

const PROFESSIONAL_SERVICES = [
  'Architectural Design', 'Structural Design', 'Interior Design',
  'Project Management', 'Site Supervision', 'Vastu Consultation',
  'Green Building', '3D Visualization', 'MEP Design', 'Landscape Design',
  'Quantity Survey', 'Turnkey Projects',
];

const BUSINESS_SERVICES = [
  'Residential Construction', 'Commercial Construction', 'Industrial Construction',
  'Renovation & Interiors', 'Civil Works', 'Electrical & Plumbing',
  'Waterproofing', 'Painting', 'Flooring', 'Glass & Aluminum', 'HVAC',
];

const EQUIPMENT_LIST = [
  'JCB / Excavator', 'Crane', 'Concrete Mixer', 'Concrete Pump', 'Generator',
  'Scaffolding', 'Compactor / Roller', 'Transit Mixer', 'Tipper / Truck',
  'Tower Crane', 'Forklift', 'Drilling Machine',
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

function Dropdown({ label, required, value, options, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label} required={required}>
      <TouchableOpacity
        style={[styles.input, styles.dropdownTrigger]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={value ? { color: TEXT_DARK, fontSize: 15 } : { color: TEXT_LIGHT, fontSize: 15 }}>
          {value || `Select ${label}`}
        </Text>
        <Text style={styles.dropdownArrow}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, item === value && styles.modalOptionActive]}
                  onPress={() => { onSelect(item); setOpen(false); }}
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

function PhotoCircle({ label, emoji = '👤' }) {
  return (
    <View style={styles.photoCircleWrap}>
      <View style={styles.photoCircle}>
        <Text style={styles.photoEmoji}>{emoji}</Text>
        <View style={styles.cameraIcon}>
          <Text style={styles.cameraEmoji}>📷</Text>
        </View>
      </View>
      <Text style={styles.photoCircleLabel}>{label}</Text>
    </View>
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
      {!isCompany && <CoverPhoto />}
      <View style={styles.photoRow}>
        <PhotoCircle label={isCompany ? 'Company Logo' : 'Profile Photo'} emoji={isCompany ? '🏢' : '👤'} />
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

      {/* Location */}
      <Field label="Location" required>
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

      {/* Languages — only for personal profiles */}
      {!isCompany && (
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
  const toggleService = (s) => {
    const current = data.professionalServices || [];
    setData({
      ...data,
      professionalServices: current.includes(s)
        ? current.filter((x) => x !== s)
        : [...current, s],
    });
  };

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Professional Details</Text>
      <Text style={styles.stepSub}>Showcase your expertise to get more clients</Text>

      <Dropdown
        label="Designation"
        required
        value={data.designation}
        options={DESIGNATIONS}
        onSelect={(v) => setData({ ...data, designation: v })}
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

      <Field label="Degree / Qualification">
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

      <Field label="Services Offered">
        <View style={styles.tagsWrap}>
          {PROFESSIONAL_SERVICES.map((s) => (
            <SkillTag
              key={s}
              label={s}
              selected={(data.professionalServices || []).includes(s)}
              onPress={() => toggleService(s)}
            />
          ))}
        </View>
      </Field>

      <Field label="Pricing / Fees">
        <Input
          value={data.pricing}
          onChangeText={(v) => setData({ ...data, pricing: v })}
          placeholder="e.g. ₹500/sqft, ₹50,000/project"
        />
      </Field>

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

      <Field label="LinkedIn">
        <Input
          value={data.linkedin}
          onChangeText={(v) => setData({ ...data, linkedin: v })}
          placeholder="linkedin.com/in/yourprofile"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Instagram">
        <Input
          value={data.instagram}
          onChangeText={(v) => setData({ ...data, instagram: v })}
          placeholder="@yourhandle"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Behance">
        <Input
          value={data.behance}
          onChangeText={(v) => setData({ ...data, behance: v })}
          placeholder="behance.net/yourprofile"
          autoCapitalize="none"
        />
      </Field>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Step 3: Worker Details ──────────────────────────────────────────────────

function Step3Worker({ data, setData }) {
  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Worker Details</Text>
      <Text style={styles.stepSub}>Find the right jobs matching your skills</Text>

      <Dropdown
        label="Skill Type"
        required
        value={data.workerSkill}
        options={WORKER_SKILLS}
        onSelect={(v) => setData({ ...data, workerSkill: v })}
      />

      <Field label="Experience (Years)" required>
        <Input
          value={data.workerExperience}
          onChangeText={(v) => setData({ ...data, workerExperience: v })}
          placeholder="e.g. 5"
          keyboardType="number-pad"
        />
      </Field>

      <Field label="Daily Wage Expectation (₹)">
        <View style={styles.currencyRow}>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencySign}>₹</Text>
          </View>
          <Input
            style={{ flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 }}
            value={data.dailyWage}
            onChangeText={(v) => setData({ ...data, dailyWage: v })}
            placeholder="e.g. 800"
            keyboardType="number-pad"
          />
        </View>
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
  const isRentals = data.role === 'rentals';

  const toggleMaterial = (mat) => {
    const current = data.materials || [];
    setData({
      ...data,
      materials: current.includes(mat)
        ? current.filter((m) => m !== mat)
        : [...current, mat],
    });
  };

  const toggleEquipment = (eq) => {
    const current = data.equipment || [];
    setData({
      ...data,
      equipment: current.includes(eq)
        ? current.filter((e) => e !== eq)
        : [...current, eq],
    });
  };

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{isRentals ? 'Rental Details' : 'Supplier Details'}</Text>
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

      {isRentals ? (
        <Field label="Equipment Available" required>
          <View style={styles.materialGrid}>
            {EQUIPMENT_LIST.map((eq) => (
              <Checkbox
                key={eq}
                label={eq}
                checked={(data.equipment || []).includes(eq)}
                onPress={() => toggleEquipment(eq)}
              />
            ))}
          </View>
        </Field>
      ) : (
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
      )}

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
  const emojiMap = { professional: '🏛️', worker: '👷', business: '🏢', supplier: '🏭', Professional: '🏛️', Worker: '👷', Business: '🏢', Supplier: '🏭' };
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
        <ReviewRow icon="📍" label="Location" value={[data.city, data.state].filter(Boolean).join(', ')} />
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
          <ReviewRow icon="🎓" label="Designation" value={data.designation} />
          <ReviewRow icon="🏛️" label="Employment" value={data.selfEmployed} />
          <ReviewRow icon="📅" label="Experience" value={data.experience ? `${data.experience} years` : ''} />
          <ReviewRow icon="🪪" label="Reg. Number" value={data.regNumber} />
          <ReviewRow icon="🔧" label="Services" value={(data.professionalServices || []).slice(0, 3).join(', ')} />
          <ReviewRow icon="💰" label="Pricing" value={data.pricing} />
        </ReviewCard>
      )}

      {/* Worker */}
      {(pt === 'worker' || pt === 'Worker') && (
        <ReviewCard title="Worker Details" onEdit={() => onEdit(detailStep)}>
          <ReviewRow icon="🔧" label="Skill" value={data.workerSkill} />
          <ReviewRow icon="📅" label="Experience" value={data.workerExperience ? `${data.workerExperience} years` : ''} />
          <ReviewRow icon="💰" label="Daily Wage" value={data.dailyWage ? `₹${data.dailyWage}/day` : ''} />
          <ReviewRow icon="✅" label="Available" value={data.available ? 'Yes' : 'No'} />
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
  const phone = route?.params?.phone || '';
  const profileType = route?.params?.profileType || null;
  const roleParam = route?.params?.role || '';

  // When coming from BusinessTypeScreen: 3 steps (Basic → Details → Review)
  // Original flow: 4 steps (Basic → Role → Details → Review)
  const TOTAL_STEPS = profileType ? 3 : 4;
  const PROGRESS_LABELS = profileType
    ? ['Basic Info', 'Details', 'Review']
    : ['Basic Info', 'Role', 'Details', 'Review'];

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    phone,
    profileType: profileType || '',
    role: roleParam,
    // personal
    name: '',
    city: '',
    state: '',
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
    professionalServices: [],
    pricing: '',
    website: '',
    linkedin: '',
    instagram: '',
    behance: '',
    // worker
    workerSkill: '',
    workerExperience: '',
    dailyWage: '',
    available: true,
    workerAbout: '',
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
    equipment: [],
    deliveryRadius: '',
    minOrder: '',
    paymentTerms: '',
    supplierAbout: '',
    supplierWebsite: '',
  });

  const canProceed = () => {
    if (step === 1) {
      const isCompany = profileType === 'business' || profileType === 'supplier';
      const primaryName = isCompany ? data.companyName : data.name;
      return primaryName.trim().length > 0 && data.city.trim().length > 0;
    }
    // Original flow step 2: role selection
    if (!profileType && step === 2) return data.role.length > 0;
    // Detail step
    const detailStep = profileType ? 2 : 3;
    if (step === detailStep) {
      const pt = profileType || data.role;
      if (pt === 'professional' || pt === 'Professional') return data.designation.length > 0;
      if (pt === 'worker'       || pt === 'Worker')       return data.workerSkill.length > 0;
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
    business: 'BusinessProfile',
    supplier: 'SupplierProfile',
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) throw new Error('Not logged in');

      const pt = (profileType || data.role || '').toLowerCase();
      const displayName = (pt === 'business' || pt === 'supplier')
        ? (data.companyName || data.name || '')
        : (data.name || '');

      const profileData = {
        ...data,
        profileType: pt,
        role: data.role || profileType || '',
        phone: data.phone || (await AsyncStorage.getItem('phone')) || '',
        category: data.designation || data.workerSkill || data.supplierCategory || '',
        ccScore: 500,
        createdAt: new Date().toISOString(),
      };
      await saveProfile(uid, profileData);

      // Cache user name so other screens can show it quickly
      if (displayName) await AsyncStorage.setItem('userName', displayName);

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

  return (
    <View style={styles.container}>
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
      <View style={styles.bottomNav}>
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
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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

  // Phone
  phonePreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0FFF4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: '#C6F6D5',
  },
  phoneFlag: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  phoneValue: { flex: 1, fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  phoneLocked: { fontSize: 11, fontWeight: '700', color: '#38A169' },

  // Location
  locationRow: { flexDirection: 'row', gap: 10 },

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
  dropdownArrow: { fontSize: 16, color: TEXT_LIGHT },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '70%',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK, marginBottom: 16, textAlign: 'center' },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalOptionActive: { backgroundColor: LIGHT_BLUE, borderRadius: 8, paddingHorizontal: 8 },
  modalOptionText: { fontSize: 14, fontWeight: '500', color: TEXT_DARK },

  // Skill Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 32,
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
  nextBtnDisabled: { backgroundColor: '#FFCBA8' },
  nextBtnText: { fontSize: 16, fontWeight: '900', color: 'white' },
});
