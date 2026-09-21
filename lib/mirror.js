import fs from 'fs';
import path from 'path';

// 镜像文件实际存放目录（不进 git 仓库）。
// 部署时可复用默认值，或通过环境变量 MIRROR_DIR 覆盖。
const MIRROR_DIR = process.env.MIRROR_DIR || '/var/www/mirror';

// nginx 用 alias 把 /files/ 映射到上面的目录，因此文件的下载地址以 /files 开头。
export const FILES_BASE = '/files';

export function humanSize(bytes) {
  if (typeof bytes !== 'number' || bytes < 0) return '-';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(mtimeMs) {
  if (!mtimeMs) return '';
  const d = new Date(mtimeMs);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 把一组路径片段安全地解析到镜像目录内；越界则返回 null。
function resolveSafe(segments) {
  const base = path.resolve(MIRROR_DIR);
  const target = path.resolve(MIRROR_DIR, ...(segments || []));
  if (target !== base && !target.startsWith(base + path.sep)) return null;
  return target;
}

function encodeSegments(segments) {
  return (segments || []).map((s) => encodeURIComponent(s)).join('/');
}

// 列出镜像目录下的子目录与文件。segments 为相对路径片段数组。
// 目录缺失或越界时返回 null，由页面提示。
export function listMirror(segments = []) {
  const dir = resolveSafe(segments);
  if (!dir) return null;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return null;
  }

  const dirs = [];
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    let st;
    try {
      st = fs.statSync(abs);
    } catch (e) {
      continue;
    }
    if (entry.isDirectory()) {
      dirs.push({ name: entry.name, mtime: st.mtimeMs });
    } else if (entry.isFile()) {
      files.push({ name: entry.name, size: st.size, mtime: st.mtimeMs });
    }
  }

  dirs.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  files.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  const base = segments.length ? '/' + encodeSegments(segments) : '';
  return {
    dirs: dirs.map((d) => ({
      name: d.name,
      date: formatDate(d.mtime),
      href: `/downloads${base}/${encodeURIComponent(d.name)}/`,
    })),
    files: files.map((f) => ({
      name: f.name,
      size: f.size,
      sizeText: humanSize(f.size),
      date: formatDate(f.mtime),
      href: `${FILES_BASE}${base}/${encodeURIComponent(f.name)}`,
    })),
  };
}
