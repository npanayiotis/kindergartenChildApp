import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Alert,
} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import AppNavigation from './src/navigation/AppNavigation';
import FirebaseDebugScreen from './src/screens/FirebaseDebugScreen';

function App(): React.JSX.Element {
  const [showDebug, setShowDebug] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Initialize Firebase safely
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        console.log('[APP] Initializing Firebase...');

        // Dynamic import to handle errors better
        await import('./src/api/firebase');

        setFirebaseReady(true);
        console.log('[APP] Firebase initialized successfully');
      } catch (error) {
        console.error('[APP] Firebase initialization failed:', error);
        setFirebaseError(
          error instanceof Error ? error.message : 'Unknown error',
        );

        // Still allow app to continue with mock data
        setFirebaseReady(true);
      }
    };

    initializeFirebase();
  }, []);

  // Show loading until Firebase is ready
  if (!firebaseReady) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing App...</Text>
          {firebaseError && (
            <Text style={styles.errorText}>Warning: {firebaseError}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (showDebug) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.debugHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowDebug(false)}>
            <Text style={styles.backButtonText}>Back to App</Text>
          </TouchableOpacity>
        </View>
        <FirebaseDebugScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AuthProvider>
        <AppNavigation debugHandler={() => setShowDebug(true)} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
  },
  debugHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default App;
