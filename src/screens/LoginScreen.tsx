import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {Logo} from '../assets';

type LoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({navigation: _navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {login, loading} = useAuth();

  const handleLogin = async () => {
    console.log('[LOGIN] Attempting login with:', {
      email,
      passwordLength: password.length,
    });

    // Validate input
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      console.log('[LOGIN] Calling login function...');
      await login(email.trim().toLowerCase(), password);
      console.log('[LOGIN] Login successful');
      // Login successful - Auth context will handle navigation via AppNavigator
    } catch (error) {
      console.error('[LOGIN] Login failed:', error);

      // Handle specific Firebase auth errors
      let errorMessage = 'Login failed. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('user-not-found')) {
          errorMessage = 'No account found with this email address.';
        } else if (error.message.includes('wrong-password')) {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (error.message.includes('invalid-email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('too-many-requests')) {
          errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (error.message.includes('network')) {
          errorMessage =
            'Network error. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Login Failed', errorMessage);
    }
  };

  // Quick login buttons for testing (remove in production)
  const testCredentials = [
    {email: 'testing5@gmail.com', label: 'Test User 1'},
    {email: 'pana@gmail.com', label: 'Test User 2'},
    {email: 'edwime@gmail.com', label: 'Test User 3'},
  ];

  const handleTestLogin = (testEmail: string) => {
    setEmail(testEmail);
    Alert.prompt(
      'Test Login',
      `Enter password for ${testEmail}:`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Login',
          onPress: inputPassword => {
            if (inputPassword) {
              setPassword(inputPassword);
              setTimeout(() => handleLogin(), 100);
            }
          },
        },
      ],
      'secure-text',
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo width={120} height={120} style={styles.logo} />
        <Text style={styles.title}>Cyprus Kindergarten Finder</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="password"
          />
          <TouchableOpacity
            style={styles.showPasswordButton}
            onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.showPasswordText}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        {/* Test Login Buttons - Remove in production */}
        <View style={styles.testSection}>
          <Text style={styles.testSectionTitle}>Quick Test Login:</Text>
          {testCredentials.map((cred, index) => (
            <TouchableOpacity
              key={index}
              style={styles.testButton}
              onPress={() => handleTestLogin(cred.email)}>
              <Text style={styles.testButtonText}>
                {cred.label} ({cred.email})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a80f5',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  showPasswordButton: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  showPasswordText: {
    color: '#4a80f5',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#4a80f5',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  testSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  testSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#e8f0fe',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#4a80f5',
  },
  testButtonText: {
    color: '#4a80f5',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default LoginScreen;
