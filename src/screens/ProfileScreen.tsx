import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../types';
import {Ionicon as Icon} from '../utils/IconProvider';
import {DefaultAvatar} from '../assets';
import {CommonActions} from '@react-navigation/native';

type ProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
  route: RouteProp<RootStackParamList, 'Profile'>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation, route}) => {
  const {user, logout, isParent, isKindergarten} = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const {debugHandler} = route.params || {};

  // Handle logout with useCallback to avoid recreating function
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await logout();
      // Navigate to Login screen after successful logout
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Login',
        }),
      );
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [logout, navigation]);

  // Confirmation dialog for logout
  const confirmLogout = (): void => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {text: 'Logout', onPress: handleLogout},
      ],
      {cancelable: true},
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a80f5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{flex: 1}} />
          <TouchableOpacity
            style={styles.logoutTopButton}
            onPress={confirmLogout}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="log-out-outline" size={22} color="#fff" />
                <Text style={styles.logoutTopButtonText}>Logout</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.profileHeader}>
          {user.profileImage ? (
            <Image
              source={{uri: user.profileImage}}
              style={styles.profileImage}
            />
          ) : (
            <DefaultAvatar
              width={100}
              height={100}
              style={styles.profileImage}
            />
          )}
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>
              {isParent ? 'Parent' : isKindergarten ? 'Kindergarten' : 'User'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Coming Soon',
              'Edit Profile feature will be available soon.',
            )
          }>
          <Icon name="person-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Icon name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Coming Soon',
              'Change Password feature will be available soon.',
            )
          }>
          <Icon name="lock-closed-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Change Password</Text>
          <Icon name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Coming Soon',
              'Notifications feature will be available soon.',
            )
          }>
          <Icon name="notifications-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Notifications</Text>
          <Icon name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Help & FAQ',
              'For help and support, please contact us at support@kindergartencyprus.com',
            )
          }>
          <Icon name="help-circle-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Help & FAQ</Text>
          <Icon name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Contact Us',
              'Email: support@kindergartencyprus.com\nPhone: +357 99 123456',
            )
          }>
          <Icon name="mail-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Contact Us</Text>
          <Icon name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Privacy Policy',
              'Our privacy policy information will be available soon.',
            )
          }>
          <Icon name="document-text-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <Icon name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        {/* Debug option for developers */}
        {debugHandler && (
          <TouchableOpacity style={styles.menuItem} onPress={debugHandler}>
            <Icon name="code-outline" size={22} color="#4a80f5" />
            <Text style={styles.menuItemText}>Debug Options</Text>
            <Icon name="chevron-forward" size={22} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={confirmLogout}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="log-out-outline" size={22} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
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
  header: {
    backgroundColor: '#4a80f5',
    paddingTop: 30,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  logoutTopButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  profileHeader: {
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  roleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  roleText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  versionText: {
    color: '#999',
    fontSize: 12,
  },
});

export default ProfileScreen;
