import fs from 'fs';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import x86asm from 'highlight.js/lib/languages/x86asm';
import http from 'highlight.js/lib/languages/http';
import rehypeSlug from 'rehype-slug';
import { resolveContentFile } from './fs';

export async function getContent(index) {
  const file = resolveContentFile(index);
  if (!file) return { notFound: true };

  const raw = fs.readFileSync(file, 'utf8');
  const { data, content } = matter(raw);

  const source = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeKatex, [rehypeHighlight, { languages: { dockerfile, x86asm, http } }], rehypeSlug],
      format: 'mdx',
    },
    scope: data,
    parseFrontmatter: false,
  });

  return {
    props: {
      source,
      frontmatter: data,
    },
  };
}
