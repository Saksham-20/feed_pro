const os = require('os');
const { execSync } = require('child_process');

if (os.platform() === 'darwin') {
  try {
    console.log('Running pod install (macOS only)...');
    execSync('cd ios && pod install', { stdio: 'inherit' });
  } catch (e) {
    console.warn('Pod install failed:', e.message);
  }
} else {
  console.log('Skipping pod install on non-macOS platform.');
}
