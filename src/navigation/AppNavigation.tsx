import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import ChildStatusScreen from '../screens/ChildStatusScreen';
import ChildStatusDetailScreen from '../screens/ChildStatusDetailScreen';
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

// Child Status Stack
const ChildStatusStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: {backgroundColor: '#fff'},
    }}>
    <Stack.Screen name="ChildStatus" component={ChildStatusScreen} />
    <Stack.Screen
      name="ChildStatusDetails"
      component={ChildStatusDetailScreen}
    />
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

// Main Tab Navigator - After user is logged in
const MainTabs: React.FC = () => {
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

          return <Ionicons name={iconName as any} size={size} color={color} />;
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
        component={ChildStatusStack}
        options={{
          title: isParent ? 'Child Status' : 'Children',
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
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigation: React.FC = () => {
  const {isAuthenticated, loading} = useAuth();

  if (loading) {
    return null; // or a splash screen
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigation;
