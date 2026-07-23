import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { injectFonts } from '../theme/typography';

const ORANGE = '#FF6B2B';

const TABS = [
  { icon: '🏠', label: 'Home',    screen: 'Home' },
  { icon: '🔍', label: 'Search',  screen: 'Search' },
  { icon: '💬', label: 'Chat',    screen: 'ChatList' },
  { icon: '👤', label: 'Profile', screen: 'MyDashboard' },
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
            {isActive ? (
              <View style={styles.activeIconWrap}>
                <Text style={styles.icon}>{tab.icon}</Text>
              </View>
            ) : (
              <Text style={styles.icon}>{tab.icon}</Text>
            )}
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = injectFonts({
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
});
