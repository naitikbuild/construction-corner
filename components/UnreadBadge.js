import { View, Text } from 'react-native';
import { injectFonts } from '../theme/typography';

// Small red count badge, shared by the bottom-nav Chat tab and the Home
// header's notification bell (see BottomNav.js / HomeScreen.js) so both use
// the exact same size/color/position instead of two near-identical copies.
// Caller is responsible for giving the icon it sits on `position: 'relative'`
// — this renders `position: 'absolute'` against that nearest wrapper.
export default function UnreadBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <View style={s.badge}>
      <Text style={s.text} numberOfLines={1}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const s = injectFonts({
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 17, height: 17, borderRadius: 9,
    paddingHorizontal: 3,
    backgroundColor: '#E24B4A',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  text: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
});
