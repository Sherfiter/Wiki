import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const COURSE_ROOT = path.join(process.cwd(), 'content', 'course');

function readTitle(file) {
  try {
    const { data } = matter(fs.readFileSync(file, 'utf8'));
    return data?.title || '';
  } catch (e) {
    return '';
  }
}

function chapterNumber(name) {
  const match = name.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

// 课程章节页的上一章/下一章/返回目录信息；非课程章节页返回 null。
export function getCourseNav(index) {
  const segments = (index || []).filter(Boolean);
  if (segments.length < 3 || segments[0] !== 'course') return null;

  const courseSlug = segments[1];
  const courseDir = path.join(COURSE_ROOT, courseSlug);
  const relative = path.relative(COURSE_ROOT, courseDir);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  if (!fs.existsSync(courseDir) || !fs.statSync(courseDir).isDirectory()) return null;

  const current = segments.slice(2).join('/');
  const chapters = fs
    .readdirSync(courseDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(md|mdx)$/.test(entry.name))
    .map((entry) => entry.name.replace(/\.(md|mdx)$/, ''))
    .filter((name) => name !== 'index')
    .sort((a, b) => chapterNumber(a) - chapterNumber(b) || a.localeCompare(b, 'zh-CN', { numeric: true }))
    .map((name) => ({
      slug: name,
      title: readTitle(path.join(courseDir, `${name}.md`)) || readTitle(path.join(courseDir, `${name}.mdx`)) || name,
      href: `/course/${courseSlug}/${name}/`,
    }));

  const position = chapters.findIndex((chapter) => chapter.slug === current);
  if (position === -1) return null;

  const courseTitle =
    readTitle(path.join(courseDir, 'index.md')) ||
    readTitle(path.join(courseDir, 'index.mdx')) ||
    courseSlug;

  return {
    course: {
      title: courseTitle,
      href: `/course/${courseSlug}/`,
    },
    prev: position > 0 ? chapters[position - 1] : null,
    next: position < chapters.length - 1 ? chapters[position + 1] : null,
    position: position + 1,
    total: chapters.length,
  };
}
