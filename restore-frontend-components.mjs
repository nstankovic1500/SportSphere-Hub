import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const changedFilesOutput = execFileSync(
  'git',
  ['diff', '--name-only', '--', 'frontend/src/app/components'],
  { encoding: 'utf8' },
);

const changedFiles = changedFilesOutput
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);

for (const file of changedFiles) {
  const content = execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' });
  writeFileSync(file, content, 'utf8');
}
