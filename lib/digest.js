import fs from 'fs';
import path from 'path';

import { ruleZh, zhExplain } from './project-zh';
import { hasChinese, translateMany } from './translate';

// 只在服务端运行（API 路由里调用）
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const TTL = 30 * 60 * 1000; // 半小时内复用同一份数据，别把上游打爆
const MIN_FORCE_INTERVAL = 60 * 1000; // 强制刷新最快一分钟一次，防止被连点
const CACHE_MAX_AGE = 7 * 24 * 3600 * 1000; // 兜底数据超过一周就不要了
const CACHE_MAX_BYTES = 1024 * 1024;
const TRENDING_COOLDOWN = 2 * 3600 * 1000; // Trending 挂了就歇两小时，别每轮都白等
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'digest.json');

const DAY = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const WEEKDAY = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  weekday: 'long',
});

const SOURCES = [
  { name: 'GitHub Trending', url: 'https://github.com/trending?since=daily' },
  { name: 'Solidot', url: 'https://www.solidot.org/' },
  { name: 'IT之家', url: 'https://www.ithome.com/' },
  { name: '少数派', url: 'https://sspai.com/' },
  { name: '开源中国', url: 'https://www.oschina.net/news' },
  { name: 'InfoQ 中文', url: 'https://www.infoq.cn/' },
  { name: '机核', url: 'https://www.gcores.com/' },
  { name: '爱范儿', url: 'https://www.ifanr.com/' },
  { name: '新华网', url: 'http://www.xinhuanet.com/politics/' },
  { name: '中新网', url: 'https://www.chinanews.com.cn/' },
];

// 搜索结果里常见的垃圾仓库关键词，命中就丢掉
const BLOCKLIST =
  /(nsfw|porn|18\+|pussy|hentai|jailbreak|破甲|破解|cheat|crack|keygen|torrent|onlyfans|casino|博彩|杀猪盘|返利)/i;

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  middot: '·',
};

function decode(text) {
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

function strip(html) {
  return decode(
    String(html)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function cut(text, max) {
  const t = strip(text);
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

// 文楷字体没有 emoji，直接清掉免得显示成方块 / 乱码
function cleanText(text) {
  return strip(text)
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function cutClean(text, max) {
  return cut(cleanText(text), max);
}

// 中文长句优先切在句末，避免出现半截话
function cutZh(text, max = 110) {
  const t = cleanText(text);
  if (t.length <= max) return t;
  const head = t.slice(0, max);
  const end = Math.max(
    head.lastIndexOf('。'),
    head.lastIndexOf('！'),
    head.lastIndexOf('？'),
    head.lastIndexOf('；')
  );
  return end >= 30 ? head.slice(0, end + 1) : `${head}…`;
}

async function get(url, { accept = 'text/html', timeout = 9000, retry = 1 } = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: accept },
      cache: 'no-store',
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) {
      // 429 / 5xx 值得再试一次，4xx 就没必要了
      if (retry > 0 && (res.status === 429 || res.status >= 500)) {
        await new Promise((r) => setTimeout(r, 800));
        return get(url, { accept, timeout, retry: retry - 1 });
      }
      throw new Error(`${url} → HTTP ${res.status}`);
    }
    return res.text();
  } catch (e) {
    if (retry > 0) {
      await new Promise((r) => setTimeout(r, 800));
      return get(url, { accept, timeout, retry: retry - 1 });
    }
    throw new Error(`${url} → ${e.name === 'TimeoutError' ? '超时' : e.message}`);
  }
}

// ---------- 今日开源项目：先爬 Trending，失败就退回搜索 API ----------

function parseTrending(html, limit) {
  const items = [];
  const chunks = html.split('<article class="Box-row">').slice(1);
  for (const chunk of chunks) {
    const article = chunk.split('</article>')[0];
    const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(article);
    const repo = h2 && /href="\/([^"]+)"/.exec(h2[1]);
    if (!repo) continue;
    const name = repo[1];
    const lang = /itemprop="programmingLanguage">\s*([^<]+?)\s*</.exec(article);
    const today = /([\d,]+)\s*stars today/.exec(article);
    const desc = /<p class="col-9[^"]*">\s*([\s\S]*?)\s*<\/p>/.exec(article);
    const item = {
      name,
      url: `https://github.com/${name}`,
      desc: desc ? cutClean(desc[1], 70) : '',
      // 完整描述留给翻译用，展示用的 desc 是截断过的半截句子，直接翻效果不好
      descFull: desc ? cutClean(desc[1], 300) : '',
      lang: lang ? lang[1].trim() : '',
      starsToday: today ? today[1] : '',
    };
    item.zh = zhExplain(item);
    items.push(item);
    if (items.length >= limit) break;
  }
  return items;
}

