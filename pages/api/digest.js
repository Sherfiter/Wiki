import { getDigest } from '../../lib/digest';

export default async function handler(req, res) {
  // 定时任务可以带 ?force=1 强制重抓（内部有一分钟的最小间隔）
  const force = ['1', 'true', 'yes'].includes(String(req.query.force || '').toLowerCase());

  try {
    const data = await getDigest({ force });
    // 上游半小时才需要刷一次，CDN / 反代可以缓存
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: e?.message || '获取今日内容失败' });
  }
}
