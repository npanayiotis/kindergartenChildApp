import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, BlogPost} from '../types';
import apiService from '../api/apiService';
import RenderHtml from 'react-native-render-html';
import {useWindowDimensions} from 'react-native';

type BlogPostDetailsScreenProps = {
  route: RouteProp<RootStackParamList, 'BlogPostDetails'>;
  navigation: StackNavigationProp<RootStackParamList, 'BlogPostDetails'>;
};

const BlogPostDetailsScreen: React.FC<BlogPostDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const {width} = useWindowDimensions();
  const {postId} = route.params;

  // Load blog post details
  useEffect(() => {
    const loadBlogPost = async () => {
      try {
        setLoading(true);
        const data = await apiService.blog.getById(postId);
        setPost(data);
        // Set the title in the navigation header
        navigation.setOptions({
          title: data.title,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to load blog post details');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadBlogPost();
  }, [postId, navigation]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a80f5" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Blog post not found or failed to load
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {post.image && (
        <Image
          source={{uri: post.image}}
          style={styles.headerImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{post.title}</Text>
        
        <View style={styles.metaContainer}>
          <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
          <Text style={styles.author}>
            By {post.kindergartenName || 'Unknown kindergarten'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Use RenderHtml to display HTML content */}
        <RenderHtml
          contentWidth={width - 32} // Adjust for padding
          source={{html: post.content}}
          tagsStyles={{
            p: {
              fontSize: 16,
              lineHeight: 24,
              color: '#333',
              marginBottom: 16,
            },
            h1: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#222',
              marginVertical: 16,
            },
            h2: {
              fontSize: 22,
              fontWeight: 'bold',
              color: '#333',
              marginVertical: 14,
            },
            li: {
              fontSize: 16,
              lineHeight: 24,
              color: '#333',
              marginBottom: 8,
            },
            a: {
              color: '#4a80f5',
              textDecorationLine: 'underline',
            },
          }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  headerImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  date: {
    fontSize: 14,
    color: '#888',
  },
  author: {
    fontSize: 14,
    color: '#4a80f5',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
});

export default BlogPostDetailsScreen; 