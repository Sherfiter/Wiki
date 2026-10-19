// 给 GitHub Trending 的英文项目补一句中文说明。
// 这个文件不依赖 Node，服务端（lib/digest.js）和浏览器（组件兜底）都能用。

// 翻译失败时，靠名字和描述里的关键词猜个方向
const RULES = [
  [/\b(mcp|model context protocol)\b/i, 'MCP 生态'],
  [/\b(agent|agentic|agents)\b|智能体/i, 'AI Agent'],
  [/\b(llm|gpt|language model|transformer)\b|大模型/i, '大模型'],
  [/\b(rag|vector|embedding|retrieval)\b|向量|检索/i, '检索增强'],
  [/\b(diffusion|stable diffusion|image gen|text-to-image)\b/i, '图像生成'],
  [/\b(voice|tts|speech|audio|dubbing|transcri)\b/i, '语音与音频'],
  [/\b(video|render|ffmpeg)\b/i, '视频处理'],
  [/\b(cli|command line|terminal|shell)\b/i, '命令行工具'],
  [/\b(neovim|vim|emacs|dotfiles|rice)\b/i, '编辑器 / 配置'],
  [/\b(react|vue|svelte|tailwind|frontend|css)\b/i, '前端 / 界面'],
  [/\b(game|engine|unity|godot|emulator)\b/i, '游戏相关'],
  [/\b(linux|kernel|driver|filesystem|systemd)\b/i, '系统 / 内核'],
  [/\b(security|exploit|pentest|vulnerab|cve)\b/i, '安全'],
  [/\b(database|sql|postgres|sqlite|redis|storage)\b/i, '数据库 / 存储'],
  [/\b(docker|kubernetes|k8s|devops|ci\/cd|terraform)\b/i, '运维 / 部署'],
  [/\b(course|tutorial|roadmap|handbook|learn|book)\b/i, '教程 / 学习资料'],
  [/\b(plugin|extension|addon)\b/i, '插件 / 扩展'],
  [/\b(framework|library|sdk|toolkit)\b/i, '框架 / 库'],
  [/\b(downloader|scraper|crawler|parser)\b/i, '爬取 / 解析'],
  [/\b(privacy|self-host|offline|local-first)\b/i, '本地 / 自托管'],
];

// 关键词猜方向，作为翻译失败时的兜底
export function ruleZh(project) {
  if (!project) return '';

  const text = `${project.name || ''} ${project.desc || ''}`;
  const tags = [];
  for (const [re, label] of RULES) {
    if (re.test(text) && !tags.includes(label)) tags.push(label);
    if (tags.length >= 3) break;
  }

  const lang = project.lang ? `${project.lang} ` : '';
  if (tags.length) return `${lang}项目，主要涉及${tags.join('、')}`;
  return lang ? `${lang}开源项目` : '开源项目';
}

export function zhExplain(project) {
  return ruleZh(project);
}
