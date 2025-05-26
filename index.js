/**
 * @format
 * React Native Entry Point - CLEAN VERSION
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

console.log('[APP] Registering app component');
AppRegistry.registerComponent(appName, () => App);
