import { zhExplain } from '../lib/project-zh';

// 纯展示组件：数据由 getStaticProps 在构建/再生成时取好，随 HTML 一起下发。
// 所以没有 JS 也能看到内容，也不会出现「先空白再加载」。
const SOURCES = [
  { name: 'GitHub Trending', url: 'https://github.com/trending?since=daily' },
  { name: 'Solidot', url: 'https://www.solidot.org/' },
];

export default function DailyDigest({ data, projects = 12, error = '' }) {
  if (!data) {
    return (
      <p>
        这次没抓到内容{error ? `（${error}）` : ''}，可以直接去{' '}
        {SOURCES.map((s, i) => (
          <span key={s.name}>
            {i > 0 && ' / '}
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.name}
            </a>
          </span>
        ))}{' '}
        看。
      </p>
    );
  }

  const projectList = (data.projects || []).slice(0, projects);
  const newsGroups = data.news || [];
  const sourceList = data.sources?.length ? data.sources : SOURCES;

  return (
    <>
      <p className="text-sm opacity-70">
        {data.date} · 更新于 {data.updatedAt}（UTC+8）· 每半小时自动更新
        {data.stale ? ' · 上游暂时不可用，部分内容为上次抓取的结果' : ''}
        {' · 来源：'}
        {sourceList.map((s, i) => (
          <span key={s.name}>
            {i > 0 && ' / '}
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.name}
            </a>
          </span>
        ))}
      </p>

      {projectList.length > 0 && (
        <>
          <h3>开源项目</h3>
          <ul>
            {projectList.map((p) => (
              <li key={p.name}>
                <a href={p.url} target="_blank" rel="noopener noreferrer">
                  {p.name}
                </a>
                {p.lang ? ` · ${p.lang}` : ''}
                {p.starsToday ? ` · 今日 +${p.starsToday}` : ''}
                {p.stars ? ` · ⭐ ${p.stars}` : ''}
                {` —— ${p.zh || zhExplain(p)}`}
                {p.desc ? <div className="text-xs opacity-60">{p.desc}</div> : null}
              </li>
            ))}
          </ul>
        </>
      )}

      {newsGroups.length > 0 && (
        <>
          <h3>新闻</h3>
          <div className="grid gap-x-8 md:grid-cols-2">
            {newsGroups.map((g) => (
              <section key={g.category}>
                <h4>{g.category}</h4>
                <ul>
                  {g.items.map((n) => (
                    <li key={n.url}>
                      <a
                        href={n.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={n.summary || undefined}
                      >
                        {n.title}
                      </a>
                      {n.time ? <span className="text-xs opacity-60"> {n.time}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {data.newsMissing?.length > 0 && (
            <p className="text-sm opacity-70 mt-2">
              最近一周没有更新的板块：{data.newsMissing.join('、')}。
            </p>
          )}
        </>
      )}
    </>
  );
}
