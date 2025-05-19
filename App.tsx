// App.tsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider as PaperProvider} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Theme
import {theme} from './src/theme';

// Context
import {AuthProvider, useAuth} from './src/context/AuthContext';

// Types
import {
  ChildStatusStackParamList,
  BlogStackParamList,
  RootStackParamList,
  MainTabParamList,
} from './src/types/navigation';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import ChildStatusListScreen from './src/screens/childStatus/ChildStatusListScreen';
import ChildStatusDetailScreen from './src/screens/childStatus/ChildStatusDetailScreen';
import BlogListScreen from './src/screens/blog/BlogListScreen';
import BlogDetailScreen from './src/screens/blog/BlogDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();
const ChildStatusStack = createStackNavigator<ChildStatusStackParamList>();
const BlogStack = createStackNavigator<BlogStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Icon renderer functions
const renderChildStatusIcon = ({
  color,
  size,
}: {
  color: string;
  size: number;
}) => <Icon name="account-child" color={color} size={size} />;

const renderBlogIcon = ({color, size}: {color: string; size: number}) => (
  <Icon name="post" color={color} size={size} />
);

// Child Status Stack
const ChildStatusStackNavigator = () => {
  return (
    <ChildStatusStack.Navigator>
      <ChildStatusStack.Screen
        name="ChildStatusList"
        component={ChildStatusListScreen}
        options={{title: 'Child Status'}}
      />
      <ChildStatusStack.Screen
        name="ChildStatusDetail"
        component={ChildStatusDetailScreen}
        options={({route}) => ({
          title: route.params?.childName || 'Child Status Details',
        })}
      />
    </ChildStatusStack.Navigator>
  );
};

// Blog Stack
const BlogStackNavigator = () => {
  return (
    <BlogStack.Navigator>
      <BlogStack.Screen
        name="BlogList"
        component={BlogListScreen}
        options={{title: 'Blog'}}
      />
      <BlogStack.Screen
        name="BlogDetail"
        component={BlogDetailScreen}
        options={({route}) => ({
          title: route.params?.title || 'Blog Post',
        })}
      />
    </BlogStack.Navigator>
  );
};

// Main Tab Navigator (after login)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}>
      <Tab.Screen
        name="ChildStatus"
        component={ChildStatusStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Child Status',
          tabBarIcon: renderChildStatusIcon,
        }}
      />
      <Tab.Screen
        name="Blog"
        component={BlogStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Blog',
          tabBarIcon: renderBlogIcon,
        }}
      />
    </Tab.Navigator>
  );
};

// Root navigator that handles auth flow
const RootNavigator = () => {
  const {token, isLoading} = useAuth();

  if (isLoading) {
    // You could return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      {token ? (
        <MainTabs />
      ) : (
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
