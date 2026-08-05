import { Alert } from 'react-native';
import { auth } from '../config/firebase';

// The app is browse-first: Home, category listings, search, and result
// rows/cards are all open to everyone. The one gate is OPENING a full
// provider profile (or the viewer's own profile before they have an
// account) — that requires a real signed-in Firebase account, not just a
// cached/guest uid. A not-signed-in tap shows a sign in/up prompt instead of
// navigating, and remembers where the user was headed so LoginScreen can
// send them straight there once they're authenticated.
//
// Returns true if navigation happened (already signed in), false if the
// prompt was shown instead.
export function requireSignIn(navigation, { screen, params, title, message } = {}) {
  if (auth.currentUser) {
    if (screen) navigation.navigate(screen, params);
    return true;
  }

  const redirectTo = screen ? { screen, params } : undefined;
  Alert.alert(
    title || 'Sign in required',
    message || 'Create a free account or sign in to continue.',
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Sign In',
        onPress: () => navigation.navigate('Login', { initialScreen: 'login', redirectTo }),
      },
      {
        text: 'Sign Up',
        onPress: () => navigation.navigate('AccountType', { redirectTo }),
      },
    ]
  );
  return false;
}

// Specifically for tapping a provider row/card to open their full profile.
export function openProviderProfile(navigation, screen, params) {
  return requireSignIn(navigation, {
    screen,
    params,
    title: 'Sign in to view profile',
    message: 'Create a free account or sign in to see full provider profiles.',
  });
}
