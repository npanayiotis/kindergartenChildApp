import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';

// Import our centralized icon provider
import {TabBarIcon} from '../utils/IconProvider';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import ChildActivitiesScreen from '../screens/ChildActivitiesScreen';
import BlogScreen from '../screens/BlogScreen';
import BlogPostDetailsScreen from '../screens/BlogPostDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Import auth context
import {useAuth} from '../context/AuthContext';
import {RootStackParamList} from '../types';

// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();

// Auth Stack - screens when user is not logged in
const AuthStack: React.FC = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// Child Activities Stack
const ChildActivitiesStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: {backgroundColor: '#fff'},
    }}>
    <Stack.Screen name="ChildActivities" component={ChildActivitiesScreen} />
  </Stack.Navigator>
);

// Blog Stack
const BlogStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: {backgroundColor: '#fff'},
    }}>
    <Stack.Screen name="BlogList" component={BlogScreen} />
    <Stack.Screen name="BlogPostDetails" component={BlogPostDetailsScreen} />
  </Stack.Navigator>
);

interface MainTabsProps {
  debugHandler: () => void;
}

// Main Tab Navigator - After user is logged in
const MainTabs: React.FC<MainTabsProps> = ({debugHandler}) => {
  const {isParent} = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string = 'help-circle';

          if (route.name === 'Status') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Blog') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <TabBarIcon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4a80f5',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingVertical: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          paddingBottom: 5,
        },
      })}>
      <Tab.Screen
        name="Status"
        component={ChildActivitiesStack}
        options={{
          title: isParent ? 'Activities' : 'All Activities',
        }}
      />
      <Tab.Screen
        name="Blog"
        component={BlogStack}
        options={{
          title: 'Blog Posts',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
        initialParams={{debugHandler}}
      />
    </Tab.Navigator>
  );
};

interface AppNavigationProps {
  debugHandler: () => void;
}

// Main App Navigator
const AppNavigation: React.FC<AppNavigationProps> = ({debugHandler}) => {
  const {isAuthenticated, loading} = useAuth();

  if (loading) {
    return null; // or a splash screen
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainTabs debugHandler={debugHandler} />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default AppNavigation;