async function fetchTrending(limit) {
  // 实测国内到 github.com 要 13~32 秒，给足时间；抓取在后台（ISR）跑，慢不影响访客
  const html = await get('https://github.com/trending?since=daily', {
    // 实测 13~32 秒；给 45 秒一次机会，重试反而会把最坏耗时翻倍
    timeout: 45000,
    retry: 0,
  });
  // 多解析几条，过滤掉不适合放个人主页的仓库后再截断
  const items = parseTrending(html, limit + 6).filter(
    (it) => !BLOCKLIST.test(`${it.name} ${it.desc}`)
  );
  if (items.length) return items.slice(0, limit);
  throw new Error(
    html.includes('Box-row') ? 'Trending 页面结构可能变了，没解析出仓库' : 'Trending 返回的页面不完整'
  );
}

async function fetchTrendingFallback(limit) {
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const q = encodeURIComponent(`created:>${since} stars:>300`);
  const body = await get(
    `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=30`,
    { accept: 'application/vnd.github+json', timeout: 10000 }
  );
  const json = JSON.parse(body);
  return (json.items || [])
    .filter((it) => !BLOCKLIST.test(`${it.name} ${it.description || ''}`))
    .slice(0, limit)
    .map((it) => {
      const item = {
        name: it.full_name,
        url: it.html_url,
        desc: cutClean(it.description || '', 70),
        descFull: cutClean(it.description || '', 300),
        lang: it.language || '',
        starsToday: '',
        stars: it.stargazers_count,
      };
      item.zh = zhExplain(item);
      return item;
    });
}

// 给项目补中文：LLM/机翻完整英文描述 > 关键词兜底
async function enrichProjects(items) {
  const needTranslate = items
    .map((p) => p.descFull || p.desc || '')
    .filter((d) => d && !hasChinese(d));

  let translated = new Map();
  if (needTranslate.length) {
    translated = await translateMany(needTranslate).catch(() => new Map());
  }

  return items.map((p) => {
    const src = p.descFull || p.desc || '';
    const full = translated.get(src) || (hasChinese(src) ? src : '');
    const zh = (full ? cutZh(full) : '') || ruleZh(p);
    const { descFull, ...rest } = p;
    return { ...rest, zh, translated: Boolean(translated.get(src)) };
  });
}

// ---------- 今日新闻：Solidot 的 12 个板块 + 几个别的源 ----------

const FEEDS = [
  ['IT之家', 'https://www.ithome.com/rss/'],
  ['少数派', 'https://sspai.com/feed'],
  ['开源中国', 'https://www.oschina.net/news/rss'],
  ['InfoQ 中文', 'https://www.infoq.cn/feed'],
  ['机核', 'https://www.gcores.com/rss'],
  ['爱范儿', 'https://www.ifanr.com/feed'],
];

// 时政要闻：以部署服务器实测可达为准（人民网 403、BBC/FT/联合早报连不通，
// 新华网频道 RSS 停更，所以新华网要闻改为抓首页，中新网走 RSS）
const POLITICS_FEEDS = [
  ['中新网要闻', 'https://www.chinanews.com.cn/rss/importnews.xml'],
];

