const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const prismaBin = path.join(root, 'node_modules/.bin/prisma');
const schema = path.join(root, 'packages/database/prisma/schema.prisma');
const main = path.resolve(__dirname, '../dist/src/main.js');

function run(label, command, args) {
  console.log(`[start-prod] ${label}...`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error(`[start-prod] ${label} failed with code ${result.status ?? result.signal}`);
    process.exit(result.status ?? 1);
  }
}

// Deploy pending Prisma migrations automatically on startup so you don't need
// a Render shell or manual CLI access.
run('Deploying database migrations', process.execPath, [prismaBin, 'migrate', 'deploy', '--schema', schema]);

// Start the NestJS application.
run('Starting backend', process.execPath, [main]);
