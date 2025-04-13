import { AppRegistry } from 'react-native';
import App from './App'; // Root component from App.tsx
import { name as appName } from './app.json';

/**
 * Entry point for the Cosmic Flip React Native app.
 * Registers the root App component with AppRegistry.
 */
AppRegistry.registerComponent(appName, () => App);