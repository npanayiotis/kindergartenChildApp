// src/screens/childStatus/ChildStatusListScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Avatar, Chip } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getChildStatuses, ChildStatus } from '../../api/childStatus';
import { theme } from '../../theme';

export default function ChildStatusListScreen() {
  const [statuses, setStatuses] = useState<ChildStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token } = useAuth();
  const navigation = useNavigation();

  const fetchStatuses = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const result = await getChildStatuses(token);
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else if (result.data) {
        setStatuses(result.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch child statuses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchStatuses();
    }, [fetchStatuses])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatuses();
  }, [fetchStatuses]);

  const renderMoodIcon = (mood?: string) => {
    if (!mood) return null;
    
    let iconName = 'emoticon-neutral';
    let color = '#FFC107';
    
    if (mood.toLowerCase().includes('happy') || mood.toLowerCase().includes('good')) {
      iconName = 'emoticon';
      color = '#4CAF50';
    } else if (mood.toLowerCase().includes('sad') || mood.toLowerCase().includes('bad')) {
      iconName = 'emoticon-sad';
      color = '#F44336';
    }
    
    return (
      <Avatar.Icon
        size={40}
        icon={iconName}
        style={{ backgroundColor: 'transparent' }}
        color={color}
      />
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: ChildStatus }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('ChildStatusDetail', {
        statusId: item.id,
        childName: item.childName
      })}
    >
      <Card.Content style={styles.cardContent}>
        {renderMoodIcon(item.mood)}
        <View style={styles.cardTextContent}>
          <Title style={styles.childName}>{item.childName}</Title>
          <Paragraph style={styles.statusText}>
            Last updated: {formatDate(item.updatedAt || item.createdAt)}
          </Paragraph>
          
          {item.mood && (
            <Chip icon="emoticon" style={styles.chip}>
              {item.mood}
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading child statuses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={statuses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No child statuses found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    color: theme.colors.textSecondary,
  },
  listContent: {
    padding: theme.spacing.m,
  },
  card: {
    marginBottom: theme.spacing.m,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTextContent: {
    marginLeft: theme.spacing.m,
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  chip: {
    marginTop: theme.spacing.s,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
});
