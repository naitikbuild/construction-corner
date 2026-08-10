import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { injectFonts } from '../theme/typography';

const DARK   = '#262626';
const BG     = '#FAF9F5';
const FILL   = '#F2F2F2';
const BORDER = '#E5E5E5';
const LIGHT  = '#8E8E8E';

// Replaces a profile screen's ENTIRE body — no profile content, no Call/
// Chat/Enquiry — whenever a mutual block exists between the viewer and the
// profile owner, in either direction (see utils/blocking.checkMutualBlock).
// Deliberately doesn't say who blocked whom — that's not useful information
// for either side and just invites an argument in the reviews/DMs.
export default function BlockedProfileNotice({ onBack }) {
  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.center}>
        <Text style={s.icon}>🚫</Text>
        <Text style={s.title}>This profile is not available</Text>
        <Text style={s.sub}>You can't view this profile or message this user.</Text>
      </View>
    </View>
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
  backBtnText: { fontSize: 20, fontWeight: '700', color: DARK },
  headerTitle: { fontSize: 15, fontWeight: '600', color: DARK },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
  icon: { fontSize: 44, marginBottom: 6, opacity: 0.7 },
  title: { fontSize: 16, fontWeight: '700', color: DARK, textAlign: 'center' },
  sub: { fontSize: 13, color: LIGHT, fontWeight: '500', textAlign: 'center', lineHeight: 19 },
});
