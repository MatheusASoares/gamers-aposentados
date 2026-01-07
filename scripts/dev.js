#!/usr/bin/env node
const fs = require('fs');
const concurrentlyModule = require('concurrently');
const concurrently = concurrentlyModule.default || concurrentlyModule;

const commands = [
  { command: 'npm --prefix frontend run dev', name: 'frontend' }
];

if (fs.existsSync('backend/package.json')) {
  commands.push({ command: 'npm --prefix backend run dev', name: 'backend' });
} else {
  console.log('No backend/package.json found; starting frontend only.');
}

const runner = concurrently(commands, { prefix: 'name', killOthers: ['failure', 'success'] });
if (runner && typeof runner.then === 'function') {
  runner.then(() => process.exit(0)).catch(() => process.exit(1));
} else if (runner && runner.result && typeof runner.result.then === 'function') {
  runner.result.then(() => process.exit(0)).catch(() => process.exit(1));
} else {
  // Fallback: keep process alive until interrupted
  process.on('SIGINT', () => process.exit(0));
}
