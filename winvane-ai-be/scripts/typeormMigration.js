const { execSync } = require('child_process');
const path = require('path');

const action = process.argv[2];
let name = process.argv[3] || process.env.npm_config_name;

if (!name) {
  process.stderr.write(
    'Error: Migration name is required. Usage: npm run migration:generate --name=MigrationName or npm run migration:generate MigrationName\n',
  );
  process.exit(1);
}

// Strip leading '--name=' if passed via npm arg
if (name.startsWith('--name=')) {
  name = name.replace('--name=', '');
}

const migrationPath = `src/database/migrations/${name}`;
const dataSourcePath = 'src/database/dataSource.ts';

let cmd = '';
if (action === 'generate') {
  cmd = `npx typeorm-ts-node-commonjs -d ${dataSourcePath} migration:generate ${migrationPath}`;
} else if (action === 'create') {
  cmd = `npx typeorm-ts-node-commonjs migration:create ${migrationPath}`;
} else {
  process.stderr.write(`Unknown action: ${action}\n`);
  process.exit(1);
}

try {
  execSync(cmd, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
} catch (error) {
  process.exit(error.status || 1);
}
