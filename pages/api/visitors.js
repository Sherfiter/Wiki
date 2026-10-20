import crypto from 'crypto';

import { getVisitorStats, recordVisit } from '../../lib/visitors';

const COOKIE = 'sw_vid';
const COOKIE_MAX_AGE = 365 * 24 * 3600;
const BOT_RE =
  /bot\b|spider|crawler|crawl|slurp|bingpreview|headless|lighthouse|pagespeed|curl\/|wget\/|python-requests|httpclient|monitor|uptime/i;

function readCookie(header, name) {
  if (!header) return '';
  for (const part of String(header).split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    if (part.slice(0, index).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return part.slice(index + 1).trim();
    }
  }
  return '';
}

function firstHeader(value) {
  return String(value || '')
    .split(',')[0]
    .trim();
}

function isHttps(req) {
  return (
    firstHeader(req.headers['x-forwarded-proto']) === 'https' || Boolean(req.socket?.encrypted)
  );
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: '只支持 GET / POST' });
  }

  const ua = String(req.headers['user-agent'] || '');

  try {
    // GET 只读；爬虫和脚本不计数，但照样返回当前数字
    if (req.method === 'GET' || BOT_RE.test(ua)) {
      return res.status(200).json(await getVisitorStats());
    }

    // 浏览器第一次来发一个随机 id 放进 httpOnly cookie，用来区分独立访客
    let visitorId = readCookie(req.headers.cookie, COOKIE);
    const isNewVisitor = !visitorId;
    if (isNewVisitor) visitorId = crypto.randomBytes(16).toString('hex');

    const ip = firstHeader(req.headers['x-forwarded-for']) || req.socket?.remoteAddress || '';
    const stats = await recordVisit({
      visitorId,
      fallback: ip ? `${ip}|${ua}` : ua,
    });

    if (isNewVisitor) {
      res.setHeader(
        'Set-Cookie',
        `${COOKIE}=${visitorId}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${
          isHttps(req) ? '; Secure' : ''
        }`
      );
    }

    return res.status(200).json(stats);
  } catch (e) {
    return res.status(500).json({ error: e?.message || '访客统计失败' });
  }
}
