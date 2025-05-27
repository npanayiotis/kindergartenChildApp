// Enhanced ChildActivitiesScreen with real-time updates and improved child tracking
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
  ScrollView,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import apiService from '../api/apiService';
import {Ionicon as Icon} from '../utils/IconProvider';
import {ChildActivity, Child, UnsubscribeFunction} from '../types';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {CommonActions} from '@react-navigation/native';

type EnhancedChildActivitiesScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ChildActivities'>;
};

const EnhancedChildActivitiesScreen: React.FC<
  EnhancedChildActivitiesScreenProps
> = ({navigation}) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [childActivities, setChildActivities] = useState<ChildActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [realtimeEnabled, setRealtimeEnabled] = useState<boolean>(false);

  const {user, isParent, isKindergarten, logout} = useAuth();

  // Ref to store unsubscribe functions for cleanup
  const unsubscribeFunctions = React.useRef<UnsubscribeFunction[]>([]);

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'No date';
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return (
        'Today ' +
        date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
      );
    } else {
      return (
        date.toLocaleDateString() +
        ' ' +
        date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
      );
    }
  };

  const getActivityIcon = (type: string, subtype: string): string => {
    switch (type.toLowerCase()) {
      case 'meal':
        return subtype.toLowerCase().includes('breakfast')
          ? '🍳'
          : subtype.toLowerCase().includes('lunch')
          ? '🍽️'
          : subtype.toLowerCase().includes('snack')
          ? '🍪'
          : '🍽️';
      case 'nap':
        return '😴';
      case 'activity':
        return '🎨';
      case 'play':
        return '🎮';
      case 'learning':
        return '📚';
      case 'outdoor':
        return '🌳';
      case 'arts':
        return '🎨';
      default:
        return '📝';
    }
  };

  // Cleanup function for all listeners
  const cleanupListeners = useCallback(() => {
    unsubscribeFunctions.current.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing listener:', error);
      }
    });
    unsubscribeFunctions.current = [];
  }, []);

  // Load children for the current parent
  const loadChildren = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      console.log('👶 [SCREEN] Loading children for parent');
      const fetchedChildren = await apiService.children.getAllForParent();

      setChildren(fetchedChildren);

      // Auto-select first child if available
      if (fetchedChildren.length > 0 && !selectedChild) {
        setSelectedChild(fetchedChildren[0]);
      }

      const debugMessages = [
        `👤 User: ${user.email} (${user.id})`,
        `👶 Children found: ${fetchedChildren.length}`,
        ...fetchedChildren.map(
          (child, index) =>
            `  Child ${index + 1}: ${child.name} (ID: ${
              child.id
            }, Kindergarten: ${child.kindergartenId})`,
        ),
      ];
      setDebugInfo(debugMessages.join('\n'));

      console.log('✅ [SCREEN] Loaded', fetchedChildren.length, 'children');
    } catch (error) {
      console.error('❌ [SCREEN] Error loading children:', error);
      setError('Failed to load children. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedChild]);

  // Load activities for selected child and date
  const loadActivities = useCallback(async (): Promise<void> => {
    if (!selectedChild) return;

    try {
      setLoading(true);
      setError(null);

      console.log(
        '📦 [SCREEN] Loading activities for child:',
        selectedChild.name,
      );
      const activities = await apiService.childActivities.getByChildAndDate(
        selectedChild.id,
        selectedDate,
      );

      setChildActivities(activities);
      console.log('✅ [SCREEN] Loaded', activities.length, 'activities');
    } catch (error) {
      console.error('❌ [SCREEN] Error loading activities:', error);
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedChild, selectedDate]);

  // Set up real-time listeners
  const setupRealtimeListeners = useCallback(() => {
    if (!user || !selectedChild) return;

    cleanupListeners();

    console.log('🔗 [SCREEN] Setting up real-time listeners');

    // 1. Listen to children changes
    const childrenUnsubscribe = apiService.children.subscribeToChildren(
      updatedChildren => {
        console.log(
          '🔄 [SCREEN] Children updated in real-time:',
          updatedChildren.length,
        );
        setChildren(updatedChildren);

        // Update selected child if it changed
        if (selectedChild) {
          const updatedSelectedChild = updatedChildren.find(
            child => child.id === selectedChild.id,
          );
          if (updatedSelectedChild) {
            setSelectedChild(updatedSelectedChild);
          }
        }
      },
    );

    // 2. Listen to activities for selected child
    const activitiesUnsubscribe =
      apiService.childActivities.subscribeToChildActivities(
        selectedChild.id,
        selectedDate,
        updatedActivities => {
          console.log(
            '🔄 [SCREEN] Activities updated in real-time:',
            updatedActivities.length,
          );
          setChildActivities(updatedActivities);
        },
      );

    // Store unsubscribe functions for cleanup
    unsubscribeFunctions.current = [childrenUnsubscribe, activitiesUnsubscribe];
    setRealtimeEnabled(true);
  }, [user, selectedChild, selectedDate, cleanupListeners]);

  // Handle logout
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      cleanupListeners();
      await logout();
      navigation.dispatch(CommonActions.navigate({name: 'Login'}));
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  }, [logout, navigation, cleanupListeners]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (user) {
      loadChildren();
    }
  }, [user, loadChildren]);

  useEffect(() => {
    if (selectedChild) {
      loadActivities();
    }
  }, [selectedChild, selectedDate, loadActivities]);

  // Set up real-time listeners when child or date changes
  useEffect(() => {
    if (selectedChild && realtimeEnabled) {
      setupRealtimeListeners();
    }
    return cleanupListeners;
  }, [
    selectedChild,
    selectedDate,
    realtimeEnabled,
    setupRealtimeListeners,
    cleanupListeners,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupListeners;
  }, [cleanupListeners]);

  const onRefresh = (): void => {
    setRefreshing(true);
    loadChildren();
    if (selectedChild) {
      loadActivities();
    }
  };

  const toggleRealtime = (): void => {
    if (realtimeEnabled) {
      cleanupListeners();
      setRealtimeEnabled(false);
      Alert.alert(
        'Real-time Updates',
        'Real-time updates disabled. Pull to refresh for new data.',
      );
    } else {
      setupRealtimeListeners();
      Alert.alert(
        'Real-time Updates',
        'Real-time updates enabled. Data will update automatically.',
      );
    }
  };

  const showDebugInfo = (): void => {
    Alert.alert(
      'Debug Information',
      debugInfo || 'No debug information available',
      [{text: 'OK'}],
    );
  };

  const renderChildSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.childSelector}
      contentContainerStyle={styles.childSelectorContent}>
      {children.map(child => (
        <TouchableOpacity
          key={child.id}
          style={[
            styles.childChip,
            selectedChild?.id === child.id && styles.childChipSelected,
          ]}
          onPress={() => setSelectedChild(child)}>
          <Text
            style={[
              styles.childChipText,
              selectedChild?.id === child.id && styles.childChipTextSelected,
            ]}>
            {child.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderDateSelector = () => (
    <View style={styles.dateSelector}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          const yesterday = new Date(selectedDate);
          yesterday.setDate(yesterday.getDate() - 1);
          setSelectedDate(yesterday);
        }}>
        <Text style={styles.dateButtonText}>◀</Text>
      </TouchableOpacity>

      <Text style={styles.selectedDateText}>
        {selectedDate.toLocaleDateString()}
      </Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          const tomorrow = new Date(selectedDate);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (tomorrow <= new Date()) {
            // Don't allow future dates
            setSelectedDate(tomorrow);
          }
        }}>
        <Text style={styles.dateButtonText}>▶</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActivityItem = ({item}: {item: ChildActivity}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        Alert.alert(
          'Activity Details',
          `Child: ${item.childName}\nType: ${item.type} - ${
            item.subtype
          }\nDetails: ${item.details}\nTime: ${formatDate(item.timestamp)}`,
        );
      }}>
      <View style={styles.cardHeader}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityIcon}>
            {getActivityIcon(item.type, item.subtype)}
          </Text>
          <View style={styles.activityInfo}>
            <Text style={styles.activityType}>
              {item.type} - {item.subtype}
            </Text>
            <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
          </View>
        </View>
      </View>

      {item.details ? (
        <View style={styles.detailsContainer}>
          <Text style={styles.details}>{item.details}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  const renderLoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4a80f5" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );

  const renderErrorScreen = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle-outline" size={50} color="#f44336" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyScreen = () => (
    <View style={styles.emptyContainer}>
      <Icon name="information-circle-outline" size={50} color="#ccc" />
      <Text style={styles.emptyText}>
        {children.length === 0
          ? 'No children found'
          : selectedChild
          ? `No activities found for ${
              selectedChild.name
            } on ${selectedDate.toLocaleDateString()}`
          : 'Select a child to view activities'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Child Activities (Enhanced)</Text>
          <Text style={styles.subtitle}>
            {children.length} child{children.length !== 1 ? 'ren' : ''} •
            {realtimeEnabled ? ' Live Updates' : ' Manual Refresh'}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleRealtime}>
            <Icon
              name={realtimeEnabled ? 'pause' : 'play'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={showDebugInfo}>
            <Icon name="information-circle-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Icon name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        renderLoadingScreen()
      ) : error ? (
        renderErrorScreen()
      ) : children.length === 0 ? (
        renderEmptyScreen()
      ) : (
        <>
          {renderChildSelector()}
          {selectedChild && renderDateSelector()}

          <FlatList
            data={childActivities}
            keyExtractor={item => item.id}
            renderItem={renderActivityItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyScreen}
          />
        </>
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#e0e0ff',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    marginLeft: 8,
  },
  childSelector: {
    backgroundColor: '#fff',
    paddingVertical: 15,
  },
  childSelectorContent: {
    paddingHorizontal: 20,
  },
  childChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  childChipSelected: {
    backgroundColor: '#4a80f5',
  },
  childChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  childChipTextSelected: {
    color: '#fff',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateButton: {
    padding: 10,
  },
  dateButtonText: {
    fontSize: 18,
    color: '#4a80f5',
    fontWeight: 'bold',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
    minWidth: 120,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    lineHeight: 22,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    fontSize: 16,
    color: '#4a80f5',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  detailsContainer: {
    backgroundColor: '#f5f7fa',
    padding: 12,
    borderRadius: 8,
  },
  details: {
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
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 22,
  },
});

export default EnhancedChildActivitiesScreen;
