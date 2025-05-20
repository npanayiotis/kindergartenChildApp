import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  checkAuthStatus,
  checkFirestorePermissions,
  logFirebaseStatus,
} from '../utils/firebaseDebug';
import {auth, firestore} from '../../firebaseRN';

const FirebaseDebugScreen = () => {
  const [authStatus, setAuthStatus] = useState('Not checked');
  const [firestoreStatus, setFirestoreStatus] = useState('Not checked');
  const [lastError, setLastError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  // Check Firebase status on mount
  useEffect(() => {
    checkFirebaseStatus();
  }, []);

  // General Firebase status check
  const checkFirebaseStatus = async () => {
    try {
      setDebugInfo({});

      // Log Firebase app initialization
      const appStatus = logFirebaseStatus();
      setDebugInfo(prev => ({...prev, appInitialized: appStatus}));

      // Check auth status
      const isAuthenticated = await checkAuthStatus();
      setAuthStatus(isAuthenticated ? 'Authenticated' : 'Not authenticated');

      // Only check Firestore if authenticated
      if (isAuthenticated) {
        const hasPermissions = await checkFirestorePermissions();
        setFirestoreStatus(
          hasPermissions ? 'Permissions OK' : 'Permission denied',
        );
      }

      setLastError(null);
    } catch (error) {
      console.error('Firebase debug check error:', error);
      setLastError(error.message);
      Alert.alert('Error', `Firebase check failed: ${error.message}`);
    }
  };

  // Test specific Firebase auth operations
  const testAuth = async () => {
    try {
      Alert.alert(
        'Auth Test',
        'To test authentication, you need to sign in. Enter credentials in your app.',
      );
    } catch (error) {
      console.error('Auth test error:', error);
      setLastError(error.message);
      Alert.alert('Auth Error', error.message);
    }
  };

  // Test specific Firebase Firestore operations
  const testFirestore = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert(
          'Not Authenticated',
          'Please sign in first to test Firestore',
        );
        return;
      }

      // Try to read childStatus collection
      const childStatusQuery = await firestore
        .collection('childStatus')
        .limit(5)
        .get();

      let message = `Found ${childStatusQuery.size} child status records\n`;

      if (!childStatusQuery.empty) {
        message += 'First record: \n';
        const firstDoc = childStatusQuery.docs[0];
        message += `ID: ${firstDoc.id}\n`;
        message += `Data: ${JSON.stringify(firstDoc.data(), null, 2)}`;
      }

      Alert.alert('Firestore Test Result', message);
    } catch (error) {
      console.error('Firestore test error:', error);
      setLastError(error.message);
      Alert.alert('Firestore Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Firebase Debug</Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Authentication:</Text>
          <Text
            style={[
              styles.statusValue,
              {
                color:
                  authStatus === 'Authenticated'
                    ? 'green'
                    : authStatus === 'Not checked'
                    ? 'gray'
                    : 'red',
              },
            ]}>
            {authStatus}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Firestore Access:</Text>
          <Text
            style={[
              styles.statusValue,
              {
                color:
                  firestoreStatus === 'Permissions OK'
                    ? 'green'
                    : firestoreStatus === 'Not checked'
                    ? 'gray'
                    : 'red',
              },
            ]}>
            {firestoreStatus}
          </Text>
        </View>

        {lastError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Last Error:</Text>
            <Text style={styles.errorText}>{lastError}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={checkFirebaseStatus}>
            <Text style={styles.buttonText}>Check Status</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testAuth}>
            <Text style={styles.buttonText}>Test Auth</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testFirestore}>
            <Text style={styles.buttonText}>Test Firestore</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>
            {JSON.stringify(debugInfo, null, 2)}
          </Text>

          {auth.currentUser && (
            <>
              <Text style={styles.debugSubtitle}>Current User:</Text>
              <Text style={styles.debugText}>
                {JSON.stringify(
                  {
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email,
                    displayName: auth.currentUser.displayName,
                  },
                  null,
                  2,
                )}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 8,
  },
  errorText: {
    color: '#c62828',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  debugContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

export default FirebaseDebugScreen;
