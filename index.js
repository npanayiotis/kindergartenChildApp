/**
 * @format
 * React Native Entry Point - FIXED VERSION
 */

import {AppRegistry, LogBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Ignore specific warnings during development
LogBox.ignoreLogs([
  'This method is deprecated', // Firebase v22 deprecation warnings
  'Warning: Failed prop type',
  'componentWillReceiveProps',
  'componentWillMount',
]);

console.log('[APP] Registering app component:', appName);

try {
  AppRegistry.registerComponent(appName, () => App);
  console.log('[APP] App registration successful');
} catch (error) {
  console.error('[APP] App registration failed:', error);
}
