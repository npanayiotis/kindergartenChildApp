// User type
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'parent' | 'kindergarten' | 'admin';
  profileImage?: string;
}

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isParent: boolean;
  isKindergarten: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Child Activity type - Updated for your Firebase structure
export interface ChildActivity {
  id: string;
  childId: string;
  childName: string;
  type: string; // meal, nap, activity, etc.
  subtype: string; // breakfast, lunch, playtime, etc.
  timestamp: string;
  details: string;
  createdBy: string;
  kindergartenId: string;
  deleted: boolean;
}

// Child type - represents a child in the system
export interface Child {
  id: string;
  name: string;
  kindergartenId: string;
  userId?: string; // Parent's user ID
  dateOfBirth?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Legacy ChildStatus interface for backward compatibility
export interface ChildStatus {
  id: string;
  childName: string;
  mood?: string;
  meal?: string;
  nap?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string;
  kindergartenId?: string;
}

// Reservation type - links parents to children and kindergartens
export interface Reservation {
  id: string;
  userId: string; // Parent's user ID
  childId: string;
  kindergartenId: string;
  status: 'active' | 'inactive' | 'pending';
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// Blog Post type
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  kindergartenId: string;
  kindergartenName: string;
  image?: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  ChildActivities: undefined;
  ChildActivityDetails: {activityId: string};
  BlogList: undefined;
  BlogPostDetails: {postId: string};
  Profile: {
    debugHandler?: () => void;
  };
  // Tab navigation types
  Status: undefined;
  Blog: undefined;
};

// API Service Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Debug information type
export interface DebugInfo {
  userId: string;
  userEmail: string;
  userRole: string;
  childrenFound: number;
  activitiesFound: number;
  timestamp: string;
  errors: string[];
  warnings: string[];
}

// Re-export Firebase types
export * from './firebase';
