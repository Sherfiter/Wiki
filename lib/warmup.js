// 进程内定时任务：定期让页面自己更新一次，不依赖服务器上的 cron。
// 注意：这里只能用 fetch，不能 import lib/digest（它依赖 fs，instrumentation 也会被编译进 edge 运行时）。
const DEFAULT_INTERVAL = 30 * 60 * 1000;

function origin() {
  if (process.env.WARMUP_ORIGIN) return process.env.WARMUP_ORIGIN.replace(/\/$/, '');
  return `http://127.0.0.1:${process.env.PORT || 3000}`;
}

function secretHeader() {
  return process.env.REVALIDATE_SECRET
    ? { 'x-revalidate-secret': process.env.REVALIDATE_SECRET }
    : {};
}

async function call(path) {
  const res = await fetch(`${origin()}${path}`, {
    headers: secretHeader(),
    signal: AbortSignal.timeout(180000),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // 忽略非 JSON 响应
  }
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body;
}

let running = false;

async function tick(reason) {
  // 上一轮还没跑完就跳过，避免上游慢的时候任务叠在一起
  if (running) {
    console.log(`[warmup] ${reason}：上一轮还没结束，跳过`);
    return;
  }
  running = true;
  const started = Date.now();
  try {
    // 1) 强制抓一次新数据（内部有 60 秒最小间隔）
    const data = await call('/api/digest/?force=1');
    const summary = `项目 ${data.projects?.length ?? 0} 个、新闻 ${data.news?.length ?? 0} 组${
      data.errors?.length ? `，${data.errors.length} 个源异常` : ''
    }`;

    // 2) 再让 /daily/ 重新生成静态页
    await call('/api/revalidate/?path=/daily/');
    console.log(`[warmup] ${reason}：${summary}，页面已重建（${Date.now() - started}ms）`);
  } catch (e) {
    console.warn(`[warmup] ${reason}：更新失败 ${e.message}`);
  } finally {
    running = false;
  }
}

export function startWarmup() {
  if (globalThis.__digestWarmup) return globalThis.__digestWarmup;

  const interval = Number(process.env.WARMUP_INTERVAL_MS) || DEFAULT_INTERVAL;

  // 等服务完全起来再开始，别和首屏抢资源
  const kickoff = setTimeout(() => tick('启动'), 10 * 1000);
  kickoff.unref?.();

  const timer = setInterval(() => tick('定时'), interval);
  timer.unref?.(); // 不阻塞进程退出

  const human = interval >= 60000 ? `${Math.round(interval / 60000)} 分钟` : `${Math.round(interval / 1000)} 秒`;
  console.log(`[warmup] 已启动，每 ${human}更新一次`);
  globalThis.__digestWarmup = timer;
  return timer;
}
