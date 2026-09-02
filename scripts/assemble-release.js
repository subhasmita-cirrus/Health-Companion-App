/**
 * Release APK: arm64, skip lint. Output:
 * android/app/build/outputs/apk/release/app-release.apk
 */
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const androidDir = path.join(__dirname, '..', 'android');
const isWin = process.platform === 'win32';
const gradlew = path.join(androidDir, isWin ? 'gradlew.bat' : 'gradlew');
const env = {
  ...process.env,
  GRADLE_USER_HOME: process.env.GRADLE_USER_HOME || path.join(os.homedir(), '.gradle'),
};

const child = spawn(
  gradlew,
  ['app:assembleRelease', '-x', 'lint', '-PreactNativeArchitectures=arm64-v8a'],
  { cwd: androidDir, env, stdio: 'inherit', shell: isWin }
);

child.on('exit', (code) => process.exit(code ?? 1));
