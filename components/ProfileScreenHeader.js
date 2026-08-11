import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { injectFonts } from '../theme/typography';

const DARK = '#262626';

// Shared static header for the redesigned provider profile screens — back
// arrow (left) and an optional right action, both in light rounded-square
// buttons, with a centered title. Replaces the old per-screen auto-hiding
// floating nav bar (see hooks/useAutoHideHeader — still used by
// PersonalProfileScreen, just no longer by the provider profiles this
// header now covers) with a plain static header, per the new design.
export default function ProfileScreenHeader({ title, onBack, rightIcon, onRightPress }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F2" />
      <TouchableOpacity style={s.btn} onPress={onBack} activeOpacity={0.7}>
        <Text style={s.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={s.title} numberOfLines={1}>{title}</Text>
      {onRightPress ? (
        <TouchableOpacity style={s.btn} onPress={onRightPress} activeOpacity={0.7}>
          <Text style={s.rightIcon}>{rightIcon}</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.btn} />
      )}
    </View>
  );
}

const s = injectFonts({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 12, backgroundColor: '#F2F2F2',
  },
  btn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 20, fontWeight: '700', color: DARK },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: DARK, marginHorizontal: 8 },
  rightIcon: { fontSize: 18, color: DARK },
});
