import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, ChildStatus} from '../types';
import apiService from '../api/apiService';
import {useAuth} from '../context/AuthContext';
import {Ionicons} from '@expo/vector-icons';

type ChildStatusDetailsScreenProps = {
  route: RouteProp<RootStackParamList, 'ChildStatusDetails'>;
  navigation: StackNavigationProp<RootStackParamList, 'ChildStatusDetails'>;
};

const ChildStatusDetailScreen: React.FC<ChildStatusDetailsScreenProps> = ({
  route,
  navigation: _navigation,
}) => {
  const [childStatus, setChildStatus] = useState<ChildStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const {isKindergarten} = useAuth();
  const {childId} = route.params;

  // Form state for edits
  const [mood, setMood] = useState<string>('');
  const [meal, setMeal] = useState<string>('');
  const [nap, setNap] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Load child status
  useEffect(() => {
    const loadChildStatus = async () => {
      try {
        setLoading(true);
        const data = await apiService.childStatus.getById(childId);
        setChildStatus(data);

        // Initialize form fields
        setMood(data.mood || '');
        setMeal(data.meal || '');
        setNap(!!data.nap);
        setNotes(data.notes || '');
      } catch (error) {
        Alert.alert('Error', 'Failed to load child status details');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadChildStatus();
  }, [childId]);

  // Format date for display
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'No date';
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    );
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!childStatus) return;

    try {
      setSaving(true);

      const updatedData = {
        mood,
        meal,
        nap,
        notes,
      };

      await apiService.childStatus.update(childId, updatedData);

      // Update local state
      setChildStatus({
        ...childStatus,
        ...updatedData,
      });

      setEditMode(false);
      Alert.alert('Success', 'Child status updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update child status');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a80f5" />
      </View>
    );
  }

  if (!childStatus) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Child status not found or failed to load
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.childName}>{childStatus.childName}</Text>
        <Text style={styles.date}>
          Updated: {formatDate(childStatus.updatedAt)}
        </Text>

        {isKindergarten && !editMode && (
          <Text style={styles.editButton} onPress={() => setEditMode(true)}>
            Edit
          </Text>
        )}

        {isKindergarten && editMode && (
          <View style={styles.editActions}>
            <Text
              style={styles.cancelButton}
              onPress={() => setEditMode(false)}>
              Cancel
            </Text>
            <Text style={styles.saveButton} onPress={handleSaveChanges}>
              Save
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Mood Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="happy-outline" size={24} color="#4a80f5" />
            <Text style={styles.sectionTitle}>Mood</Text>
          </View>

          {!editMode ? (
            <Text style={styles.sectionText}>
              {childStatus.mood || 'No mood recorded'}
            </Text>
          ) : (
            <TextInput
              style={styles.input}
              value={mood}
              onChangeText={setMood}
              placeholder="Enter child's mood"
            />
          )}
        </View>

        {/* Meal Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant-outline" size={24} color="#4a80f5" />
            <Text style={styles.sectionTitle}>Meal</Text>
          </View>

          {!editMode ? (
            <Text style={styles.sectionText}>
              {childStatus.meal || 'No meal recorded'}
            </Text>
          ) : (
            <TextInput
              style={styles.input}
              value={meal}
              onChangeText={setMeal}
              placeholder="Enter meal information"
            />
          )}
        </View>

        {/* Nap Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bed-outline" size={24} color="#4a80f5" />
            <Text style={styles.sectionTitle}>Nap</Text>
          </View>

          {!editMode ? (
            <Text style={styles.sectionText}>
              {childStatus.nap ? 'Child took a nap' : 'No nap today'}
            </Text>
          ) : (
            <View style={styles.switchContainer}>
              <Text>Did the child nap today?</Text>
              <Switch
                value={nap}
                onValueChange={setNap}
                trackColor={{false: '#767577', true: '#81b0ff'}}
                thumbColor={nap ? '#4a80f5' : '#f4f3f4'}
              />
            </View>
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={24} color="#4a80f5" />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>

          {!editMode ? (
            <Text style={styles.sectionText}>
              {childStatus.notes || 'No additional notes'}
            </Text>
          ) : (
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Enter additional notes"
              multiline
              numberOfLines={4}
            />
          )}
        </View>
      </View>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.savingText}>Saving changes...</Text>
        </View>
      )}
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
    backgroundColor: '#f5f7fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#4a80f5',
    padding: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  childName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#e0e0ff',
    marginBottom: 10,
  },
  editButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    color: '#fff',
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelButton: {
    marginRight: 15,
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    color: '#4a80f5',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  sectionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});

export default ChildStatusDetailScreen;
