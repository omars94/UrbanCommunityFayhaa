/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.warn = () => {};
console.error = () => {};
console.info = () => {};
AppRegistry.registerComponent(appName, () => App);
