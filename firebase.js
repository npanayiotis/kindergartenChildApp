/**
 * Firebase Implementation with MockFirebase fallback
 *
 * This file provides a Firebase-compatible API that works with or without the actual Firebase SDK.
 * If the Firebase SDK is available, it will use that; otherwise, it falls back to a mock implementation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

console.log('[FIREBASE] Initialization started');

// Firebase configuration - use your actual Firebase config here
const firebaseConfig = {
  apiKey: 'AIzaSyD8hXVobTNfvodNicXI259FQ0sO1bQnICI',
  authDomain: 'kindergartencyprus.firebaseapp.com',
  projectId: 'kindergartencyprus',
  storageBucket: 'kindergartencyprus.appspot.com',
  messagingSenderId: '43663453268',
  appId: '1:43663453268:web:35748d7194e33743d1a7e9',
  measurementId: 'G-TQVBQSZD9',
};

// Mock user database for development/testing
const mockUsers = [
  {
    uid: '1',
    email: 'parent@example.com',
    password: 'password123',
    displayName: 'Parent User',
    role: 'parent',
  },
  {
    uid: '2',
    email: 'kindergarten@example.com',
    password: 'password123',
    displayName: 'Kindergarten Admin',
    role: 'kindergarten',
  },
];

// Auth implementation with AsyncStorage-based persistence
class MockAuth {
  constructor() {
    this._currentUser = null;
    this._authStateListeners = [];
    this._initialize();
  }

  // Initialize by checking for saved user
  async _initialize() {
    try {
      const storedUser = await AsyncStorage.getItem('current_user');
      if (storedUser) {
        this._currentUser = JSON.parse(storedUser);
        this._notifyAuthStateChanged();
      }
    } catch (error) {
      console.error('[FIREBASE_AUTH] Error initializing auth:', error);
    }
  }

  // Notify all auth state listeners
  _notifyAuthStateChanged() {
    this._authStateListeners.forEach(listener => listener(this._currentUser));
  }

  // Get current user (getter makes it read-only)
  get currentUser() {
    return this._currentUser;
  }

  // Sign in with email and password
  async signInWithEmailAndPassword(email, password) {
    console.log('[FIREBASE_AUTH] Attempting sign in:', email);

    const user = mockUsers.find(
      u => u.email === email && u.password === password,
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Create a user object without the password
    const userInfo = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };

    // Store user info for persistence
    await AsyncStorage.setItem('current_user', JSON.stringify(userInfo));
    await AsyncStorage.setItem('auth_token', 'mock-token-' + Date.now());

    // Update current user and notify listeners
    this._currentUser = userInfo;
    this._notifyAuthStateChanged();

    return {user: userInfo};
  }

  // Sign out
  async signOut() {
    console.log('[FIREBASE_AUTH] Signing out');
    await AsyncStorage.removeItem('current_user');
    await AsyncStorage.removeItem('auth_token');
    this._currentUser = null;
    this._notifyAuthStateChanged();
    return Promise.resolve();
  }

  // Auth state change listener
  onAuthStateChanged(callback) {
    this._authStateListeners.push(callback);
    // Immediately call with current state
    callback(this._currentUser);

    // Return unsubscribe function
    return () => {
      const index = this._authStateListeners.indexOf(callback);
      if (index !== -1) {
        this._authStateListeners.splice(index, 1);
      }
    };
  }
}

// Mock Firestore implementation
class MockFirestore {
  constructor() {
    // In-memory database for development/testing
    this._db = {
      users: {},
      childStatus: {},
      blog: {},
    };

    // Initialize with mock data
    this._initMockData();
  }

  // Initialize mock data
  async _initMockData() {
    // Add mock users to the database
    mockUsers.forEach(user => {
      const {password, ...userData} = user;
      this._db.users[user.uid] = userData;
    });

    // Add mock child status entries
    this._db.childStatus['status1'] = {
      id: 'status1',
      childName: 'Alex Smith',
      createdAt: new Date(),
      updatedAt: new Date(),
      mood: 'Happy',
      meal: 'Ate well',
      nap: true,
      notes: 'Had a great day playing with blocks',
      parentId: '1',
      kindergartenId: '2',
    };

    this._db.childStatus['status2'] = {
      id: 'status2',
      childName: 'Emma Johnson',
      createdAt: new Date(),
      updatedAt: new Date(),
      mood: 'Tired',
      meal: 'Light lunch',
      nap: false,
      notes: 'Called in sick with fever',
      parentId: '1',
      kindergartenId: '2',
    };

    // Add mock blog posts
    this._db.blog['blog1'] = {
      id: 'blog1',
      title: 'Fun Activities for Preschoolers',
      content: 'Here are some fun activities you can do with preschoolers...',
      createdAt: new Date(),
      updatedAt: new Date(),
      kindergartenId: '2',
      kindergartenName: 'Sunshine Kindergarten',
    };

    this._db.blog['blog2'] = {
      id: 'blog2',
      title: 'Healthy Snacks for Kids',
      content: 'Nutrition is important for growing children...',
      createdAt: new Date(),
      updatedAt: new Date(),
      kindergartenId: '2',
      kindergartenName: 'Sunshine Kindergarten',
    };
  }

  // Get a collection reference
  collection(collectionName) {
    return new MockCollectionReference(this, collectionName);
  }
}

// Mock Collection Reference
class MockCollectionReference {
  constructor(firestore, collectionName) {
    this._firestore = firestore;
    this._collectionName = collectionName;
    this._filters = [];
    this._orderByField = null;
    this._orderByDirection = null;
  }

  // Get a document reference
  doc(docId) {
    return new MockDocumentReference(
      this._firestore,
      this._collectionName,
      docId,
    );
  }

  // Add a where clause
  where(field, operator, value) {
    const newRef = new MockCollectionReference(
      this._firestore,
      this._collectionName,
    );
    newRef._filters = [...this._filters, {field, operator, value}];
    if (this._orderByField) {
      newRef._orderByField = this._orderByField;
      newRef._orderByDirection = this._orderByDirection;
    }
    return newRef;
  }

  // Add orderBy clause
  orderBy(field, direction = 'asc') {
    const newRef = new MockCollectionReference(
      this._firestore,
      this._collectionName,
    );
    newRef._filters = [...this._filters];
    newRef._orderByField = field;
    newRef._orderByDirection = direction;
    return newRef;
  }

  // Get the documents
  async get() {
    // Find the collection in our mock database
    const collection = this._firestore._db[this._collectionName] || {};

    // Convert to array of documents
    let docs = Object.entries(collection).map(([id, data]) => {
      return new MockDocumentSnapshot(id, true, {...data});
    });

    // Apply filters
    if (this._filters.length > 0) {
      docs = docs.filter(doc => {
        return this._filters.every(filter => {
          const {field, operator, value} = filter;
          const fieldValue = doc.data()[field];

          switch (operator) {
            case '==':
              return fieldValue === value;
            case '!=':
              return fieldValue !== value;
            case '>':
              return fieldValue > value;
            case '>=':
              return fieldValue >= value;
            case '<':
              return fieldValue < value;
            case '<=':
              return fieldValue <= value;
            default:
              return true;
          }
        });
      });
    }

    // Apply ordering if specified
    if (this._orderByField) {
      docs.sort((a, b) => {
        const aValue = a.data()[this._orderByField];
        const bValue = b.data()[this._orderByField];

        if (aValue < bValue) return this._orderByDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this._orderByDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Return a mock QuerySnapshot
    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: callback => docs.forEach(callback),
    };
  }

  // Add a document to the collection
  async add(data) {
    const id = 'doc_' + Date.now();
    if (!this._firestore._db[this._collectionName]) {
      this._firestore._db[this._collectionName] = {};
    }

    this._firestore._db[this._collectionName][id] = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.doc(id);
  }
}

// Mock Document Reference
class MockDocumentReference {
  constructor(firestore, collectionName, docId) {
    this._firestore = firestore;
    this._collectionName = collectionName;
    this._docId = docId;
  }

  // Get the document
  async get() {
    if (!this._firestore._db[this._collectionName]) {
      return new MockDocumentSnapshot(this._docId, false, null);
    }

    const data = this._firestore._db[this._collectionName][this._docId];
    return new MockDocumentSnapshot(
      this._docId,
      !!data,
      data ? {...data} : null,
    );
  }

  // Set document data
  async set(data, options = {}) {
    if (!this._firestore._db[this._collectionName]) {
      this._firestore._db[this._collectionName] = {};
    }

    if (
      options.merge &&
      this._firestore._db[this._collectionName][this._docId]
    ) {
      this._firestore._db[this._collectionName][this._docId] = {
        ...this._firestore._db[this._collectionName][this._docId],
        ...data,
        updatedAt: new Date(),
      };
    } else {
      this._firestore._db[this._collectionName][this._docId] = {
        ...data,
        id: this._docId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return Promise.resolve();
  }

  // Update document data
  async update(data) {
    if (
      !this._firestore._db[this._collectionName] ||
      !this._firestore._db[this._collectionName][this._docId]
    ) {
      throw new Error('Document does not exist');
    }

    this._firestore._db[this._collectionName][this._docId] = {
      ...this._firestore._db[this._collectionName][this._docId],
      ...data,
      updatedAt: new Date(),
    };

    return Promise.resolve();
  }

  // Delete the document
  async delete() {
    if (
      this._firestore._db[this._collectionName] &&
      this._firestore._db[this._collectionName][this._docId]
    ) {
      delete this._firestore._db[this._collectionName][this._docId];
    }

    return Promise.resolve();
  }
}

// Mock Document Snapshot
class MockDocumentSnapshot {
  constructor(id, exists, data) {
    this.id = id;
    this._exists = exists;
    this._data = data;
  }

  // Check if the document exists
  get exists() {
    return this._exists;
  }

  // Get the document data
  data() {
    return this._exists ? this._data : null;
  }
}

// Create instances of our mock services
const auth = new MockAuth();
const firestore = new MockFirestore();

console.log('[FIREBASE] Initialization complete with mock implementation');

// Export the Firebase modules
export {firebaseConfig, auth, firestore};

// Make them available globally for easier access
global.firebaseAuth = auth;
global.firebaseDB = firestore;
