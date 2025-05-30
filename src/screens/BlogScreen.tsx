// src/screens/BlogScreen.tsx - Updated with Better Error Handling and Mock Data
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import apiService from '../api/apiService';
import {BlogPost, RootStackParamList} from '../types';
import {StackNavigationProp} from '@react-navigation/stack';

type BlogScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'BlogList'>;
};

const BlogScreen: React.FC<BlogScreenProps> = ({navigation}) => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionTested, setConnectionTested] = useState<boolean>(false);
  const {user} = useAuth();

  // Function to format date string nicely
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Test connection and create mock data if needed
  const initializeData = async (): Promise<void> => {
    try {
      console.log(
        '🔧 [BLOG SCREEN] Testing connection and initializing data...',
      );

      // Test API connection
      const connectionOk = await apiService.testConnection();
      setConnectionTested(true);

      if (!connectionOk) {
        setError(
          'Failed to connect to Firebase. Please check your internet connection.',
        );
        return;
      }

      // Try to load existing blog posts
      const response = await apiService.blog.getAll(1, 10);

      if (response.posts.length === 0) {
        // No blog posts found, create mock data for development
        Alert.alert(
          'No Blog Posts Found',
          'Would you like to create some sample blog posts for testing?',
          [
            {
              text: 'No',
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: async () => {
                try {
                  await apiService.createMockData();
                  Alert.alert(
                    'Success',
                    'Sample blog posts created! Pull to refresh.',
                  );
                } catch (error) {
                  console.error('Error creating mock data:', error);
                  Alert.alert('Error', 'Failed to create sample posts.');
                }
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('❌ [BLOG SCREEN] Initialization error:', error);
      setError('Failed to initialize. Please try again.');
    }
  };

  // Load blog posts
  const loadBlogPosts = async (
    pageNumber = 1,
    refresh = false,
  ): Promise<void> => {
    try {
      if (refresh) {
        setLoading(true);
        setError(null);
      }

      console.log('📰 [BLOG SCREEN] Loading blog posts, page:', pageNumber);

      const response = await apiService.blog.getAll(pageNumber, 10);
      const {posts, total} = response;

      if (refresh || pageNumber === 1) {
        setBlogPosts(posts);
      } else {
        setBlogPosts(prevPosts => [...prevPosts, ...posts]);
      }

      // Check if we have more posts to load
      setHasMore(blogPosts.length + posts.length < total);
      setPage(pageNumber);

      console.log('✅ [BLOG SCREEN] Loaded', posts.length, 'posts');
    } catch (error) {
      console.error('❌ [BLOG SCREEN] Error loading blog posts:', error);

      let errorMessage = 'Failed to load blog posts';
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check your account access.';
        } else if (error.message.includes('network')) {
          errorMessage =
            'Network error. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialize data on first load
  useEffect(() => {
    if (!connectionTested) {
      initializeData();
    }
  }, [connectionTested]);

  // Load blog posts after initialization
  useEffect(() => {
    if (connectionTested && !error) {
      loadBlogPosts();
    }
  }, [connectionTested, error]);

  const onRefresh = (): void => {
    setRefreshing(true);
    setError(null);
    loadBlogPosts(1, true);
  };

  const loadMorePosts = (): void => {
    if (hasMore && !loading && !error) {
      loadBlogPosts(page + 1);
    }
  };

  // Navigate to blog post details
  const navigateToBlogPost = (postId: string): void => {
    navigation.navigate('BlogPostDetails', {postId});
  };

  // Render blog post item
  const renderBlogPostItem = ({item}: {item: BlogPost}) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigateToBlogPost(item.id)}>
        {item.image && (
          <Image
            source={{uri: item.image}}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postDate}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.postKindergarten}>
            {item.kindergartenName || 'Unknown kindergarten'}
          </Text>
          <Text style={styles.postExcerpt} numberOfLines={3}>
            {item.content.replace(/<[^>]*>/g, '')}
          </Text>
        </View>
        <View style={styles.readMoreContainer}>
          <Text style={styles.readMore}>Read more</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Footer component to show loading more indicator
  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4a80f5" />
        <Text style={styles.loadingMoreText}>Loading more posts...</Text>
      </View>
    );
  };

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          setError(null);
          setConnectionTested(false);
        }}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>

      {/* Development helper button */}
      <TouchableOpacity
        style={styles.mockDataButton}
        onPress={async () => {
          try {
            setLoading(true);
            await apiService.createMockData();
            Alert.alert('Success', 'Sample blog posts created!');
            onRefresh();
          } catch (error) {
            Alert.alert('Error', 'Failed to create sample posts.');
          } finally {
            setLoading(false);
          }
        }}>
        <Text style={styles.mockDataButtonText}>Create Sample Posts</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Blog Posts</Text>
        {!connectionTested && (
          <Text style={styles.subtitle}>Connecting to Firebase...</Text>
        )}
      </View>

      {error ? (
        renderErrorState()
      ) : loading && !refreshing && blogPosts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a80f5" />
          <Text style={styles.loadingText}>Loading blog posts...</Text>
        </View>
      ) : blogPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No blog posts available</Text>
          <Text style={styles.emptySubText}>
            Pull down to refresh or create some sample posts to get started.
          </Text>
          <TouchableOpacity
            style={styles.createSampleButton}
            onPress={async () => {
              try {
                setLoading(true);
                await apiService.createMockData();
                Alert.alert('Success', 'Sample blog posts created!');
                onRefresh();
              } catch (error) {
                Alert.alert('Error', 'Failed to create sample posts.');
              } finally {
                setLoading(false);
              }
            }}>
            <Text style={styles.createSampleButtonText}>
              Create Sample Posts
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={blogPosts}
          keyExtractor={item => item.id}
          renderItem={renderBlogPostItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
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
  subtitle: {
    fontSize: 12,
    color: '#e0e0ff',
    marginTop: 2,
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
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4a80f5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mockDataButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  mockDataButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
  },
  postContent: {
    padding: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  postDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  postKindergarten: {
    fontSize: 12,
    color: '#4a80f5',
    fontWeight: '500',
    marginBottom: 8,
  },
  postExcerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  readMoreContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 12,
    alignItems: 'center',
  },
  readMore: {
    color: '#4a80f5',
    fontWeight: '500',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  createSampleButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createSampleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BlogScreen;
