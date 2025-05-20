/**
 * @format
 * React Native Entry Point
 *
 * IMPORTANT: Firebase initialization is done before any React components
 * are loaded to ensure the auth component is registered properly.
 */

// Initialize Firebase first, before anything else
console.log('[APP] Starting Firebase initialization...');
require('./firebase');
console.log('[APP] Firebase initialization complete');

// Then import other modules
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Register the app component
console.log('[APP] Registering app component');
AppRegistry.registerComponent(appName, () => App);
