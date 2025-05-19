// src/screens/blog/BlogDetailScreen.tsx
import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, Alert, Linking} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  Divider,
  ActivityIndicator,
  Chip,
  Button,
} from 'react-native-paper';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {getBlogPostDetails, BlogPostDetail} from '../../api/blog';
import {theme} from '../../theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type RouteParams = {
  BlogDetail: {
    postId: string;
    title: string;
  };
};

export default function BlogDetailScreen() {
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const {token} = useAuth();
  const route = useRoute<RouteProp<RouteParams, 'BlogDetail'>>();
  const {postId} = route.params;

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!token || !postId) return;

      try {
        setLoading(true);
        const result = await getBlogPostDetails(token, postId);

        if (result.error) {
          Alert.alert('Error', result.error);
        } else if (result.data) {
          setPost(result.data);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch blog post details');
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [token, postId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';

    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Simple HTML-like content parser for basic formatting
  const renderContent = (content: string) => {
    // Replace **text** with bold text
    const boldRegex = /\*\*(.*?)\*\*/g;
    const contentWithBold = content.replace(boldRegex, '<b>$1</b>');

    // Split by <b> and </b> tags to handle paragraphs
    const parts = contentWithBold.split(/(<b>.*?<\/b>)/);

    return parts.map((part, index) => {
      if (part.startsWith('<b>') && part.endsWith('</b>')) {
        // This is a bold text part
        const text = part.replace('<b>', '').replace('</b>', '');
        return (
          <Text key={index} style={{fontWeight: 'bold'}}>
            {text}
          </Text>
        );
      } else {
        // Regular text - split by new lines for paragraphs
        const paragraphs = part.split('\n\n');
        return paragraphs.map((paragraph, pIndex) => (
          <Paragraph key={`${index}-${pIndex}`} style={styles.paragraph}>
            {paragraph}
          </Paragraph>
        ));
      }
    });
  };

  const sharePost = () => {
    // This would be implemented with react-native-share in a real app
    Alert.alert('Share', 'Sharing functionality would be implemented here');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          animating={true}
          size="large"
          color={theme.colors.primary}
        />
        <Text style={styles.loadingText}>Loading blog post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Blog post not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        {post.imageUrl && (
          <Card.Cover source={{uri: post.imageUrl}} style={styles.coverImage} />
        )}

        <Card.Content style={styles.content}>
          <View style={styles.metaContainer}>
            <Text style={styles.date}>
              {formatDate(post.publishedAt || post.createdAt)}
            </Text>

            {post.author && (
              <Chip icon="account" style={styles.authorChip}>
                {post.author}
              </Chip>
            )}
          </View>

          <Title style={styles.title}>{post.title}</Title>

          {post.kindergarten && (
            <View style={styles.kindergartenContainer}>
              <Icon
                name="school"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.kindergartenText}>
                {post.kindergarten.name}
              </Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.contentContainer}>
            {renderContent(post.content)}
          </View>

          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              icon="share-variant"
              onPress={sharePost}
              style={styles.shareButton}>
              Share
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
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
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
  },
  card: {
    margin: theme.spacing.m,
    elevation: 2,
  },
  coverImage: {
    height: 200,
  },
  content: {
    padding: theme.spacing.m,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  date: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  authorChip: {
    height: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.s,
  },
  kindergartenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  kindergartenText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginLeft: theme.spacing.xs,
  },
  divider: {
    marginVertical: theme.spacing.m,
  },
  contentContainer: {
    marginBottom: theme.spacing.l,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: theme.spacing.m,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.m,
  },
  shareButton: {
    borderRadius: 20,
  },
});
