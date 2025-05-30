// src/api/blogService.ts - Fixed Firestore Pagination
import firestore from '@react-native-firebase/firestore';
import {BlogPost} from '../types';

console.log('📰 Blog Service initializing with Firebase Firestore...');

class BlogService {
  private readonly collection = firestore().collection('blog');

  // Get all blog posts with pagination
  async getAll(
    page: number = 1,
    pageSize: number = 10,
    kindergartenId: string | null = null,
  ) {
    try {
      console.log('📰 [BLOG] Fetching blog posts from Firestore');
      console.log(
        '📰 [BLOG] Page:',
        page,
        'PageSize:',
        pageSize,
        'KindergartenId:',
        kindergartenId,
      );

      let query = this.collection.orderBy('createdAt', 'desc').limit(pageSize);

      // Filter by kindergarten if specified
      if (kindergartenId) {
        query = query.where('kindergartenId', '==', kindergartenId);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('📰 [BLOG] No blog posts found');
        return {
          posts: [],
          total: 0,
          page,
          pageSize,
        };
      }

      const posts: BlogPost[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled',
          content: data.content || '',
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() ||
            data.createdAt ||
            new Date().toISOString(),
          updatedAt:
            data.updatedAt?.toDate?.()?.toISOString() ||
            data.updatedAt ||
            new Date().toISOString(),
          kindergartenId: data.kindergartenId || '',
          kindergartenName: data.kindergartenName || 'Unknown',
          image: data.image || data.imageUrl,
        };
      });

      // Get total count (simplified - in production, use a separate counter document)
      const totalSnapshot = await this.collection.get();
      const total = totalSnapshot.size;

      console.log(
        '✅ [BLOG] Found',
        posts.length,
        'blog posts out of',
        total,
        'total',
      );

      return {
        posts,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('❌ [BLOG] Error fetching blog posts:', error);
      throw error;
    }
  }

  // Get a single blog post by ID
  async getById(id: string): Promise<BlogPost> {
    try {
      console.log('📰 [BLOG] Fetching blog post by ID:', id);

      const doc = await this.collection.doc(id).get();

      if (!doc.exists) {
        throw new Error('Blog post not found');
      }

      const data = doc.data()!;
      const post: BlogPost = {
        id: doc.id,
        title: data.title || 'Untitled',
        content: data.content || '',
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ||
          data.createdAt ||
          new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString() ||
          data.updatedAt ||
          new Date().toISOString(),
        kindergartenId: data.kindergartenId || '',
        kindergartenName: data.kindergartenName || 'Unknown',
        image: data.image || data.imageUrl,
      };

      console.log('✅ [BLOG] Found blog post:', post.title);
      return post;
    } catch (error) {
      console.error('❌ [BLOG] Error fetching blog post:', error);
      throw error;
    }
  }

  // Subscribe to real-time blog updates
  subscribeToBlogs(
    onBlogUpdate: (posts: BlogPost[]) => void,
    kindergartenId?: string,
  ) {
    console.log('🔗 [BLOG] Setting up real-time blog listener');

    let query = this.collection.orderBy('createdAt', 'desc').limit(20);

    if (kindergartenId) {
      query = query.where('kindergartenId', '==', kindergartenId);
    }

    const unsubscribe = query.onSnapshot(
      snapshot => {
        if (snapshot.empty) {
          console.log('📰 [BLOG] No blog posts in real-time update');
          onBlogUpdate([]);
          return;
        }

        const posts: BlogPost[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Untitled',
            content: data.content || '',
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              data.createdAt ||
              new Date().toISOString(),
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() ||
              data.updatedAt ||
              new Date().toISOString(),
            kindergartenId: data.kindergartenId || '',
            kindergartenName: data.kindergartenName || 'Unknown',
            image: data.image || data.imageUrl,
          };
        });

        console.log(
          '🔄 [BLOG] Real-time update: found',
          posts.length,
          'blog posts',
        );
        onBlogUpdate(posts);
      },
      error => {
        console.error('❌ [BLOG] Real-time listener error:', error);
      },
    );

    return unsubscribe;
  }

  // Test connection to Firestore
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔧 [BLOG] Testing Firestore connection...');

      // Try to read from the blog collection
      await this.collection.limit(1).get();

      console.log('✅ [BLOG] Firestore connection successful');
      return true;
    } catch (error) {
      console.error('❌ [BLOG] Firestore connection failed:', error);
      return false;
    }
  }

  // Create mock blog posts for testing (use only for development)
  async createMockPosts(): Promise<void> {
    try {
      console.log('🔧 [BLOG] Creating mock blog posts for testing...');

      const mockPosts = [
        {
          title: 'Welcome to Our Kindergarten!',
          content:
            '<p>We are excited to welcome all our new families to the kindergarten! This year promises to be full of learning, fun, and discovery.</p><p>Our experienced teachers are ready to guide your children through their educational journey.</p>',
          kindergartenId: 'kindergarten-1',
          kindergartenName: 'Sunshine Kindergarten',
          image:
            'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500',
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        {
          title: 'Art & Creativity Week',
          content:
            '<p>This week, our children explored their artistic side! From finger painting to clay modeling, every day was filled with creative expression.</p><p>Check out some of the amazing artwork your children created!</p>',
          kindergartenId: 'kindergarten-1',
          kindergartenName: 'Sunshine Kindergarten',
          image:
            'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500',
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        {
          title: 'Outdoor Learning Adventures',
          content:
            '<p>Our outdoor classroom continues to be a huge hit! Children are learning about nature, plants, and the environment through hands-on activities.</p><p>Fresh air and learning go hand in hand!</p>',
          kindergartenId: 'kindergarten-1',
          kindergartenName: 'Sunshine Kindergarten',
          image:
            'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=500',
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
      ];

      // Add mock posts to Firestore
      for (const post of mockPosts) {
        await this.collection.add(post);
      }

      console.log('✅ [BLOG] Mock blog posts created successfully');
    } catch (error) {
      console.error('❌ [BLOG] Error creating mock posts:', error);
      throw error;
    }
  }
}

// Create and export a single instance
const blogService = new BlogService();
export default blogService;
