import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import apiService from '../api/apiService';

// Import our centralized icon component
import {Ionicon as Icon} from '../utils/IconProvider';

import {ChildStatus} from '../types';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {firestore} from '../../firebaseRN';
import {CommonActions} from '@react-navigation/native';

type ChildStatusScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ChildStatus'>;
};

const ChildStatusScreen: React.FC<ChildStatusScreenProps> = ({navigation}) => {
  const [childStatuses, setChildStatuses] = useState<ChildStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const {user, isParent, isKindergarten, logout} = useAuth();

  // Function to format date string
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'No date';
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    );
  };

  // Handle logout using CommonActions instead of reset - wrapped in useCallback
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await logout();
      // Navigate to Login screen using CommonActions instead of reset
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Login',
        }),
      );
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  }, [logout, navigation]);

  // Load child statuses - wrapped in useCallback to prevent recreation on each render
  const loadChildStatuses = useCallback(async (): Promise<void> => {
    // Skip loading if no user is available
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      setError('User not authenticated. Please log in.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let data: ChildStatus[] = [];

      // Handle different roles differently
      if (isParent) {
        // Parents can only see their own children
        data = await apiService.childStatus.getAll();
      } else if (isKindergarten) {
        // This is a kindergarten/admin - query differently to get children in this kindergarten
        const childStatusSnapshot = await firestore
          .collection('childStatus')
          .where('kindergartenId', '==', user.id)
          .get();

        if (!childStatusSnapshot.empty) {
          data = childStatusSnapshot.docs.map(doc => {
            const docData = doc.data();
            return {
              id: doc.id,
              childName: docData?.childName || '',
              createdAt:
                docData?.createdAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
              updatedAt:
                docData?.updatedAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
              mood: docData?.mood || '',
              meal: docData?.meal || '',
              nap: !!docData?.nap,
              notes: docData?.notes || '',
              parentId: docData?.parentId || '',
              kindergartenId: docData?.kindergartenId || '',
            };
          });
        }
      }

      setChildStatuses(data);
    } catch (error) {
      console.error('Error loading child statuses:', error);
      setError('Failed to load child statuses. Please log out and try again.');

      // If authentication error, suggest logging out
      if (
        error instanceof Error &&
        error.message === 'User not authenticated'
      ) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log out and sign in again.',
          [
            {
              text: 'Log Out',
              onPress: handleLogout,
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isParent, isKindergarten, handleLogout]);

  // Add proper dependencies to avoid unnecessary re-renders
  useEffect(() => {
    if (user) {
      loadChildStatuses();
    } else {
      setLoading(false);
      setError('Please log in to view child statuses.');
    }
  }, [user, loadChildStatuses]);

  const onRefresh = (): void => {
    setRefreshing(true);
    loadChildStatuses();
  };

  const navigateToChildDetails = (childId: string): void => {
    navigation.navigate('ChildStatusDetails', {childId});
  };

  // Render item for child status list
  const renderChildStatusItem = ({item}: {item: ChildStatus}) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigateToChildDetails(item.id)}>
        <View style={styles.cardHeader}>
          <Text style={styles.childName}>{item.childName}</Text>
          <Text style={styles.date}>{formatDate(item.updatedAt)}</Text>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Icon name="happy-outline" size={24} color="#4a80f5" />
            <Text style={styles.statusText}>{item.mood || 'N/A'}</Text>
          </View>

          <View style={styles.statusItem}>
            <Icon name="restaurant-outline" size={24} color="#4a80f5" />
            <Text style={styles.statusText}>{item.meal || 'N/A'}</Text>
          </View>

          <View style={styles.statusItem}>
            <Icon name="bed-outline" size={24} color="#4a80f5" />
            <Text style={styles.statusText}>
              {item.nap ? 'Napped' : 'No nap'}
            </Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notes}>{item.notes}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isParent ? 'Your Child Status' : 'Children Status'}
        </Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
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
          }}>
          <Icon name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a80f5" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={50} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadChildStatuses}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutFullButton}
            onPress={handleLogout}>
            <Text style={styles.logoutFullButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      ) : childStatuses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="information-circle-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>
            No child status updates available
          </Text>
          <Text style={styles.emptySubText}>
            {isParent
              ? "Your child's status updates will appear here."
              : 'Status updates for children in your kindergarten will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={childStatuses}
          keyExtractor={item => item.id}
          renderItem={renderChildStatusItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#4a80f5',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4a80f5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  logoutFullButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  logoutFullButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusText: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  notesContainer: {
    backgroundColor: '#f5f7fa',
    padding: 10,
    borderRadius: 8,
  },
  notesLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 14,
    color: '#555',
  },
  notes: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    maxWidth: '80%',
  },
});

export default ChildStatusScreen;
