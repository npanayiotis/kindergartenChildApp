import React, {useState} from 'react';
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import {DefaultAvatar} from '../assets';

type ProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
  route: RouteProp<RootStackParamList, 'Profile'>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({route}) => {
  const {user, logout, isParent, isKindergarten} = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const {debugHandler} = route.params || {};

  // Handle logout
  const handleLogout = async (): Promise<void> => {
    try {
      setLoading(true);
      await logout();
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
          <Ionicons name="person-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Coming Soon',
              'Change Password feature will be available soon.',
            )
          }>
          <Ionicons name="lock-closed-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Coming Soon',
              'Notifications feature will be available soon.',
            )
          }>
          <Ionicons name="notifications-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={22} color="#ccc" />
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
          <Ionicons name="help-circle-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Help & FAQ</Text>
          <Ionicons name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Contact Us',
              'Email: support@kindergartencyprus.com\nPhone: +357 99 123456',
            )
          }>
          <Ionicons name="mail-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Contact Us</Text>
          <Ionicons name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Privacy Policy',
              'Our privacy policy information will be available soon.',
            )
          }>
          <Ionicons name="document-text-outline" size={22} color="#4a80f5" />
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        {/* Debug option for developers */}
        {debugHandler && (
          <TouchableOpacity style={styles.menuItem} onPress={debugHandler}>
            <Ionicons name="code-outline" size={22} color="#4a80f5" />
            <Text style={styles.menuItemText}>Debug Options</Text>
            <Ionicons name="chevron-forward" size={22} color="#ccc" />
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
            <Ionicons name="log-out-outline" size={22} color="#fff" />
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
  profileHeader: {
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#e0e0ff',
    marginBottom: 12,
  },
  roleContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  roleText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
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
    fontSize: 15,
    color: '#333',
    marginLeft: 15,
  },
  logoutButton: {
    margin: 15,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
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
