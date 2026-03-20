// Auto-sync: pulls content/ from origin/draft every 2 minutes
const { execSync } = require('child_process');

const INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

function sync() {
  try {
    execSync('git fetch origin draft && git checkout origin/draft -- content/', {
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    console.log(`[auto-sync] pulled content from draft (${new Date().toLocaleTimeString()})`);
  } catch (e) {
    console.error('[auto-sync] error:', e.stderr?.toString().trim() || e.message);
  }
}

// Run once immediately on start, then on interval
sync();
setInterval(sync, INTERVAL_MS);
