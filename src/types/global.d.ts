import {FirebaseAuth, Firebase, FirebaseFirestore} from './firebase';

// Global type declarations
declare global {
  var firebase: Firebase;
  var firebaseAuth: FirebaseAuth;
  var firebaseDB: FirebaseFirestore;
}

// Firebase module type declaration
declare module '../../firebaseRN' {
  export const firebase: Firebase;
  export const auth: FirebaseAuth;
  export const firestore: FirebaseFirestore;
  export const firebaseConfig: Record<string, string>;
  export const usingMockImplementation: boolean;
}
