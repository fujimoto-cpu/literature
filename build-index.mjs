import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// --- Helpers ---

function parseYamlFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const yaml = match[1];
  const result = {};
  let currentKey = null;
  let inList = false;

  for (const line of yaml.split(/\r?\n/)) {
    // List item
    const listMatch = line.match(/^  - (.*)$/);
    if (listMatch && currentKey && inList) {
      const val = listMatch[1].trim().replace(/^["']|["']$/g, '');
      result[currentKey].push(val);
      continue;
    }

    // Key: value
    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const raw = kvMatch[2].trim();

      if (raw === '' || raw === null) {
        // Could be the start of a block list
        result[currentKey] = [];
        inList = true;
      } else if (raw.startsWith('[')) {
        // Inline list: [a, b, c]
        inList = false;
        const inner = raw.replace(/^\[|\]$/g, '');
        result[currentKey] = inner
          .split(',')
          .map(s => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else {
        inList = false;
        result[currentKey] = raw.replace(/^["']|["']$/g, '');
      }
      continue;
    }

    // Not a list item or kv → reset
    if (line.trim() === '') {
      inList = false;
    }
  }

  return result;
}

function generateSlug(title) {
  if (!title) return '';
  // Match Quartz: replace spaces with hyphens, keep other unicode chars
  return title.replace(/ /g, '-');
}

function detectSourceIcon(source) {
  if (!source) return '🌐';
  const s = source.toLowerCase();
  if (s === 'youtube') return '▶️';
  if (s === 'instagram') return '📷';
  if (s === 'x') return '𝕏';
  if (s === 'threads') return '🧵';
  return '🌐';
}

function extractYouTubeVideoId(url) {
  if (!url) return null;
  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/watch?v=ID
  const longMatch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  // youtube.com/shorts/ID
  const shortsMatch = url.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  return null;
}

function extractInstagramShortcode(url) {
  if (!url) return null;
  // instagram.com/p/CODE/ or instagram.com/reel/CODE/
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  return null;
}

function findInstagramThumb(shortcode, contentDir) {
  const thumbsDir = join(contentDir, 'thumbs');
  const candidates = [
    `${shortcode}_1_thumb.jpg`,
    `${shortcode}_1.jpg`,
  ];
  for (const name of candidates) {
    if (existsSync(join(thumbsDir, name))) {
      return `thumbs/${name}`;
    }
  }
  return null;
}

// --- Main ---

const contentDir = join(process.cwd(), 'content');
const publicDir = join(process.cwd(), 'public');
const templatePath = join(process.cwd(), 'index-template.html');
const uiJsPath = join(process.cwd(), 'quartz', 'static', 'literature-ui.js');

// Ensure public dir exists
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Read all .md files from content/
let mdFiles;
try {
  mdFiles = readdirSync(contentDir).filter(f => f.endsWith('.md'));
} catch (err) {
  console.error(`Failed to read content directory: ${contentDir}`);
  console.error(err.message);
  process.exit(1);
}

const articles = [];

for (const filename of mdFiles) {
  const filePath = join(contentDir, filename);
  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.warn(`Skipping ${filename}: ${err.message}`);
    continue;
  }

  const fm = parseYamlFrontmatter(content);

  const title = fm.title || filename.replace(/\.md$/, '');
  const date = fm.date || '';
  const source = (fm.source || 'web').toLowerCase();
  const url = fm.url || '';
  const tags = Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []);
  const slug = generateSlug(title);
  const sourceIcon = detectSourceIcon(source);

  // Determine thumbnail
  let thumbnail = fm.thumbnail || '';

  if (!thumbnail) {
    if (source === 'youtube') {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    } else if (source === 'instagram') {
      const shortcode = extractInstagramShortcode(url);
      if (shortcode) {
        const localThumb = findInstagramThumb(shortcode, contentDir);
        if (localThumb) {
          thumbnail = localThumb;
        }
      }
    }
  }

  articles.push({
    title,
    date,
    source,
    url,
    tags,
    thumbnail,
    slug,
    sourceIcon,
  });
}

// Sort by date descending (ISO date strings sort lexicographically)
articles.sort((a, b) => {
  if (a.date < b.date) return 1;
  if (a.date > b.date) return -1;
  return 0;
});

// Count by source
const total = articles.length;
const xCount = articles.filter(a => a.source === 'x').length;
const igCount = articles.filter(a => a.source === 'instagram').length;
const ytCount = articles.filter(a => a.source === 'youtube').length;
const threadsCount = articles.filter(a => a.source === 'threads').length;

console.log(`Found ${total} articles (YT:${ytCount} IG:${igCount} X:${xCount} Threads:${threadsCount})`);

// --- Generate public/index.html ---

let template;
try {
  template = readFileSync(templatePath, 'utf-8');
} catch (err) {
  console.error(`Failed to read template: ${templatePath}`);
  console.error(err.message);
  process.exit(1);
}

const articlesJson = JSON.stringify(articles);

const html = template
  .replace('{{ARTICLES_JSON}}', articlesJson)
  .replace('{{TOTAL}}', String(total))
  .replace('{{X_COUNT}}', String(xCount))
  .replace('{{IG_COUNT}}', String(igCount))
  .replace('{{YT_COUNT}}', String(ytCount))
  .replace('{{THREADS_COUNT}}', String(threadsCount));

const outputHtml = join(publicDir, 'index.html');
writeFileSync(outputHtml, html, 'utf-8');
console.log(`Written: ${outputHtml}`);

// --- Update quartz/static/literature-ui.js ---

const newFirstLine = `window._litArticles=${articlesJson};`;

if (existsSync(uiJsPath)) {
  const existing = readFileSync(uiJsPath, 'utf-8');
  const lines = existing.split('\n');

  let updated;
  if (lines[0].startsWith('window._litArticles=')) {
    // Replace line 1
    lines[0] = newFirstLine;
    updated = lines.join('\n');
  } else {
    // Prepend
    updated = newFirstLine + '\n' + existing;
  }

  writeFileSync(uiJsPath, updated, 'utf-8');
  console.log(`Updated: ${uiJsPath}`);
} else {
  console.warn(`literature-ui.js not found at ${uiJsPath} — skipping JS update`);
}
