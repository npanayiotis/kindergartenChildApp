// src/screens/blog/BlogListScreen.tsx
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Text,
  Button,
} from 'react-native-paper';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {getBlogPosts, BlogPost} from '../../api/blog';
import {theme} from '../../theme';

export default function BlogListScreen() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);
  const {token} = useAuth();
  const navigation = useNavigation();
  const pageSize = 10;

  const fetchPosts = useCallback(
    async (pageNumber = 1, shouldRefresh = false) => {
      if (!token) return;

      try {
        if (pageNumber === 1) {
          setLoading(true);
        }

        const result = await getBlogPosts(token, pageNumber, pageSize);

        if (result.error) {
          Alert.alert('Error', result.error);
        } else if (result.data) {
          if (shouldRefresh || pageNumber === 1) {
            setPosts(result.data.posts);
          } else {
            setPosts(prevPosts => [...prevPosts, ...result.data.posts]);
          }

          setTotalPosts(result.data.total);
          setHasMore(result.data.posts.length === pageSize);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch blog posts');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, pageSize],
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
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderItem = ({item}: {item: BlogPost}) => (
    <Card
      style={styles.card}
      onPress={() =>
        navigation.navigate('BlogDetail', {
          postId: item.id,
          title: item.title,
        })
      }>
      {item.imageUrl && (
        <Card.Cover source={{uri: item.imageUrl}} style={styles.cardImage} />
      )}
      <Card.Content style={styles.cardContent}>
        <Title style={styles.postTitle}>{item.title}</Title>
        <Paragraph style={styles.dateText}>
          {formatDate(item.publishedAt || item.createdAt)}
          {item.author && ` • ${item.author}`}
        </Paragraph>

        {item.summary && (
          <Paragraph style={styles.summary}>
            {truncateText(item.summary, 150)}
          </Paragraph>
        )}
      </Card.Content>
      <Card.Actions>
        <Button
          mode="text"
          onPress={() =>
            navigation.navigate('BlogDetail', {
              postId: item.id,
              title: item.title,
            })
          }>
          Read More
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderFooter = () => {
    if (!hasMore) {
      return (
        <Text style={styles.endListText}>
          {posts.length > 0 ? 'No more posts to load' : ''}
        </Text>
      );
    }

    if (loading && page > 1) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingMoreText}>Loading more posts...</Text>
        </View>
      );
    }

    return null;
  };

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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No blog posts found</Text>
          </View>
        }
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
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
    paddingBottom: theme.spacing.xl,
  },
  card: {
    marginBottom: theme.spacing.m,
    elevation: 2,
  },
  cardImage: {
    height: 180,
  },
  cardContent: {
    paddingVertical: theme.spacing.m,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.s,
  },
  summary: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  footerLoader: {
    padding: theme.spacing.m,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginLeft: theme.spacing.s,
    color: theme.colors.textSecondary,
  },
  endListText: {
    textAlign: 'center',
    padding: theme.spacing.m,
    color: theme.colors.textSecondary,
  },
});
