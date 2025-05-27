// Enhanced types with improved child tracking

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

// ENHANCED: Child type with proper parent relationship
export interface Child {
  id: string;
  name: string;
  kindergartenId: string;
  userId: string; // Parent's user ID (parentId in Firestore)
  dateOfBirth?: string;
  profileImage?: string;
  medicalInfo?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// ENHANCED: Child Activity with improved ID-based tracking
export interface ChildActivity {
  id: string;
  childId: string; // ✅ Direct reference to child document
  childName: string; // Keep for display purposes
  type: string; // meal, nap, activity, etc.
  subtype: string; // breakfast, lunch, playtime, etc.
  timestamp: string;
  details: string;
  createdBy: string;
  kindergartenId: string;
  deleted: boolean;
  // Optional additional fields
  mood?: 'happy' | 'sad' | 'neutral' | 'excited' | 'tired';
  photos?: string[]; // URLs to photos
  duration?: number; // For activities like naps (in minutes)
  quantity?: string; // For meals (ate well, ate some, didn't eat)
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

// ENHANCED: Reservation type with better child linking
export interface Reservation {
  id: string;
  userId: string; // Parent's user ID
  childId: string; // ✅ Direct reference to child document
  childName: string; // Keep for backward compatibility
  kindergartenId: string;
  status: 'active' | 'inactive' | 'pending' | 'cancelled';
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Blog Post type (unchanged)
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

// ENHANCED: Navigation Types with child-specific screens
export type RootStackParamList = {
  Login: undefined;
  // Child-related screens
  ChildrenList: undefined;
  ChildDetails: {child: Child};
  ChildActivities: {child?: Child}; // Optional for backward compatibility
  ChildActivityDetails: {activityId: string; child?: Child};
  // Blog screens
  BlogList: undefined;
  BlogPostDetails: {postId: string};
  // Profile screen
  Profile: {
    debugHandler?: () => void;
  };
  // Tab navigation types
  Status: undefined;
  Blog: undefined;
  Children: undefined; // New tab for children list
};

// API Service Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Enhanced Debug information
export interface DebugInfo {
  userId: string;
  userEmail: string;
  userRole: string;
  childrenFound: number;
  activitiesFound: number;
  timestamp: string;
  errors: string[];
  warnings: string[];
  childrenDetails: {
    id: string;
    name: string;
    kindergartenId: string;
    activitiesCount: number;
  }[];
  databaseApproach: 'children_collection' | 'reservations_fallback';
}

// Real-time listener types
export type ChildrenListener = (children: Child[]) => void;
export type ActivitiesListener = (activities: ChildActivity[]) => void;
export type UnsubscribeFunction = () => void;

// Firestore collection names (for consistency)
export const COLLECTIONS = {
  USERS: 'users',
  CHILDREN: 'children',
  CHILD_ACTIVITIES: 'childActivities',
  RESERVATIONS: 'reservations',
  BLOG: 'blog',
  KINDERGARTENS: 'kindergartens',
} as const;

// Activity types for validation
export const ACTIVITY_TYPES = {
  MEAL: 'meal',
  NAP: 'nap',
  ACTIVITY: 'activity',
  PLAY: 'play',
  LEARNING: 'learning',
  MEDICAL: 'medical',
  OUTDOOR: 'outdoor',
  ARTS: 'arts',
} as const;

export const MEAL_SUBTYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  SNACK: 'snack',
  DINNER: 'dinner',
} as const;

export const NAP_SUBTYPES = {
  MORNING_NAP: 'morning nap',
  AFTERNOON_NAP: 'afternoon nap',
  QUIET_TIME: 'quiet time',
} as const;

// Re-export Firebase types
export * from './firebase';
