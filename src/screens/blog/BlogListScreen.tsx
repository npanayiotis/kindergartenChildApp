// src/screens/blog/BlogListScreen.tsx
import React, {useState, useCallback} from 'react';
import {View, StyleSheet, FlatList, RefreshControl, Alert} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Text,
  Divider,
} from 'react-native-paper';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useAuth} from '../../context/AuthContext';
import {getBlogPosts, BlogPost} from '../../api/blog';
import {theme} from '../../theme';
import {BlogStackParamList} from '../../types/navigation';

type BlogScreenNavigationProp = StackNavigationProp<
  BlogStackParamList,
  'BlogList'
>;

export default function BlogListScreen() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const {token} = useAuth();
  const navigation = useNavigation<BlogScreenNavigationProp>();

  const fetchPosts = useCallback(
    async (pageNum = 1, refresh = false) => {
      if (!token) {
        return;
      }

      try {
        if (pageNum === 1) {
          setLoading(true);
        }

        const result = await getBlogPosts(token, pageNum);

        if (result.error) {
          Alert.alert('Error', result.error);
          return;
        }

        if (result.data) {
          const {posts: newPosts, total} = result.data;

          if (refresh || pageNum === 1) {
            setPosts(newPosts);
            setHasMore(newPosts.length < total);
          } else {
            setPosts(prev => {
              const updatedPosts = [...prev, ...newPosts];
              setHasMore(updatedPosts.length < total);
              return updatedPosts;
            });
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch blog posts');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      fetchPosts(1, true);
    }, [fetchPosts]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchPosts(1, true);
  }, [fetchPosts]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return 'No date';
    }

    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderItem = ({item}: {item: BlogPost}) => (
    <Card
      style={styles.card}
      onPress={() =>
        navigation.navigate('BlogDetail', {
          blogId: item.id,
          title: item.title,
        })
      }>
      <Card.Content>
        <Title style={styles.title}>{item.title}</Title>
        {item.author && (
          <Paragraph style={styles.author}>By {item.author}</Paragraph>
        )}
        <Paragraph style={styles.date}>
          Published: {formatDate(item.publishedAt || item.createdAt)}
        </Paragraph>
        <Divider style={styles.divider} />
        {item.summary && (
          <Paragraph numberOfLines={3} style={styles.summary}>
            {item.summary}
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing && page === 1) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          animating={true}
          size="large"
          color={theme.colors.primary}
        />
        <Text style={styles.loadingText}>Loading blog posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          hasMore && posts.length > 0 ? (
            <ActivityIndicator
              style={styles.loadMoreIndicator}
              size="small"
              color={theme.colors.primary}
            />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No blog posts found</Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  author: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  date: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  divider: {
    marginVertical: theme.spacing.s,
  },
  summary: {
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  loadMoreIndicator: {
    marginVertical: theme.spacing.m,
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