// 新华网首页的当天新闻是相对链接：href="20261019/<hash>/c.html"
async function fetchXinhua() {
  const html = await get('https://www.news.cn/', { timeout: 15000 });
  const items = [];
  const seen = new Set();
  const re = /href="(\d{4})(\d{2})(\d{2})\/([0-9a-f]{32})\/c\.html"[^>]*>([^<]{4,80})/g;
  let m;
  while ((m = re.exec(html)) && items.length < 6) {
    const [, y, mo, d, hash, title] = m;
    const url = `https://www.news.cn/${y}${mo}${d}/${hash}/c.html`;
    if (seen.has(url)) continue;
    seen.add(url);
    items.push({
      title: cleanText(title),
      url,
      summary: '',
      time: `${mo}-${d}`,
      ts: Date.UTC(Number(y), Number(mo) - 1, Number(d), -8),
    });
  }
  const cutoff = Date.now() - NEWS_FRESH_HOURS * 3600 * 1000;
  const fresh = items.filter((it) => it.ts >= cutoff);
  if (!fresh.length) throw new Error('新华网首页没解析出本周条目');
  return { category: '新华网要闻', items: fresh };
}

async function fetchPolitics() {
  const [xh, feeds] = await Promise.all([
    fetchXinhua().then(
      (g) => ({ groups: [g], errors: [] }),
      (e) => ({ groups: [], errors: [`新华网：${e.message}`] })
    ),
    fetchFeeds(POLITICS_FEEDS, 5).catch((e) => ({ groups: [], errors: [e.message] })),
  ]);
  return { groups: [...xh.groups, ...feeds.groups], errors: [...xh.errors, ...feeds.errors] };
}

function parseFeed(xml, limit) {
  const cutoff = Date.now() - NEWS_FRESH_HOURS * 3600 * 1000;
  const chunks = xml.includes('<item>') ? xml.split('<item>').slice(1) : xml.split('<entry').slice(1);
  const items = [];

  for (const chunk of chunks) {
    const entry = chunk.split(/<\/item>|<\/entry>/)[0];
    const title = /<title[^>]*>([\s\S]*?)<\/title>/.exec(entry);
    if (!title) continue;

    // Atom 的链接在属性里，RSS 在标签里
    const atomLink = /<link[^>]*rel="alternate"[^>]*href="([^"]+)"/.exec(entry) ||
      /<link[^>]*href="([^"]+)"/.exec(entry);
    const rssLink = /<link>([\s\S]*?)<\/link>/.exec(entry);
    const link = strip(rssLink ? rssLink[1] : atomLink ? atomLink[1] : '');
    if (!link) continue;

    const desc = /<(?:description|summary|content)[^>]*>([\s\S]*?)<\/(?:description|summary|content)>/.exec(
      entry
    );
    const date = /<(?:pubDate|published|updated|dc:date)[^>]*>([\s\S]*?)<\//.exec(entry);

    const parsed = date ? new Date(strip(date[1])) : null;
    const ts = parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0;
    if (ts && ts < cutoff) continue;

    items.push({
      title: cutClean(title[1], 80),
      url: link,
      summary: desc ? cutClean(desc[1], 70) : '',
      time: ts ? FEED_TIME.format(new Date(ts)) : '',
    });
    if (items.length >= limit) break;
  }
  return items;
}

async function fetchFeeds(feeds = FEEDS, perFeed = 3) {
  const errors = [];
  const results = await mapLimit(feeds, 4, ([name, url]) =>
    get(url, { accept: 'application/rss+xml, application/xml, text/xml', timeout: 15000 }).then(
      (xml) => ({ name, items: parseFeed(xml, perFeed) })
    )
  );

  const groups = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      errors.push(`${feeds[i][0]}：${r.reason.message}`);
      return;
    }
    if (r.value.items.length) groups.push({ category: r.value.name, items: r.value.items });
  });
  return { groups, errors };
}

