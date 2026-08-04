import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { getProfile } from '../services/userService';
import { requireSignIn } from './authGate';

const PROFILE_SCREEN_MAP = {
  worker: 'WorkerProfile',
  contractor: 'ContractorProfile',
  professional: 'ProfessionalProfile',
  business: 'BusinessProfile',
  supplier: 'SupplierProfile',
  personal: 'PersonalProfile',
};

// Resolves and opens the CURRENT user's own profile — used by the bottom-nav
// Profile tab (see components/BottomNav.js) and anywhere else that needs a
// "go to my profile" action. There is no in-between dashboard screen: a
// signed-in user with a completed profile lands on their real profile
// screen; one who's authenticated (or has a local guest profile) but hasn't
// finished picking an account type / building a profile yet is sent into
// that setup flow instead. A visitor with no session at all sees the
// sign-in/sign-up gate.
export async function openMyProfile(navigation) {
  try {
    const user = auth.currentUser;
    let uid, profile;
    if (user) {
      uid = user.uid;
      profile = await getProfile(uid);
    } else {
      uid = await AsyncStorage.getItem('uid');
      if (!uid) {
        requireSignIn(navigation, { title: 'Sign in to view profile', message: 'Create a free account or sign in to set up your profile.' });
        return;
      }
      const local = await AsyncStorage.getItem('localProfile');
      if (!local) {
        requireSignIn(navigation, { title: 'Sign in to view profile', message: 'Create a free account or sign in to set up your profile.' });
        return;
      }
      profile = JSON.parse(local);
    }

    const screen = PROFILE_SCREEN_MAP[profile?.profileType];
    if (screen) {
      navigation.navigate(screen, { uid });
    } else {
      // Signed in but no account type/profile completed yet — send them into
      // account-type selection instead of a dead-end dashboard screen.
      navigation.navigate('AccountType');
    }
  } catch (_) {
    navigation.navigate('Home');
  }
}
