// Export all Firebase functionality from one file
// This makes imports cleaner in the app

// Firebase configuration
export {app, db, auth, storage} from './config';

// Authentication functions
export {
  login,
  register,
  logout,
  getAuthHeader,
  User,
  AuthResponse,
  ApiResponse,
} from './authService';

// Blog post functions
export {getBlogPosts, getBlogPostById, getRecentBlogPosts} from './blog';

// Child status functions
export {
  getChildStatuses,
  getChildStatusById,
  createChildStatus,
  updateChildStatus,
} from './childStatus';
