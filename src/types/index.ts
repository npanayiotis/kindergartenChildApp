// User Types
export interface User {
  id: string;
  name: string;
  email: string;
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

// Child Status Types
export interface ChildStatus {
  id: string;
  childName: string;
  mood?: string;
  meal?: string;
  nap?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  kindergartenId?: string;
  parentId?: string;
}

// Blog Post Types
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  kindergartenId: string;
  kindergartenName?: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  ChildStatus: undefined;
  ChildStatusDetails: {childId: string};
  BlogList: undefined;
  BlogPostDetails: {postId: string};
  Profile: undefined;
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
