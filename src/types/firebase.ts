// Type declarations for Firebase
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  name?: string;
  photoURL?: string | null;
  role?: string;
  getIdTokenResult: () => Promise<{claims: Record<string, any>}>;
}

export interface FirebaseAuth {
  currentUser: FirebaseUser | null;
  signInWithEmailAndPassword: (
    email: string,
    password: string,
  ) => Promise<{user: FirebaseUser}>;
  signOut: () => Promise<void>;
  onAuthStateChanged: (
    callback: (user: FirebaseUser | null) => void,
  ) => () => void;
}

export interface FirebaseDocumentSnapshot<T = any> {
  id: string;
  exists: boolean;
  data: () => T | null;
}

export interface FirebaseQuerySnapshot<T = any> {
  docs: FirebaseDocumentSnapshot<T>[];
  empty: boolean;
  size: number;
  forEach: (callback: (doc: FirebaseDocumentSnapshot<T>) => void) => void;
}

export interface FirebaseDocumentReference<T = any> {
  get: () => Promise<FirebaseDocumentSnapshot<T>>;
  update: (data: Partial<T>) => Promise<void>;
  set: (data: T, options?: {merge?: boolean}) => Promise<void>;
}

export interface FirebaseQuery<T = any> {
  where: (field: string, operator: string, value: any) => FirebaseQuery<T>;
  orderBy: (field: string, direction?: 'asc' | 'desc') => FirebaseQuery<T>;
  limit: (limit: number) => FirebaseQuery<T>;
  get: () => Promise<FirebaseQuerySnapshot<T>>;
  doc: (id: string) => FirebaseDocumentReference<T>;
}

export interface FirebaseCollectionReference<T = any> extends FirebaseQuery<T> {
  doc: (id: string) => FirebaseDocumentReference<T>;
}

export interface FirebaseFirestore {
  collection: (name: string) => FirebaseCollectionReference;
}

export interface FirebaseApp {
  name: string;
}

export interface Firebase {
  apps: FirebaseApp[];
  initializeApp: (config: Record<string, string>) => FirebaseApp;
}
