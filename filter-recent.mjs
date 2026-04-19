import { readFileSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';

const days = parseInt(process.argv[2] ?? '7', 10);
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - days);

const contentDir = join(process.cwd(), 'content');
const files = readdirSync(contentDir).filter(f => f.endsWith('.md'));

let kept = 0;
let removed = 0;

for (const file of files) {
  const filePath = join(contentDir, file);
  const content = readFileSync(filePath, 'utf8');

  const parts = content.split('---');
  const frontmatter = parts.length >= 3 ? parts[1] : '';

  const dateMatch = frontmatter.match(/^date:\s*(\d{4}-\d{2}-\d{2})\s*$/m);

  if (!dateMatch) {
    kept++;
    continue;
  }

  const fileDate = new Date(dateMatch[1]);

  if (fileDate < cutoff) {
    unlinkSync(filePath);
    removed++;
  } else {
    kept++;
  }
}

console.log(`Done. Kept: ${kept}, Removed: ${removed} (older than ${days} days)`);
