/**
 * Mock Firebase implementations for testing and development
 * Used as a fallback when real Firebase services are not available
 */

// Mock Auth
export const createMockAuth = () => ({
  currentUser: null,
  signInWithEmailAndPassword: async (email: string, _password: string) => {
    console.log('[MOCK] Sign in called with:', email);
    return {
      user: {
        uid: 'mock-user-id',
        email: email,
        displayName: 'Mock User',
        role: 'parent',
      },
    };
  },
  signOut: async () => {
    console.log('[MOCK] Sign out called');
  },
});

// Mock Firestore
export const createMockFirestore = () => ({
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({
        exists: true,
        id: id,
        data: () => {
          if (name === 'users') {
            return {
              name: 'Mock User',
              role: 'parent',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
          return {
            childName: 'Mock Child',
            mood: 'Happy',
            meal: 'Good',
            nap: true,
            notes: 'Mock notes',
            createdAt: new Date(),
            updatedAt: new Date(),
            parentId: 'mock-parent-id',
            kindergartenId: 'mock-kindergarten-id',
          };
        },
      }),
      update: async (data: any) =>
        console.log('[MOCK] Updating document', data),
    }),
    where: () => ({
      get: async () => ({
        empty: false,
        size: 1,
        docs: [
          {
            id: 'mock-doc-id',
            exists: true,
            data: () => {
              if (name === 'childStatus') {
                return {
                  childName: 'Mock Child',
                  mood: 'Happy',
                  meal: 'Good',
                  nap: true,
                  notes: 'Mock notes',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  parentId: 'mock-parent-id',
                  kindergartenId: 'mock-kindergarten-id',
                };
              }
              return {
                title: 'Mock Data',
                content: 'Mock content',
              };
            },
          },
        ],
      }),
    }),
    orderBy: () => ({
      get: async () => ({
        empty: false,
        docs: [
          {
            id: 'mock-blog-id',
            exists: true,
            data: () => ({
              title: 'Mock Blog Post',
              content: 'Mock content',
              createdAt: new Date(),
              updatedAt: new Date(),
              kindergartenId: 'mock-kindergarten-id',
              kindergartenName: 'Mock Kindergarten',
            }),
          },
        ],
      }),
    }),
  }),
});
