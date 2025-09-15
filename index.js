/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

if (!__DEV__) {
  console.warn = () => {};
  console.log = () => {};
  console.error = () => {};
  console.info = () => {};
}
AppRegistry.registerComponent(appName, () => App);
