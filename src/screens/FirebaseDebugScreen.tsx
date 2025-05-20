import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  checkFirebaseStatus,
  testFirebaseAuth,
  logFirebaseEnvironment,
} from '../utils/firebaseDebug';
import {usingMockImplementation} from '../../firebaseRN';

// Define types for the auth test result
interface AuthTestResult {
  success: boolean;
  error?: string;
  code?: string;
  usingMocks?: boolean;
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

const FirebaseDebugScreen: React.FC = () => {
  const [statusReport, setStatusReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [testAuthResult, setTestAuthResult] = useState<AuthTestResult | null>(
    null,
  );

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = () => {
    try {
      const status = checkFirebaseStatus();
      setStatusReport(status);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to check Firebase status: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  };

  const runAuthTest = async () => {
    setLoading(true);
    try {
      const result = (await testFirebaseAuth(
        testEmail,
        testPassword,
      )) as AuthTestResult;
      setTestAuthResult(result);
      if (result.success) {
        Alert.alert('Success', 'Authentication successful');
      } else {
        Alert.alert('Failed', `Authentication failed: ${result.error}`);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Test failed: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  };

  const logToConsole = () => {
    logFirebaseEnvironment();
    Alert.alert(
      'Log Generated',
      'Firebase environment details logged to console',
    );
  };

  if (!statusReport) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a80f5" />
        <Text style={styles.loadingText}>Loading Firebase status...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.heading}>Firebase Debug Panel</Text>
        <Text style={styles.description}>
          This screen helps diagnose Firebase initialization issues
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subheading}>Environment</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Platform:</Text>
          <Text style={styles.value}>
            {statusReport.platform} {statusReport.platformVersion}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Using Mocks:</Text>
          <Text
            style={[
              styles.value,
              usingMockImplementation ? styles.warning : null,
            ]}>
            {usingMockImplementation ? 'YES (Firebase not initialized)' : 'NO'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.subheading}>Firebase Authentication</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Auth Available:</Text>
          <Text
            style={[
              styles.value,
              !statusReport.services.auth.available ? styles.error : null,
            ]}>
            {statusReport.services.auth.available ? 'YES' : 'NO'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Auth Initialized:</Text>
          <Text
            style={[
              styles.value,
              !statusReport.services.auth.initialized ? styles.error : null,
            ]}>
            {statusReport.services.auth.initialized ? 'YES' : 'NO'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Current User:</Text>
          <Text style={styles.value}>
            {statusReport.services.auth.currentUser
              ? statusReport.services.auth.currentUser.email
              : 'None'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.subheading}>Firebase Firestore</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Firestore Available:</Text>
          <Text
            style={[
              styles.value,
              !statusReport.services.firestore.available ? styles.error : null,
            ]}>
            {statusReport.services.firestore.available ? 'YES' : 'NO'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Firestore Initialized:</Text>
          <Text
            style={[
              styles.value,
              !statusReport.services.firestore.initialized
                ? styles.error
                : null,
            ]}>
            {statusReport.services.firestore.initialized ? 'YES' : 'NO'}
          </Text>
        </View>
      </View>

      {statusReport.issues.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.subheading}>Issues Detected</Text>
          {statusReport.issues.map((issue: string, index: number) => (
            <Text key={index} style={styles.errorText}>
              • {issue}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.subheading}>Test Authentication</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={testEmail}
          onChangeText={setTestEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={testPassword}
          onChangeText={setTestPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={styles.button}
          onPress={runAuthTest}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Test Login</Text>
          )}
        </TouchableOpacity>

        {testAuthResult && (
          <View style={styles.testResult}>
            <Text style={styles.label}>Result:</Text>
            <Text
              style={testAuthResult.success ? styles.success : styles.error}>
              {testAuthResult.success ? 'SUCCESS' : 'FAILED'}
            </Text>
            {testAuthResult.error && (
              <Text style={styles.errorText}>{testAuthResult.error}</Text>
            )}
            {testAuthResult.code && (
              <Text style={styles.errorCode}>Code: {testAuthResult.code}</Text>
            )}
            {testAuthResult.user && (
              <View>
                <Text style={styles.successText}>
                  User: {testAuthResult.user.email}
                </Text>
                <Text style={styles.successText}>
                  Role: {testAuthResult.user.role}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={refreshStatus}>
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={logToConsole}>
          <Text style={styles.buttonText}>Log To Console</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    width: 140,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  error: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  warning: {
    color: '#f57c00',
    fontWeight: 'bold',
  },
  success: {
    color: '#388e3c',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 4,
  },
  errorCode: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },
  successText: {
    color: '#388e3c',
    fontSize: 14,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4a80f5',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    marginHorizontal: 16,
    marginVertical: 16,
  },
  testResult: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
});

export default FirebaseDebugScreen;
