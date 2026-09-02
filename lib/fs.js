import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(md|mdx)$/.test(entry.name)) {
      files.push(full);
    }
  }
}

// Returns the list of { params: { index: [...] } } for the catch-all route.
export function getAllPaths() {
  const files = [];
  walk(CONTENT_DIR, files);

  return files.map((file) => {
    let rel = path.relative(CONTENT_DIR, file);
    rel = rel.replace(/\.(md|mdx)$/, '');
    let parts = rel.split(path.sep);
    if (parts[parts.length - 1] === 'index') parts.pop();
    const index = parts.filter(Boolean);
    return { params: { index } };
  });
}

export function resolveContentFile(index) {
  const segments = (index || []).filter(Boolean);
  const base = path.join(CONTENT_DIR, ...segments);

  const candidates = [
    path.join(base, 'index.md'),
    path.join(base, 'index.mdx'),
  ];
  if (segments.length) {
    candidates.push(base + '.md');
    candidates.push(base + '.mdx');
  }

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}
