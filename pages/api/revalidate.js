// 让 /daily/ 这类静态页按需重新生成。
// 调用方：进程内定时任务（lib/warmup.js），也可以由 cron / 部署脚本手动打。
export default async function handler(req, res) {
  const secret = process.env.REVALIDATE_SECRET;
  if (secret) {
    const given = req.headers['x-revalidate-secret'] || req.query.secret;
    if (given !== secret) {
      res.status(401).json({ error: 'secret 不对' });
      return;
    }
  }

  const target = String(req.query.path || '/daily/');

  try {
    await res.revalidate(target);
    res.status(200).json({ revalidated: true, path: target, at: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e?.message || '重新生成失败', path: target });
  }
}
