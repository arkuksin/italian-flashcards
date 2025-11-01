import { execSync } from 'node:child_process';

function run(command) {
  execSync(command, { stdio: 'inherit', env: process.env });
}

try {
  console.log('Running database migrations before Vercel build...');
  run('npm run migrate');
  console.log('Migrations completed successfully.');
} catch (error) {
  console.error('Database migrations failed. Aborting Vercel build.');
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
}
