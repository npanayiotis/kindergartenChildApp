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

  // Load blog posts
  const loadBlogPosts = async (pageNumber = 1, refresh = false): Promise<void> => {
    try {
      if (refresh) {
        setLoading(true);
      }
      
      const response = await apiService.blog.getAll(pageNumber);
      const {posts, total} = response;
      
      if (refresh || pageNumber === 1) {
        setBlogPosts(posts);
      } else {
        setBlogPosts(prevPosts => [...prevPosts, ...posts]);
      }
      
      // Check if we have more posts to load
      setHasMore(blogPosts.length + posts.length < total);
      setPage(pageNumber);
    } catch (error) {
      Alert.alert('Error', 'Failed to load blog posts');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const onRefresh = (): void => {
    setRefreshing(true);
    loadBlogPosts(1, true);
  };

  const loadMorePosts = (): void => {
    if (hasMore && !loading) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Blog Posts</Text>
      </View>

      {loading && !refreshing && blogPosts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a80f5" />
        </View>
      ) : blogPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No blog posts available</Text>
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
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default BlogScreen; 