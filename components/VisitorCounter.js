import { useEffect, useState } from 'react';

// 每次整页加载只上报一次；页面内跳转复用同一个 Promise，避免把计数刷爆
let pending = null;
let latest = null;

function loadStats() {
  if (pending) return pending;

  pending = fetch('/api/visitors/', { method: 'POST', keepalive: true })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Number.isFinite(Number(data.total))) {
        latest = {
          total: Number(data.total),
          unique: Number(data.unique) || 0,
          today: Number(data.today) || 0,
        };
      }
      return latest;
    })
    .catch(() => null);

  return pending;
}

function format(n) {
  return Number(n || 0).toLocaleString('zh-CN');
}

export default function VisitorCounter() {
  const [stats, setStats] = useState(latest);

  useEffect(() => {
    // 页面内跳转时上一次请求可能还没回来，这里等同一个 Promise 就行
    if (latest) return undefined;

    let alive = true;
    loadStats().then((data) => {
      if (alive && data) setStats(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!stats) return null;

  return (
    <p className="text-xs text-neutral-500 dark:text-neutral-300">
      总访问 {format(stats.total)} · 访客 {format(stats.unique)} · 今日 {format(stats.today)}
    </p>
  );
}
