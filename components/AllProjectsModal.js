import { View, Text, TouchableOpacity, ScrollView, Image, Modal } from 'react-native';
import { injectFonts } from '../theme/typography';
import { formatAmountIndian } from '../utils/format';

const DARK   = '#262626';
const BG     = '#FAF9F5';
const FILL   = '#F2F2F2';
const BORDER = '#E5E5E5';
const LIGHT  = '#8E8E8E';

// Category + amount reads better than location for scanning a long list —
// "Residential · ₹18.5L" tells a client type + scale at a glance.
function projectSubline(p) {
  return [p.category, p.value ? formatAmountIndian(p.value) : null].filter(Boolean).join(' · ');
}

function ProjectRow({ project, bordered, onPress }) {
  const subline = projectSubline(project);
  const isOngoing = project.status === 'ongoing';
  return (
    <TouchableOpacity
      style={[s.row, bordered && s.rowBorder]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={s.thumb}>
        {project.photoUri ? (
          <Image source={{ uri: project.photoUri }} style={s.thumbImg} resizeMode="cover" />
        ) : (
          <Text style={s.thumbIcon}>🏗️</Text>
        )}
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{project.name || 'Untitled project'}</Text>
        {subline ? <Text style={s.meta} numberOfLines={1}>{subline}</Text> : null}
      </View>
      <View style={[s.badge, isOngoing ? s.badgeOngoing : s.badgeDone]}>
        <Text style={[s.badgeText, isOngoing ? s.badgeTextOngoing : s.badgeTextDone]}>
          {isOngoing ? 'ONGOING' : 'DONE'}
        </Text>
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// Full-screen "View all" list for a provider's Verified Projects — opened
// from the profile's 3-item preview. Tapping a row opens the same
// ProjectDetailModal the preview list uses (rendered by the caller, stacked
// on top of this modal, so closing it returns here).
export default function AllProjectsModal({ visible, projects = [], verifiedCount, onClose, onOpenProject }) {
  const totalCount = verifiedCount ?? projects.length;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.screen}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>Projects ({totalCount})</Text>
          <View style={{ width: 36 }} />
        </View>

        {projects.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>🏗️</Text>
            <Text style={s.emptyText}>No verified projects yet</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.listContent}>
            {projects.map((p, i) => (
              <ProjectRow
                key={i}
                project={p}
                bordered={i > 0}
                onPress={() => onOpenProject(p)}
              />
            ))}
          </ScrollView>
        )}
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: DARK, marginHorizontal: 8 },

  listContent: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 24 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  thumb: {
    width: 46, height: 46, borderRadius: 10,
    backgroundColor: FILL, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbIcon: { fontSize: 18, opacity: 0.5 },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: DARK, marginBottom: 2 },
  meta: { fontSize: 12, color: LIGHT, fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeOngoing: { backgroundColor: '#FFF3E0' },
  badgeDone: { backgroundColor: '#EAF7EF' },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  badgeTextOngoing: { color: '#B26A00' },
  badgeTextDone: { color: '#1E874B' },
  chevron: { fontSize: 18, color: '#B5B5B5', marginLeft: 2 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 10, opacity: 0.6 },
  emptyText: { fontSize: 14, color: LIGHT, fontWeight: '600', textAlign: 'center' },
});
