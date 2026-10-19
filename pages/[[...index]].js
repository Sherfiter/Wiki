import { MDXRemote } from 'next-mdx-remote';
import { getContent } from '../lib/mdx';
import { getAllPaths } from '../lib/fs';
import { getDigest } from '../lib/digest';
import Layout from '../components/Layout';
import { mdxComponents } from '../components/mdx';

// 需要服务端抓数据的页面：构建时生成，之后每 30 分钟后台再生成一次
const REVALIDATE_PAGES = new Set(['daily']);

export default function Page({ source, frontmatter, digest }) {
  return (
    <Layout title={frontmatter?.title}>
      <div className="wiki bg-neutral-200/10">
        <MDXRemote
          {...source}
          components={mdxComponents}
          scope={{ ...source.scope, digest }}
        />
      </div>
    </Layout>
  );
}

export async function getStaticPaths() {
  const paths = getAllPaths();
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const index = params?.index || [];
  const page = await getContent(index);
  if (page.notFound) return page;

  const key = index.join('/');
  if (!REVALIDATE_PAGES.has(key)) return page;

  // 抓不到就用缓存兜底；连缓存都没有也照常出页面，组件会显示降级文案
  let digest = null;
  let error = '';
  try {
    digest = await getDigest({ force: true });
  } catch (e) {
    error = e?.message || '抓取失败';
  }

  return {
    props: {
      ...page.props,
      digest: digest ? { ...digest, error } : null,
    },
    revalidate: 1800,
  };
}
