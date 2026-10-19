// Next.js 启动时执行一次：把进程内的定时更新挂上。
// 只在生产环境、Node 运行时启用，构建和 next dev 阶段不跑。
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  if (process.env.NODE_ENV !== 'production') return;

  const { startWarmup } = await import('./lib/warmup');
  startWarmup();
}
