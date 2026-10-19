/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  experimental: {
    // 允许 instrumentation.js 在服务进程启动时跑一次（每日速览的定时更新）
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
