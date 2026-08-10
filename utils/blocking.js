import { Alert } from 'react-native';
import { getProfile, blockUser } from '../services/userService';

// Resolves whether the CURRENT user (me) and a profile being viewed/chatted
// with (target) have a block between them, in EITHER direction — blocking
// only ever writes to the blocker's own doc (see userService.blockUser), so
// "mutual" is entirely a property of how this checks, not how it's stored.
//
// `targetBlockedUsers` is free: every caller (a profile screen, ChatScreen)
// already fetches the target's full profile for its own display purposes,
// and that fetch already includes blockedUsers. So the common case — they
// haven't blocked me — costs nothing extra; only when that first check is
// clear does this fetch MY OWN profile (a single cheap doc read) to check
// the other direction. Never a collection query, never re-run on every
// render — callers call this once per profile/chat load.
export async function checkMutualBlock(myUid, targetUid, targetBlockedUsers) {
  if (!myUid || !targetUid || myUid === targetUid) return false;
  if ((targetBlockedUsers || []).some(u => u.uid === myUid)) return true;
  try {
    const myProfile = await getProfile(myUid);
    return (myProfile?.blockedUsers || []).some(u => u.uid === targetUid);
  } catch (_) {
    return false;
  }
}

// Shared confirm-then-block flow for every "Block user" entry point (profile
// header overflow menus, chat header menu) so the confirmation copy and
// error handling never drift between them.
export function confirmBlockUser(myUid, targetUid, targetName, onBlocked) {
  Alert.alert(
    `Block ${targetName || 'this user'}?`,
    "You won't be able to see each other's profile or message.",
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(myUid, targetUid, targetName);
            onBlocked?.();
          } catch (err) {
            Alert.alert('Could Not Block', err.message || 'Something went wrong. Please try again.');
          }
        },
      },
    ]
  );
}
