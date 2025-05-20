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
import {Ionicons} from '@expo/vector-icons';
import {ChildStatus} from '../types';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';

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
      const data = await apiService.childStatus.getAll();
      setChildStatuses(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load child statuses');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChildStatuses();
  }, []);

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
            <Ionicons name="happy-outline" size={24} color="#4a80f5" />
            <Text style={styles.statusText}>{item.mood || 'N/A'}</Text>
          </View>

          <View style={styles.statusItem}>
            <Ionicons name="restaurant-outline" size={24} color="#4a80f5" />
            <Text style={styles.statusText}>{item.meal || 'N/A'}</Text>
          </View>

          <View style={styles.statusItem}>
            <Ionicons name="bed-outline" size={24} color="#4a80f5" />
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
          <Ionicons name="information-circle-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>
            No child status updates available
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
    color: '#555',
  },
  notesContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  notesLabel: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#444',
  },
  notes: {
    fontSize: 14,
    color: '#555',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ChildStatusScreen; 