const NEWS_CATEGORIES = [
  ['technology', '科技'],
  ['science', '科学'],
  ['linux', 'Linux'],
  ['security', '安全'],
  ['software', '软件'],
  ['hardware', '硬件'],
  ['games', '游戏'],
  ['mobile', '移动'],
  ['apple', '苹果'],
  ['cloud', '云计算'],
  ['books', '书籍'],
  ['idle', 'idle'],
];

const FEED_TIME = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const NEWS_FRESH_HOURS = 168; // 一周内的都算新闻
const PER_CATEGORY = 3;

function parseCategoryPage(html) {
  const items = [];
  for (const chunk of html.split('<div class="block_m">').slice(1)) {
    const blk = chunk.split('<div class="block_m">')[0];
    const title = /<h2>[\s\S]*?<a href="(\/story\?sid=\d+)">([\s\S]*?)<\/a>/.exec(blk);
    if (!title) continue;

    const when = /发表于(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2})时(\d{1,2})分/.exec(blk);
    const summ = /<div class="p_mainnew">([\s\S]*?)<\/div>/.exec(blk);

    let ts = 0;
    let time = '';
    if (when) {
      const [, y, mo, d, hh, mm] = when.map(Number);
      // 页面上是北京时间（UTC+8），换算成绝对时间好判断新旧
      ts = Date.UTC(y, mo - 1, d, hh - 8, mm);
      time = `${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(hh).padStart(
        2,
        '0'
      )}:${String(mm).padStart(2, '0')}`;
    }

    items.push({
      sid: title[1],
      url: `https://www.solidot.org${title[1]}`,
      title: cutClean(title[2], 80),
      summary: summ ? cutClean(summ[1], 70) : '',
      time,
      ts,
    });
    if (items.length >= 40) break;
  }
  return items;
}

async function fetchNewsGroups() {
  const cutoff = Date.now() - NEWS_FRESH_HOURS * 3600 * 1000;
  const seen = new Set();
  const groups = [];

  // 12 个分类页并发抓，单页挂了不影响其它分类
  const results = await mapLimit(NEWS_CATEGORIES, 6, ([slug, name]) =>
    get(`https://${slug}.solidot.org/`, { timeout: 15000 }).then((html) => ({ name, html }))
  );

  const errors = [];
  const missing = [];
  results.forEach((r, i) => {
    const name = NEWS_CATEGORIES[i][1];
    if (r.status === 'rejected') {
      errors.push(`${name}：${r.reason.message}`);
      return;
    }
    const items = parseCategoryPage(r.value.html)
      .filter((it) => !it.ts || it.ts >= cutoff)
      .filter((it) => {
        if (seen.has(it.sid)) return false;
        seen.add(it.sid);
        return true;
      })
      .slice(0, PER_CATEGORY)
      .map(({ sid, ts, ...rest }) => rest);

    if (items.length) groups.push({ category: name, items });
    else missing.push(name);
  });

  if (!groups.length) throw new Error(errors.join('；') || 'Solidot 分类页没解析出条目');
  return { groups, missing, errors };
}

// ---------- 缓存：内存 + 磁盘，上游挂了就发上次的 ----------

