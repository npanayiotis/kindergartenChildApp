// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Theme
import { theme } from './src/theme';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import ChildStatusListScreen from './src/screens/childStatus/ChildStatusListScreen';
import ChildStatusDetailScreen from './src/screens/childStatus/ChildStatusDetailScreen';
import BlogListScreen from './src/screens/blog/BlogListScreen';
import BlogDetailScreen from './src/screens/blog/BlogDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Child Status Stack
function ChildStatusStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChildStatusList"
        component={ChildStatusListScreen}
        options={{ title: 'Child Status' }}
      />
      <Stack.Screen
        name="ChildStatusDetail"
        component={ChildStatusDetailScreen}
        options={({ route }) => ({
          title: route.params?.childName || 'Child Status Details'
        })}
      />
    </Stack.Navigator>
  );
}

// Blog Stack
function BlogStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BlogList" component={BlogListScreen} options={{ title: 'Blog' }} />
      <Stack.Screen
        name="BlogDetail"
        component={BlogDetailScreen}
        options={({ route }) => ({
          title: route.params?.title || 'Blog Post'
        })}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator (after login)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="ChildStatus"
        component={ChildStatusStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Child Status',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-child" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Blog"
        component={BlogStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Blog',
          tabBarIcon: ({ color, size }) => (
            <Icon name="post" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Root navigator that handles auth flow
function RootNavigator() {
  const { token, isLoading } = useAuth();
  
  if (isLoading) {
    // You could return a loading screen here
    return null;
  }
  
  return (
    <NavigationContainer>
      {token ? (
        <MainTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

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
