import React, {useState, useEffect} from 'react';
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

type ChildStatusScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ChildStatus'>;
};

const ChildStatusScreen: React.FC<ChildStatusScreenProps> = ({navigation}) => {
  const [childStatuses, setChildStatuses] = useState<ChildStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const {user, isParent, isKindergarten} = useAuth();

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

  // Load child statuses
  const loadChildStatuses = async (): Promise<void> => {
    try {
      setLoading(true);

      if (!user) {
        throw new Error('User not authenticated');
      }

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
      Alert.alert('Error', 'Failed to load child statuses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChildStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isParent, isKindergarten]);

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
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a80f5" />
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
    flex: 1,
  },
  statusText: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  notesContainer: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ChildStatusScreen;