function readCacheFile() {
  try {
    const stat = fs.statSync(CACHE_FILE);
    if (stat.size > CACHE_MAX_BYTES) {
      fs.unlinkSync(CACHE_FILE);
      return null;
    }
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (!data || typeof data !== 'object') return null;
    // 老格式没有 fetchedAt，先当新鲜的处理，下次写入会补上
    const fetchedAt = Number(data.fetchedAt) || 0;
    if (fetchedAt && Date.now() - fetchedAt > CACHE_MAX_AGE) {
      fs.unlinkSync(CACHE_FILE);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCacheFile(data) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
  } catch {
    // 写不进去也不影响返回
  }
}

// 两个 GitHub 源并行拉，www 挂了通常 api 还能用，等一个就够
// 并发受限的 Promise.allSettled：一次别开太多连接，避免 DNS / socket 被打爆
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = { status: 'fulfilled', value: await fn(items[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// 两个源同时开跑：Trending 有「今日 +N」但国内常常要 13~32 秒；
// 搜索接口快且稳，但只有总 star。谁先能用就用谁，最多等 Trending 30 秒。
function sleep(ms) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    t.unref?.();
  });
}

let trendingDownUntil = 0;

async function fetchProjects(limit, cached, errors) {
  const search = fetchTrendingFallback(limit).catch((e) => {
    errors.push(`项目（备用源）：${e.message}`);
    return [];
  });

  if (Date.now() >= trendingDownUntil) {
    const trending = fetchTrending(limit)
      .then((list) => {
        trendingDownUntil = 0;
        return list;
      })
      .catch((e) => {
        // 刚失败过就先别试了，下个小时再说
        trendingDownUntil = Date.now() + TRENDING_COOLDOWN;
        errors.push(`项目：${e.message}`);
        return [];
      });

    const timely = await Promise.race([trending, sleep(30000)]);
    if (timely && timely.length) return timely;
  }

  const fromSearch = await search;
  if (fromSearch.length) return fromSearch;

  const lastGood = (cached?.projects || []).filter((p) => p.starsToday);
  return lastGood.length ? lastGood.slice(0, limit) : [];
}

let memory = { at: 0, data: null };

export async function getDigest({ limitProjects = 12, force = false } = {}) {
  const age = Date.now() - memory.at;

  if (memory.data) {
    // 普通请求：30 分钟内直接吃缓存
    if (!force && age < TTL) return memory.data;
    // 强制刷新（给定时任务用）：最快一分钟一次，别把上游刷爆
    if (force && age < MIN_FORCE_INTERVAL) return memory.data;
  }

  const errors = [];
  const cached = readCacheFile();

  const [rawProjects, newsResult, feedResult, politicsResult] = await Promise.all([
    fetchProjects(limitProjects, cached, errors),
    fetchNewsGroups().catch((e) => ({ groups: [], missing: [], errors: [e.message] })),
    fetchFeeds().catch((e) => ({ groups: [], errors: [e.message] })),
    fetchPolitics().catch((e) => ({ groups: [], errors: [e.message] })),
  ]);

  newsResult.errors.forEach((m) => errors.push(`新闻 ${m}`));
  feedResult.errors.forEach((m) => errors.push(`新闻源 ${m}`));
  politicsResult.errors.forEach((m) => errors.push(`时政 ${m}`));

  const projects = await enrichProjects(rawProjects);

  // Solidot 板块在前，其它源在后；两边都没抓到才退回上次的
  const freshGroups = [...newsResult.groups, ...feedResult.groups];
  const news = freshGroups.length ? freshGroups : cached?.news || [];
  const newsMissing = newsResult.groups.length ? newsResult.missing : cached?.newsMissing || [];
  const politics = politicsResult.groups.length ? politicsResult.groups : cached?.politics || [];

  const data = {
    fetchedAt: Date.now(),
    date: `${DAY.format(new Date())} ${WEEKDAY.format(new Date())}`,
    updatedAt: new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date()),
    projects,
    politics,
    news,
    newsMissing,
    sources: SOURCES,
    errors,
    // 有上游报错就说明部分内容是缓存或备用源的
    stale: errors.length > 0,
  };

  if (!projects.length && !news.length && !politics.length) {
    if (cached) {
      memory = { at: Date.now(), data: { ...cached, stale: true, errors } };
      return memory.data;
    }
    throw new Error(errors.join('；') || '没能取到今日内容');
  }

  memory = { at: Date.now(), data };
  writeCacheFile(data);
  return data;
}
