import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const BLUE = '#3B7DDD';

const TABS = [
  { icon: '🏠', label: 'Home',   screen: 'Home' },
  { icon: '🔍', label: 'Search', screen: 'Search' },
  { icon: '➕', label: 'Post',   screen: 'PostJob', post: true },
  { icon: '💬', label: 'Chat',   screen: 'ChatList' },
  { icon: '👤', label: 'Profile',screen: 'MyDashboard' },
];

export default function BottomNav({ navigation, active, onProfilePress }) {
  return (
    <View style={styles.nav}>
      {TABS.map(tab => {
        const isActive = active === tab.screen;
        const handlePress = () => {
          if (tab.label === 'Profile' && onProfilePress) {
            onProfilePress();
          } else {
            navigation.navigate(tab.screen);
          }
        };
        return (
          <TouchableOpacity
            key={tab.screen}
            style={styles.item}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            {tab.post ? (
              <View style={styles.postBtn}>
                <Text style={styles.postIcon}>➕</Text>
              </View>
            ) : (
              <Text style={styles.icon}>{tab.icon}</Text>
            )}
            <Text style={[styles.label, isActive && styles.labelActive, tab.post && styles.postLabel]}>
              {tab.label}
            </Text>
            {isActive && !tab.post && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    paddingTop: 8,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 12,
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  icon: { fontSize: 22 },
  label: { fontSize: 10, fontWeight: '600', color: '#BBBBBB' },
  labelActive: { color: BLUE, fontWeight: '800' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: BLUE, marginTop: 1 },
  postBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
    marginTop: -18, shadowColor: BLUE, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  postIcon: { fontSize: 20, color: '#fff' },
  postLabel: { color: BLUE, fontWeight: '700' },
});
