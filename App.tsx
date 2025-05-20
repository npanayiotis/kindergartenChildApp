import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import AppNavigation from './src/navigation/AppNavigation';
import FirebaseDebugScreen from './src/screens/FirebaseDebugScreen';
import {logFirebaseEnvironment} from './src/utils/firebaseDebug';

function App(): React.JSX.Element {
  const [showDebug, setShowDebug] = useState(false);

  // Run a Firebase status check at startup
  useEffect(() => {
    // Log Firebase environment info on app start
    logFirebaseEnvironment();
  }, []);

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
        <AppNavigation />
        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => setShowDebug(true)}>
          <Text style={styles.debugButtonText}>Debug</Text>
        </TouchableOpacity>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  debugButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
