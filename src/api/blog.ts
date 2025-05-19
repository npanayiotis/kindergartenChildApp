import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  startAfter,
  Timestamp,
} from 'firebase/firestore';
import {db} from './config';

// Get blog posts with pagination
export async function getBlogPosts(options = {}) {
  try {
    const {
      kindergartenId = null,
      pageSize = 10,
      lastVisible = null,
      onlyPublished = true,
    } = options;

    // Build query
    let baseQuery = collection(db, 'blogPosts');
    let constraints = [];

    // Add filters
    if (kindergartenId) {
      constraints.push(where('kindergartenId', '==', kindergartenId));
    }

    if (onlyPublished) {
      constraints.push(where('published', '==', true));
    }

    // Add sorting
    constraints.push(orderBy('createdAt', 'desc'));

    // Add pagination
    constraints.push(limit(pageSize));

    // Add cursor if we have a last item
    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    // Create and execute query
    const blogQuery = query(baseQuery, ...constraints);
    const snapshot = await getDocs(blogQuery);

    // Process results
    const posts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || null,
        publishedAt: data.publishedAt?.toDate?.() || null,
      });
    });

    // Get the last visible document for pagination
    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

    return {
      posts,
      lastVisible: lastVisibleDoc,
      hasMore: posts.length === pageSize,
    };
  } catch (error) {
    console.error('Error getting blog posts:', error);
    throw error;
  }
}

// Get a single blog post by ID
export async function getBlogPostById(id) {
  try {
    const docRef = doc(db, 'blogPosts', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Blog post not found');
    }

    const data = docSnap.data();

    // Get kindergarten details if available
    let kindergarten = null;
    if (data.kindergartenId) {
      const kindergartenRef = doc(db, 'kindergartens', data.kindergartenId);
      const kindergartenSnap = await getDoc(kindergartenRef);

      if (kindergartenSnap.exists()) {
        const kindergartenData = kindergartenSnap.data();
        kindergarten = {
          id: kindergartenSnap.id,
          name: kindergartenData.name || 'Unknown Kindergarten',
        };
      }
    }

    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || null,
      publishedAt: data.publishedAt?.toDate?.() || null,
      kindergarten,
    };
  } catch (error) {
    console.error('Error getting blog post:', error);
    throw error;
  }
}

// Get recent blog posts
export async function getRecentBlogPosts(count = 5) {
  try {
    const blogQuery = query(
      collection(db, 'blogPosts'),
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(count),
    );

    const snapshot = await getDocs(blogQuery);

    const posts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || null,
        publishedAt: data.publishedAt?.toDate?.() || null,
      });
    });

    return posts;
  } catch (error) {
    console.error('Error getting recent blog posts:', error);
    throw error;
  }
}
