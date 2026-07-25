import { useState, useEffect } from 'react';
import { View, ActivityIndicator, BackHandler } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
import MyDashboardScreen from './screens/MyDashboardScreen';
import PersonalProfileScreen from './screens/PersonalProfileScreen';
import BookmarksScreen from './screens/BookmarksScreen';
import SettingsScreen from './screens/SettingsScreen';

// Rentals
import RentalsScreen from './screens/RentalsScreen';

// Verified Work System
import MarkWorkCompleteScreen from './screens/MarkWorkCompleteScreen';
import ConfirmWorkScreen from './screens/ConfirmWorkScreen';
import WorkHistoryScreen from './screens/WorkHistoryScreen';
import CommissionWalletScreen from './screens/CommissionWalletScreen';
import LeaveReviewScreen from './screens/LeaveReviewScreen';
import ReviewsListScreen from './screens/ReviewsListScreen';

// Work Record System (replaces MarkWorkComplete/ConfirmWork — in progress)
import CreateWorkRecordScreen from './screens/CreateWorkRecordScreen';

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

  useEffect(() => {
    determineInitialRoute();
  }, []);

  const determineInitialRoute = async () => {
    try {
      const uid = await AsyncStorage.getItem('uid');
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

      if (uid) {
        setInitialRoute('Home');
      } else if (!hasSeenOnboarding) {
        setInitialRoute('Login'); // LoginScreen handles onboarding internally
      } else {
        setInitialRoute('AccountType');
      }
    } catch (_) {
      setInitialRoute('AccountType');
    }
  };

  if (!initialRoute || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF6B2B" />
      </View>
    );
  }

  return (
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
        <Stack.Screen name="MyDashboard" component={MyDashboardScreen} />
        <Stack.Screen name="PersonalProfile" component={PersonalProfileScreen} />
        <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />

        {/* Rentals */}
        <Stack.Screen name="Rentals" component={RentalsScreen} />

        {/* Verified Work System */}
        <Stack.Screen name="MarkWorkComplete" component={MarkWorkCompleteScreen} />
        <Stack.Screen name="ConfirmWork" component={ConfirmWorkScreen} />
        <Stack.Screen name="WorkHistory" component={WorkHistoryScreen} />
        <Stack.Screen name="CommissionWallet" component={CommissionWalletScreen} />
        <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} />
        <Stack.Screen name="ReviewsList" component={ReviewsListScreen} />

        {/* Work Record System */}
        <Stack.Screen name="CreateWorkRecord" component={CreateWorkRecordScreen} />

        {/* Legal & Info */}
        <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
