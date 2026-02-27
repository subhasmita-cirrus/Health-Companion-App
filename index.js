/**
 * @format
 * Register "baymax" first, then load App lazily so a failing dependency shows the real error.
 */

const { AppRegistry } = require('react-native');
const { name: appName } = require('./app.json');

AppRegistry.registerComponent(appName, () => require('./App').default);

try {
  const { getApps, initializeApp } = require('@react-native-firebase/app');
  const firebaseConfig = require('./src/config/firebase-app-config.js');
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
} catch (e) {
  // Firebase init optional; app can still run
}
