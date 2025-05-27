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
import {Ionicon as Icon} from '../utils/IconProvider';
import {ChildActivity, Child} from '../types';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {CommonActions} from '@react-navigation/native';

type ChildActivitiesScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ChildActivities'>;
};

const ChildActivitiesScreen: React.FC<ChildActivitiesScreenProps> = ({
  navigation,
}) => {
  const [childActivities, setChildActivities] = useState<ChildActivity[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const {user, isParent, isKindergarten, logout} = useAuth();

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
      default:
        return '📝';
    }
  };

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await logout();
      navigation.dispatch(CommonActions.navigate({name: 'Login'}));
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  }, [logout, navigation]);

  const loadChildActivities = useCallback(async (): Promise<void> => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      setError('User not authenticated. Please log in.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let activities: ChildActivity[] = [];
      let debugMessages: string[] = [];

      debugMessages.push(
        `🔍 Loading activities for user: ${user.email} (${user.id})`,
      );
      debugMessages.push(`👤 User role: ${user.role}`);

      if (isParent) {
        console.log('👨‍👩‍👧‍👦 [SCREEN] Loading activities for parent');
        debugMessages.push('🔄 Fetching parent activities via reservations...');

        activities = await apiService.childActivities.getAllForParent();
        debugMessages.push(`📊 Found ${activities.length} activities`);

        try {
          const childrenList = await apiService.childActivities.getChildren();
          setChildren(childrenList);
          debugMessages.push(`👶 Found ${childrenList.length} children`);

          childrenList.forEach((child, index) => {
            debugMessages.push(
              `  Child ${index + 1}: ${child.name} (Kindergarten: ${
                child.kindergartenId
              })`,
            );
          });
        } catch (childrenError) {
          console.warn('Could not load children list:', childrenError);
          debugMessages.push('⚠️ Could not load children list');
        }
      } else if (isKindergarten) {
        console.log('🏫 [SCREEN] Loading activities for kindergarten');
        debugMessages.push('🔄 Fetching kindergarten activities...');

        activities = await apiService.childActivities.getAllForKindergarten();
        debugMessages.push(`📊 Found ${activities.length} activities`);
      }

      console.log('✅ [SCREEN] Loaded', activities.length, 'activities');
      setChildActivities(activities);
      setDebugInfo(debugMessages.join('\n'));

      if (activities.length === 0) {
        if (isParent) {
          setError(
            'No child activities found.\n\n' +
              'This might be because:\n' +
              "• Your children don't have any activities recorded yet\n" +
              "• The child name in reservations doesn't match the child name in activities\n" +
              "• The kindergarten hasn't added any activities yet\n\n" +
              'Please check the debug information for more details.',
          );
        } else {
          setError('No activities found for your kindergarten.');
        }
      }
    } catch (error) {
      console.error('❌ [SCREEN] Error loading child activities:', error);

      let errorMessage = 'Failed to load child activities.';

      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage =
            'Your session has expired. Please log out and sign in again.';
        } else if (error.message.includes('permission')) {
          errorMessage =
            "You don't have permission to access this data. Please contact support.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      setError(errorMessage);

      if (
        error instanceof Error &&
        error.message.includes('not authenticated')
      ) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log out and sign in again.',
          [
            {text: 'Log Out', onPress: handleLogout},
            {text: 'Cancel', style: 'cancel'},
          ],
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isParent, isKindergarten, handleLogout]);

  useEffect(() => {
    if (user) {
      loadChildActivities();
    } else {
      setLoading(false);
      setError('Please log in to view child activities.');
    }
  }, [user, loadChildActivities]);

  const onRefresh = (): void => {
    setRefreshing(true);
    loadChildActivities();
  };

  const showDebugInfo = (): void => {
    Alert.alert(
      'Debug Information',
      debugInfo || 'No debug information available',
      [{text: 'OK'}],
    );
  };

  const renderChildActivityItem = ({item}: {item: ChildActivity}) => {
    return (
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
              <Text style={styles.childName}>{item.childName}</Text>
              <Text style={styles.activityType}>
                {item.type} - {item.subtype}
              </Text>
            </View>
          </View>
          <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
        </View>

        {item.details ? (
          <View style={styles.detailsContainer}>
            <Text style={styles.details}>{item.details}</Text>
          </View>
        ) : null}

        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>Created by kindergarten staff</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4a80f5" />
      <Text style={styles.loadingText}>Loading activities...</Text>
    </View>
  );

  const renderErrorScreen = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle-outline" size={50} color="#f44336" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={loadChildActivities}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.debugFullButton} onPress={showDebugInfo}>
        <Text style={styles.debugFullButtonText}>Debug Info</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutFullButton} onPress={handleLogout}>
        <Text style={styles.logoutFullButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyScreen = () => (
    <View style={styles.emptyContainer}>
      <Icon name="information-circle-outline" size={50} color="#ccc" />
      <Text style={styles.emptyText}>No activities found</Text>
      <Text style={styles.emptySubText}>
        {isParent
          ? "Your child's activities will appear here when the kindergarten adds them."
          : 'Child activities for your kindergarten will appear here.'}
      </Text>
      <TouchableOpacity style={styles.debugFullButton} onPress={showDebugInfo}>
        <Text style={styles.debugFullButtonText}>Debug Info</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isParent ? 'Child Activities' : 'All Activities'}
          </Text>
          {children.length > 0 ? (
            <Text style={styles.subtitle}>
              {children.length} child{children.length > 1 ? 'ren' : ''} enrolled
            </Text>
          ) : null}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.debugButton} onPress={showDebugInfo}>
            <Icon name="information-circle-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to log out?',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {text: 'Logout', onPress: handleLogout},
                ],
                {cancelable: true},
              );
            }}>
            <Icon name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        renderLoadingScreen()
      ) : error ? (
        renderErrorScreen()
      ) : childActivities.length === 0 ? (
        renderEmptyScreen()
      ) : (
        <FlatList
          data={childActivities}
          keyExtractor={item => item.id}
          renderItem={renderChildActivityItem}
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
    fontSize: 14,
    color: '#e0e0ff',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    marginRight: 8,
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
  debugFullButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  debugFullButtonText: {
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
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  activityType: {
    fontSize: 14,
    color: '#4a80f5',
    fontWeight: '500',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  detailsContainer: {
    backgroundColor: '#f5f7fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20,
    marginBottom: 20,
  },
});

export default ChildActivitiesScreen;
