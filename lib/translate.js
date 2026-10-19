// 英文描述翻成中文。
// 用 MyMemory 的免费接口（不用 key），翻过的结果按原文缓存，
// 同一个仓库只会翻一次，所以日常请求量很小。
//
// 缓存自带清理：超过 90 天没被命中的词条会淘汰，另有条数和体积上限兜底。

import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), '.cache', 'translate.json');
const ENDPOINT = 'https://api.mymemory.translated.net/get';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// LLM 批量翻译：OpenAI 兼容接口，默认 DeepSeek；换别的服务改环境变量即可
const LLM_KEY = () => process.env.LLM_API_KEY || '';
const LLM_BASE = () => (process.env.LLM_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
const LLM_MODEL = () => process.env.LLM_MODEL || 'deepseek-chat';

const MAX_AGE = 90 * 24 * 3600 * 1000; // 90 天没用上就淘汰
const MAX_ENTRIES = 5000;
const MAX_BYTES = 2 * 1024 * 1024;

let cache = null;

// 兼容早期「原文: 译文」的纯字符串格式
function normalize(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') out[key] = { zh: value, at: Date.now() };
    else if (value && typeof value.zh === 'string') out[key] = { zh: value.zh, at: Number(value.at) || 0 };
  }
  return out;
}

// 返回被删掉的条数
function prune(store) {
  const now = Date.now();
  let removed = 0;

  for (const [key, value] of Object.entries(store)) {
    if (now - value.at > MAX_AGE) {
      delete store[key];
      removed += 1;
    }
  }

  const dropOldest = (count) => {
    const keys = Object.keys(store).sort((a, b) => store[a].at - store[b].at);
    keys.slice(0, count).forEach((k) => {
      delete store[k];
      removed += 1;
    });
  };

  const count = Object.keys(store).length;
  if (count > MAX_ENTRIES) dropOldest(count - MAX_ENTRIES);

  // 体积兜底：一直丢最旧的 10%，直到达标
  let size = JSON.stringify(store).length;
  while (size > MAX_BYTES && Object.keys(store).length > 10) {
    dropOldest(Math.ceil(Object.keys(store).length * 0.1));
    size = JSON.stringify(store).length;
  }

  return removed;
}

function load() {
  if (cache) return cache;
  try {
    cache = normalize(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')));
  } catch {
    cache = {};
  }
  return cache;
}

function save() {
  try {
    const removed = prune(cache);
    if (removed) console.log(`[translate] 清理了 ${removed} 条过期译文`);
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  } catch {
    // 写不进去也无所谓，下次重新翻
  }
}

export function hasChinese(text) {
  return /[\u4e00-\u9fff]/.test(String(text || ''));
}

function decodeEntities(text) {
  return String(text)
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function translateOne(text) {
  const url = `${ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent('en|zh-CN')}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const out = decodeEntities(json?.responseData?.translatedText || '').trim();
  // 配额用尽时接口会把这句提示当译文返回
  if (!out || /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID (LANGPAIR|EMAIL)|TOO MANY/i.test(out)) {
    throw new Error('翻译接口没给出有效译文');
  }
  return out;
}

// 一次性把一批英文描述发给 LLM，返回 {原文: 译文}；任何一步失败都返回 null，交给 MyMemory 兜底
async function translateBatchLLM(texts) {
  if (!LLM_KEY() || !texts.length) return null;
  try {
    const res = await fetch(`${LLM_BASE()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_KEY()}`,
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: LLM_MODEL(),
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              '你是开源项目译者。把用户给的 GitHub 仓库英文描述逐条翻成一句自然流畅的中文说明：' +
              '突出项目是做什么的，技术名词（如 LLM、RAG、CLI）保留英文，每条不超过 45 字。' +
              '按输入顺序输出 JSON：{"translations": ["译文1", "译文2", ...]}，条数必须与输入一致。',
          },
          { role: 'user', content: JSON.stringify(texts) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(content);
    const list = Array.isArray(parsed) ? parsed : parsed.translations;
    if (!Array.isArray(list)) throw new Error('返回格式不对');
    const out = new Map();
    texts.forEach((src, i) => {
      const zh = String(list[i] || '').trim();
      if (zh && hasChinese(zh)) out.set(src, zh);
    });
    return out.size ? out : null;
  } catch (e) {
    console.warn(`[translate] LLM 翻译失败，退回 MyMemory：${e.message}`);
    return null;
  }
}

// 批量翻译，带并发上限；失败的原文不写缓存，下次还会再试
export async function translateMany(texts, { concurrency = 4 } = {}) {
  const store = load();
  const result = new Map();
  let todo = [];
  const now = Date.now();

  for (const raw of texts) {
    const key = String(raw || '').trim();
    if (!key) continue;
    if (store[key]) {
      store[key].at = now; // 命中就续期，清理时不会误伤常用词条
      result.set(key, store[key].zh);
    } else if (!todo.includes(key)) {
      todo.push(key);
    }
  }

  let dirty = todo.length > 0;

  // 有 LLM key 就先整批翻一次，失败的条目再交给 MyMemory 逐条补
  const llm = await translateBatchLLM(todo);
  if (llm) {
    for (const [src, zh] of llm) {
      store[src] = { zh, at: now };
      result.set(src, zh);
    }
    todo = todo.filter((t) => !llm.has(t));
  }

  let cursor = 0;

  const worker = async () => {
    while (cursor < todo.length) {
      const key = todo[cursor++];
      try {
        const zh = await translateOne(key);
        store[key] = { zh, at: Date.now() };
        result.set(key, zh);
        dirty = true;
      } catch {
        // 单个失败不影响其它
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, todo.length) || 0 }, worker));
  if (dirty) save();

  return result;
}
