// src/screens/auth/LoginScreen.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  Banner,
} from 'react-native-paper';
import {useAuth} from '../../context/AuthContext';
import {theme} from '../../theme';
import {testFirebaseConnection} from '../../api/firebase-test';

// Import the Logo component
import {Logo} from '../../assets';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [testStatus, setTestStatus] = useState({
    testing: true,
    authStatus: 'Checking...',
    firestoreStatus: 'Checking...',
  });
  const {login, firebaseReady} = useAuth();

  // Test Firebase connection when component mounts
  useEffect(() => {
    if (!firebaseReady) {
      setTestStatus({
        testing: false,
        authStatus: 'Firebase Auth not initialized',
        firestoreStatus: 'Not tested',
      });
      return;
    }

    const checkFirebaseConnection = async () => {
      try {
        const result = await testFirebaseConnection();
        setTestStatus({
          testing: false,
          authStatus: result.authStatus,
          firestoreStatus: result.firestoreStatus,
        });
      } catch (error) {
        setTestStatus({
          testing: false,
          authStatus: 'Test failed',
          firestoreStatus: 'Test failed',
        });
      }
    };

    checkFirebaseConnection();
  }, [firebaseReady]);

  const handleLogin = async () => {
    if (!firebaseReady) {
      Alert.alert(
        'Firebase Not Ready',
        'Firebase Authentication is not initialized. Please restart the app.',
      );
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const error = await login(email, password);
      if (error) {
        Alert.alert('Login Failed', error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        {!firebaseReady && (
          <Banner
            visible={true}
            actions={[
              {
                label: 'Restart App',
                onPress: () => Alert.alert('Please close and reopen the app'),
              },
            ]}
            icon="alert">
            Firebase is not properly initialized. Please restart the app.
          </Banner>
        )}

        <View style={styles.logoContainer}>
          <Logo width={100} height={100} style={styles.logo} />
          <Text style={styles.appName}>Cyprus Kindergartens</Text>
          <Text style={styles.subtitle}>Login to access your account</Text>
        </View>

        {/* Firebase connection status */}
        <View
          style={[
            styles.statusContainer,
            !firebaseReady && styles.errorStatus,
          ]}>
          <Text style={styles.statusTitle}>Firebase Status:</Text>
          <Text>Auth: {testStatus.authStatus}</Text>
          <Text>Firestore: {testStatus.firestoreStatus}</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            disabled={!firebaseReady}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={passwordVisible ? 'eye-off' : 'eye'}
                onPress={() => setPasswordVisible(!passwordVisible)}
              />
            }
            disabled={!firebaseReady}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            labelStyle={styles.buttonLabel}
            disabled={loading || !firebaseReady}>
            {loading ? <ActivityIndicator color="#fff" /> : 'Login'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.m,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    marginTop: theme.spacing.s,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  statusContainer: {
    padding: theme.spacing.m,
    marginVertical: theme.spacing.m,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  errorStatus: {
    backgroundColor: '#ffeeee',
    borderColor: '#ffaaaa',
    borderWidth: 1,
  },
  statusTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  formContainer: {
    marginTop: theme.spacing.l,
  },
  input: {
    marginBottom: theme.spacing.m,
  },
  loginButton: {
    marginTop: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
