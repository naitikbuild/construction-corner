import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

// Single source of truth for "who is the current user", used everywhere a
// screen needs to resolve the signed-in uid (chat/message gates, work
// records, profile screens, ...). Always prefers the live Firebase session —
// the cached AsyncStorage copy can go stale (a leftover guest id from before
// sign-in, or briefly out of date during the auth-rehydration window right
// after app launch) — and only falls back to the cache when there is no live
// Firebase user at all, which is the normal case for guest sessions (guests
// never have an auth.currentUser to begin with).
export async function getCurrentUid() {
  return auth.currentUser?.uid || (await AsyncStorage.getItem('uid'));
}

// True when there's no real signed-in identity: no live Firebase user AND
// either no cached uid or a guest_-prefixed one. Used to gate actions (like
// starting a chat) that require a real account.
export function isGuestUid(uid) {
  return !uid || uid.startsWith('guest_');
}
