import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { injectFonts } from '../theme/typography';
import { auth } from '../config/firebase';
import { subscribeUnreadMessageCount } from '../services/chatService';
import UnreadBadge from './UnreadBadge';

const ORANGE = '#FF6B2B';

// The Profile tab has no fixed route of its own — which screen it opens
// depends on who's signed in and what profile type they have (or none yet),
// so it's always resolved by the caller via onProfilePress (see
// utils/profileNav.js's openMyProfile). 'Profile' here is a symbolic key
// used only to match the `active` prop for highlighting, never navigated to.
const TABS = [
  { icon: '🏠', label: 'Home',    screen: 'Home' },
  { icon: '🔍', label: 'Search',  screen: 'Search' },
  { icon: '💬', label: 'Chat',    screen: 'ChatList' },
  { icon: '👤', label: 'Profile', screen: 'Profile' },
];

export default function BottomNav({ navigation, active, onProfilePress }) {
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Chat tab badge — only for real signed-in accounts (guests have no live
  // Firestore chats to count). Live total, so it updates the moment a
  // message arrives or a conversation is marked read/deleted elsewhere.
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = subscribeUnreadMessageCount(auth.currentUser.uid, setUnreadMessages);
    return unsub;
  }, []);

  return (
    <View style={styles.nav}>
      {TABS.map(tab => {
        const isActive = active === tab.screen;
        const handlePress = () => {
          if (tab.label === 'Profile') {
            onProfilePress?.();
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
            <View style={styles.iconWrap}>
              {isActive ? (
                <View style={styles.activeIconWrap}>
                  <Text style={styles.icon}>{tab.icon}</Text>
                </View>
              ) : (
                <Text style={styles.icon}>{tab.icon}</Text>
              )}
              {tab.screen === 'ChatList' && <UnreadBadge count={unreadMessages} />}
            </View>
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
  iconWrap: { position: 'relative' },
  icon: { fontSize: 22 },
  label: { fontSize: 10, fontWeight: '600', color: '#888888' },
  labelActive: { color: ORANGE, fontWeight: '800' },
  activeIconWrap: {
    width: 40, height: 32, borderRadius: 8,
    backgroundColor: '#FFF3E0',
    alignItems: 'center', justifyContent: 'center',
  },
});
