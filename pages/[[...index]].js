import { MDXRemote } from 'next-mdx-remote';
import { getContent } from '../lib/mdx';
import { getAllPaths } from '../lib/fs';
import Layout from '../components/Layout';
import { mdxComponents } from '../components/mdx';

export default function Page({ source, frontmatter }) {
  return (
    <Layout title={frontmatter?.title}>
      <div className="wiki bg-neutral-200/10">
        <MDXRemote {...source} components={mdxComponents} />
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
  return getContent(index);
}
