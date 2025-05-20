/**
 * @format
 * React Native Entry Point
 *
 * IMPORTANT: Firebase initialization is done before any React components
 * are loaded to ensure the auth component is registered properly.
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Initialize Firebase first
console.log('[APP] Starting Firebase initialization...');
try {
  require('./firebaseRN');
  console.log('[APP] Firebase initialization complete');
} catch (error) {
  console.error('[APP] Firebase initialization failed:', error);
}

// Register the app component
console.log('[APP] Registering app component');
AppRegistry.registerComponent(appName, () => App);
