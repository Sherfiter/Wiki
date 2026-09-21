import Link from 'next/link';
import Layout from '../../components/Layout';
import { listMirror } from '../../lib/mirror';

export default function Downloads({ segments, data }) {
  const crumbs = segments.map((s, i) => ({
    name: s,
    href: `/downloads/${segments.slice(0, i + 1).map((x) => encodeURIComponent(x)).join('/')}/`,
  }));

  return (
    <Layout title="镜像站">
      <div className="wiki bg-neutral-200/10">
        <h1>镜像站</h1>
        <p className="not-wiki text-slate-600 dark:text-slate-300">
          这里放一些不方便直接下载的资源（Docker 镜像、ISO、课程资料等），供同学下载。
        </p>

        <nav className="not-wiki my-4 text-sm text-slate-500">
          <Link href="/downloads/" className="text-sky-500 hover:text-sky-400">
            镜像站
          </Link>
          {crumbs.map((c) => (
            <span key={c.href}>
              {' / '}
              <Link href={c.href} className="text-sky-500 hover:text-sky-400">
                {c.name}
              </Link>
            </span>
          ))}
        </nav>

        {!data ? (
          <p className="not-wiki text-red-500">目录不存在或读取失败，请稍后再试。</p>
        ) : data.dirs.length === 0 && data.files.length === 0 ? (
          <p className="not-wiki text-slate-500">（空目录，还没有上传文件）</p>
        ) : (
          <ul className="not-wiki divide-y divide-slate-200 dark:divide-slate-700">
            {data.dirs.map((d) => (
              <li key={d.name} className="flex items-center justify-between gap-4 py-2">
                <Link
                  href={d.href}
                  className="font-medium text-sky-600 dark:text-sky-400 hover:underline break-all"
                >
                  {d.name}/
                </Link>
                <span className="shrink-0 text-xs text-slate-500 tabular-nums">{d.date}</span>
              </li>
            ))}
            {data.files.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-4 py-2">
                <a
                  href={f.href}
                  className="font-medium text-slate-800 dark:text-slate-200 hover:text-sky-500 break-all"
                >
                  {f.name}
                </a>
                <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                  {f.sizeText}
                  {f.date ? ` · ${f.date}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  const segments = (params?.dir ?? []).filter(Boolean);
  const data = listMirror(segments);
  return { props: { segments, data } };
}
