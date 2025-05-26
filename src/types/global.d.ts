import {FirebaseAuth, Firebase, FirebaseFirestore} from './firebase';

// Global type declarations
declare global {
  var firebase: Firebase;
  var firebaseAuth: FirebaseAuth;
  var firebaseDB: FirebaseFirestore;
}

// React Native Firebase module declarations
declare module '@react-native-firebase/auth' {
  const auth: () => FirebaseAuth;
  export default auth;
}

declare module '@react-native-firebase/firestore' {
  const firestore: () => FirebaseFirestore;
  export default firestore;
}

declare module '@react-native-firebase/app' {
  const app: () => any;
  export default app;
}
