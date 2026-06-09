import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
import SearchScreen from './screens/SearchScreen';

// Communication
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import NotificationsScreen from './screens/NotificationsScreen';

// Jobs & Tenders
import PostJobScreen from './screens/PostJobScreen';
import JobsScreen from './screens/JobsScreen';
import TenderScreen from './screens/TenderScreen';

// Professionals & Workers
import ProfessionalCategoryScreen from './screens/ProfessionalCategoryScreen';
import CategoryListScreen from './screens/CategoryListScreen';
import ProfessionalProfileScreen from './screens/ProfessionalProfileScreen';
import WorkerProfileScreen from './screens/WorkerProfileScreen';
import SupplierProfileScreen from './screens/SupplierProfileScreen';
import BusinessProfileScreen from './screens/BusinessProfileScreen';

// Materials & Orders
import MaterialMarketplaceScreen from './screens/MaterialMarketplaceScreen';
import OrderScreen from './screens/OrderScreen';

// Business & B2B
import B2BScreen from './screens/B2BScreen';

// User Features
import CoursesScreen from './screens/CoursesScreen';
import MyDashboardScreen from './screens/MyDashboardScreen';
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

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('uid').then(uid => {
      setInitialRoute(uid ? 'Home' : 'AccountType');
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1565C0" />
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
        <Stack.Screen name="Search" component={SearchScreen} />

        {/* Communication */}
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />

        {/* Jobs & Tenders */}
        <Stack.Screen name="PostJob" component={PostJobScreen} />
        <Stack.Screen name="Jobs" component={JobsScreen} />
        <Stack.Screen name="Tenders" component={TenderScreen} />

        {/* Professionals & Workers */}
        <Stack.Screen name="ProfessionalCategory" component={ProfessionalCategoryScreen} />
        <Stack.Screen name="CategoryList" component={CategoryListScreen} />
        <Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
        <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} />
        <Stack.Screen name="SupplierProfile" component={SupplierProfileScreen} />
        <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />

        {/* Materials & Orders */}
        <Stack.Screen name="MaterialMarketplace" component={MaterialMarketplaceScreen} />
        <Stack.Screen name="Order" component={OrderScreen} />

        {/* Business & B2B */}
        <Stack.Screen name="B2B" component={B2BScreen} />

        {/* User Features */}
        <Stack.Screen name="Courses" component={CoursesScreen} />
        <Stack.Screen name="MyDashboard" component={MyDashboardScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
