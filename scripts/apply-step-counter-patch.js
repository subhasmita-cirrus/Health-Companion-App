/**
 * Restores Oppo/ColorOS-safe accelerometer pedometer patches after npm install.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'patches', 'react-native-step-counter');
const dest = path.join(
  root,
  'node_modules',
  '@dongminyu',
  'react-native-step-counter',
  'android',
  'src',
  'main',
  'java',
  'com',
  'stepcounter'
);

const files = [
  ['StepCounterModule.kt', 'StepCounterModule.kt'],
  [path.join('services', 'SensorListenService.kt'), path.join('services', 'SensorListenService.kt')],
  [path.join('services', 'AccelerometerService.kt'), path.join('services', 'AccelerometerService.kt')],
];

if (!fs.existsSync(dest)) {
  process.exit(0);
}

for (const [from, to] of files) {
  const fromPath = path.join(src, from);
  const toPath = path.join(dest, to);
  if (!fs.existsSync(fromPath)) continue;
  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  fs.copyFileSync(fromPath, toPath);
}
