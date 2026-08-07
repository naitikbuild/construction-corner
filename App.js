import { useState, useEffect } from 'react';
import { View, ActivityIndicator, BackHandler } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { auth } from './config/firebase';

// Auth & Onboarding
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AccountTypeScreen from './screens/AccountTypeScreen';
import BusinessTypeScreen from './screens/BusinessTypeScreen';

// Core
import HomeScreen from './screens/HomeScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import PersonalProfileSetupScreen from './screens/PersonalProfileSetupScreen';
import SearchScreen from './screens/SearchScreen';

// Communication
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import EnquiryScreen from './screens/EnquiryScreen';

// Professionals & Workers
import ProfessionalCategoryScreen from './screens/ProfessionalCategoryScreen';
import CategoryListScreen from './screens/CategoryListScreen';
import ProfessionalProfileScreen from './screens/ProfessionalProfileScreen';
import WorkerProfileScreen from './screens/WorkerProfileScreen';
import ContractorProfileScreen from './screens/ContractorProfileScreen';
import SupplierProfileScreen from './screens/SupplierProfileScreen';
import BusinessProfileScreen from './screens/BusinessProfileScreen';

// User Features
import PersonalProfileScreen from './screens/PersonalProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import ClientReviewsScreen from './screens/ClientReviewsScreen';

// Verified Work System — legacy pending_work/verified_work flow. Still used
// by SettingsScreen (Work History) and ReviewsListScreen; MarkWorkComplete
// and LeaveReview were removed as fully-orphaned once Business/Supplier
// moved to work_records (see workRecordService.js). ConfirmWorkScreen is
// registered here but currently has no reachable entry point — the
// NotificationsScreen 'work_confirm' tap route that used to open it was
// removed because no code ever wrote that notification type; kept
// registered rather than deleted in case it's wired back up.
import ConfirmWorkScreen from './screens/ConfirmWorkScreen';
import WorkHistoryScreen from './screens/WorkHistoryScreen';
import CommissionWalletScreen from './screens/CommissionWalletScreen';
import ReviewsListScreen from './screens/ReviewsListScreen';

// Work Record System — now the verified-work system for all five provider
// types (Worker/Contractor/Professional/Business/Supplier).
import CreateWorkRecordScreen from './screens/CreateWorkRecordScreen';
import WorkStartApprovalScreen from './screens/WorkStartApprovalScreen';
import ClientWorkRecordReviewScreen from './screens/ClientWorkRecordReviewScreen';
import RateWorkRecordScreen from './screens/RateWorkRecordScreen';
import RateClientScreen from './screens/RateClientScreen';
import MyWorkRecordsScreen from './screens/MyWorkRecordsScreen';

// Legal & Info (Play Store required)
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsScreen from './screens/TermsScreen';
import AboutScreen from './screens/AboutScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Firebase auth is the source of truth for whether there's a session — not
  // AsyncStorage's cached 'uid' alone. auth.currentUser is null for a brief
  // "rehydration window" right after launch while Firebase restores the
  // persisted session, so the initial route must wait for the FIRST
  // onAuthStateChanged callback (whether it resolves to a user or not)
  // instead of deciding immediately from the cache. The listener stays
  // subscribed for the app's lifetime after that so AsyncStorage's 'uid'
  // never drifts from the live Firebase uid — every subsequent sign-in
  // re-syncs it here too.
  useEffect(() => {
    let decidedInitialRoute = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Live Firebase session — keep the cache in sync and always treat
          // this as signed in, regardless of what the cache held before.
          await AsyncStorage.setItem('uid', user.uid);
          if (!decidedInitialRoute) setInitialRoute('Home');
        } else if (!decidedInitialRoute) {
          // No live Firebase user — the app is browse-first, so this is NOT
          // a reason to block on account creation. Once the welcome/
          // onboarding screens have been seen, every subsequent launch goes
          // straight to Home; account type / sign in only ever come up when
          // the user taps something that actually needs an account (see
          // utils/authGate.js's requireSignIn, used when opening a full
          // provider profile).
          const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
          setInitialRoute(hasSeenOnboarding ? 'Home' : 'Login');
        }
      } catch (_) {
        if (!decidedInitialRoute) setInitialRoute('Home');
      } finally {
        decidedInitialRoute = true;
      }
    });

    return unsubscribe;
  }, []);

  if (!initialRoute || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF6B2B" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
        {/* Auth & Onboarding */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="AccountType" component={AccountTypeScreen} />
        <Stack.Screen name="BusinessType" component={BusinessTypeScreen} />

        {/* Core */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="PersonalProfileSetup" component={PersonalProfileSetupScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />

        {/* Communication */}
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Enquiry" component={EnquiryScreen} />

        {/* Professionals & Workers */}
        <Stack.Screen name="ProfessionalCategory" component={ProfessionalCategoryScreen} />
        <Stack.Screen name="CategoryList" component={CategoryListScreen} />
        <Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
        <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} />
        <Stack.Screen name="ContractorProfile" component={ContractorProfileScreen} />
        <Stack.Screen name="SupplierProfile" component={SupplierProfileScreen} />
        <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />

        {/* User Features */}
        <Stack.Screen name="PersonalProfile" component={PersonalProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ClientReviews" component={ClientReviewsScreen} />

        {/* Verified Work System (legacy — see import comment above) */}
        <Stack.Screen name="ConfirmWork" component={ConfirmWorkScreen} />
        <Stack.Screen name="WorkHistory" component={WorkHistoryScreen} />
        <Stack.Screen name="CommissionWallet" component={CommissionWalletScreen} />
        <Stack.Screen name="ReviewsList" component={ReviewsListScreen} />

        {/* Work Record System */}
        <Stack.Screen name="CreateWorkRecord" component={CreateWorkRecordScreen} />
        <Stack.Screen name="WorkStartApproval" component={WorkStartApprovalScreen} />
        <Stack.Screen name="WorkRecordReview" component={ClientWorkRecordReviewScreen} />
        <Stack.Screen name="RateWorkRecord" component={RateWorkRecordScreen} />
        <Stack.Screen name="RateClient" component={RateClientScreen} />
        <Stack.Screen name="MyWorkRecords" component={MyWorkRecordsScreen} />

        {/* Legal & Info */}
        <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
