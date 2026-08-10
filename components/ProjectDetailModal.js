import { View, Text, TouchableOpacity, ScrollView, Image, Modal } from 'react-native';
import { injectFonts } from '../theme/typography';
import { formatAmountIndian } from '../utils/format';

const GREEN  = '#22A559';
const DARK   = '#262626';
const BG     = '#FAF9F5';
const FILL   = '#F2F2F2';
const BORDER = '#E5E5E5';
const MID    = '#737373';
const LIGHT  = '#8E8E8E';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function Field({ label, children }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// One cell of the compact 2-column detail grid (category/location/area/
// value/dates) — replaces stacked full-width fields so Work Photos below
// stays within the first screen without much scrolling.
function DetailCell({ label, value, green }) {
  return (
    <View style={s.detailCell}>
      <Text style={s.detailCellLabel}>{label}</Text>
      <Text style={[s.detailCellValue, green && s.readOnlyGreen]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// Read-only detail view for a single VERIFIED PROJECTS entry — deliberately
// styled to match CreateWorkRecordScreen's locked work-record view (grey
// banner, bordered read-only boxes) since that's the canonical "completed
// work record" design elsewhere in the app. Renders directly from whatever
// fields the project entry has; older/self-declared project entries won't
// have workArea/plannedStart/plannedFinish/reviews yet, so those show a
// placeholder instead of breaking.
export default function ProjectDetailModal({ visible, project, onClose, onViewPhoto }) {
  if (!project) return null;

  const isOngoing = project.status === 'ongoing';
  const photos = project.photoUri ? [project.photoUri] : [];
  const plannedStart = formatDate(project.plannedStart);
  const plannedFinish = formatDate(project.plannedFinish);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.screen}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Project Details</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={s.banner}>
            <Text style={s.bannerText}>🔒 Verified — read only</Text>
          </View>

          <View style={s.titleRow}>
            <Text style={s.projectName}>{project.name || 'Untitled project'}</Text>
            <View style={[s.badge, isOngoing ? s.badgeOngoing : s.badgeDone]}>
              <Text style={[s.badgeText, isOngoing ? s.badgeTextOngoing : s.badgeTextDone]}>
                {isOngoing ? 'ONGOING' : 'DONE'}
              </Text>
            </View>
          </View>

          {project.isPartnership ? (
            <View style={s.partnershipCard}>
              <Text style={s.partnershipTitle}>🤝 PARTNERSHIP</Text>
              <View style={s.partnershipRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.partnershipRole}>Lead Provider</Text>
                  <Text style={s.partnershipName} numberOfLines={1}>{project.providerName || 'Provider'}</Text>
                </View>
                <Text style={s.partnershipPct}>{project.providerSharePct ?? 0}%</Text>
                <Text style={s.partnershipAmt}>{formatAmountIndian(project.providerShareAmount)}</Text>
              </View>
              <View style={[s.partnershipRow, s.partnershipRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.partnershipRole}>Partner</Text>
                  <Text style={s.partnershipName} numberOfLines={1}>{project.partnerName || 'Partner'}</Text>
                </View>
                <Text style={s.partnershipPct}>{project.partnerSharePct ?? 0}%</Text>
                <Text style={s.partnershipAmt}>{formatAmountIndian(project.partnerShareAmount)}</Text>
              </View>
              <Text style={s.partnershipNote}>Shares are of the labour charge, split after the work is verified.</Text>
            </View>
          ) : null}

          <View style={s.detailGrid}>
            <DetailCell label="Category" value={project.category || '—'} />
            <DetailCell label="Location" value={project.location || '—'} />
            <DetailCell label="Work Area" value={project.workArea || 'Not added'} />
            <DetailCell
              label="Contract Value"
              value={project.value ? formatAmountIndian(project.value) : '—'}
              green={!!project.value}
            />
            <DetailCell label="Planned Start" value={plannedStart || '—'} />
            <DetailCell label="Planned Finish" value={plannedFinish || '—'} />
          </View>

          {project.keywords?.length > 0 ? (
            <View style={s.compactField}>
              <Text style={s.compactLabel}>Type of Work</Text>
              <View style={s.keywordTagsWrap}>
                {project.keywords.map((k, i) => (
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
                    onPress={() => onViewPhoto && onViewPhoto(photos, i)}
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

          <View style={s.divider} />

          <Text style={s.sectionLabel}>REVIEWS</Text>

          {/* This detail view intentionally shows only the client's review of
              the provider — the provider's review of the client still exists
              and is still shown elsewhere (e.g. the client's own profile /
              completed record), just not duplicated in this section. */}
          <Field label="Client's Review">
            <View style={s.readOnlyBox}>
              <Text style={project.clientReview ? s.readOnlyText : s.readOnlyMuted}>
                {project.clientReview || 'No review yet'}
              </Text>
            </View>
          </Field>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 20, fontWeight: '700', color: DARK },
  headerTitle: { fontSize: 15, fontWeight: '600', color: DARK },

  banner: {
    flexDirection: 'row', marginHorizontal: 14, marginTop: 10, marginBottom: 2, padding: 9,
    borderRadius: 10, backgroundColor: FILL, borderWidth: 1, borderColor: BORDER,
  },
  bannerText: { fontSize: 11, color: MID, fontWeight: '600', lineHeight: 15, flex: 1 },

  partnershipCard: {
    marginHorizontal: 14, marginTop: 8, padding: 12,
    borderRadius: 12, backgroundColor: '#EAF7EF', borderWidth: 1, borderColor: '#B7E4C7',
  },
  partnershipTitle: { fontSize: 10, fontWeight: '700', color: GREEN, letterSpacing: 0.6, marginBottom: 8 },
  partnershipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  partnershipRowBorder: { borderTopWidth: 1, borderTopColor: '#B7E4C7' },
  partnershipRole: { fontSize: 10, fontWeight: '600', color: '#1E874B' },
  partnershipName: { fontSize: 13, fontWeight: '700', color: DARK, marginTop: 1 },
  partnershipPct: { fontSize: 13, fontWeight: '700', color: GREEN, minWidth: 40, textAlign: 'right' },
  partnershipAmt: { fontSize: 13, fontWeight: '700', color: GREEN, minWidth: 68, textAlign: 'right' },
  partnershipNote: { fontSize: 10, color: '#1E874B', fontWeight: '500', lineHeight: 14, marginTop: 8 },

  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, marginTop: 8, gap: 10,
  },
  projectName: { fontSize: 17, fontWeight: '700', color: DARK, flex: 1 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  badgeOngoing: { backgroundColor: '#FFF3E0' },
  badgeDone: { backgroundColor: '#EAF7EF' },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  badgeTextOngoing: { color: '#B26A00' },
  badgeTextDone: { color: '#1E874B' },

  // ── Compact 2-column detail grid
  detailGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14,
    marginTop: 10, gap: 8,
  },
  detailCell: {
    width: '47.5%', backgroundColor: FILL, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  detailCellLabel: { fontSize: 10, fontWeight: '600', color: LIGHT, marginBottom: 2 },
  detailCellValue: { fontSize: 13, color: DARK, fontWeight: '600' },

  compactField: { paddingHorizontal: 14, marginTop: 14 },
  compactLabel: { fontSize: 12, fontWeight: '600', color: DARK, marginBottom: 6 },

  keywordTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordTag: {
    backgroundColor: '#EAF7EF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  keywordTagText: { fontSize: 12, fontWeight: '600', color: GREEN },

  fieldWrap: { paddingHorizontal: 14, marginTop: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: DARK, marginBottom: 8 },

  readOnlyBox: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: FILL,
  },
  readOnlyText: { fontSize: 14, color: DARK, fontWeight: '500' },
  readOnlyGreen: { color: GREEN, fontWeight: '700' },
  readOnlyMuted: { fontSize: 14, color: LIGHT, fontStyle: 'italic' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoSlot: { width: 92, height: 92, borderRadius: 10, overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%' },

  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 14, marginTop: 18, marginBottom: 4 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: LIGHT, letterSpacing: 0.8,
    paddingHorizontal: 14, marginTop: 12,
  },
});
