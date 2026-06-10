import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ORANGE = '#FF6B2B';

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
            ) : isActive ? (
              <View style={styles.activeIconWrap}>
                <Text style={styles.icon}>{tab.icon}</Text>
              </View>
            ) : (
              <Text style={styles.icon}>{tab.icon}</Text>
            )}
            <Text style={[styles.label, isActive && styles.labelActive, tab.post && styles.postLabel]}>
              {tab.label}
            </Text>
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
    borderTopColor: '#EFEFEF',
    paddingTop: 8,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 12,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  icon: { fontSize: 22 },
  label: { fontSize: 10, fontWeight: '600', color: '#888888' },
  labelActive: { color: ORANGE, fontWeight: '800' },
  activeIconWrap: {
    width: 40, height: 32, borderRadius: 8,
    backgroundColor: '#FFF3E0',
    alignItems: 'center', justifyContent: 'center',
  },
  postBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center',
    marginTop: -18,
    shadowColor: ORANGE, shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  postIcon: { fontSize: 20, color: '#fff' },
  postLabel: { color: ORANGE, fontWeight: '700' },
});
