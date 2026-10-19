// 给 GitHub Trending 的英文项目补一句中文说明。
// 这个文件不依赖 Node，服务端（lib/digest.js）和浏览器（组件兜底）都能用。

// 常驻热榜的项目直接写死，比机器猜的准
const CURATED = {
  'anomalyco/opencode': '开源编码 Agent，终端里的 AI 编程助手',
  'Comfy-Org/ComfyUI': '节点式界面驱动的扩散模型工作台，本地跑图常用后端',
  'ggml-org/llama.cpp': '纯 C/C++ 的大模型本地推理实现',
  'mlabonne/llm-course': '大模型入门路线图 + 配套 Colab 练习',
  'MadsLorentzen/ai-job-search': '跑在自己机器上的 AI 求职助手：筛岗位、改简历、写求职信',
  'anthropics/claude-plugins-official': 'Claude Code 的官方插件目录',
  'cursor/plugins': 'Cursor 的插件规范与官方插件',
  'akitaonrails/ai-memory': '给编码 Agent 的长期记忆，换工具也不丢上下文',
  'HKUDS/CLI-Anything': '把普通软件包装成 Agent 能直接调用的 CLI',
  'debpalash/VoiceStudio': '全本地的 ElevenLabs 替代品：克隆声音、配音、转录、做有声书',
  'ruvnet/ruflo': '多智能体编排运行时，强调记忆与联邦协作',
  'stablyai/orca': '在一个界面里同时指挥一队编码 Agent',
  'chenglou/handwired': '把普通 JavaScript 代码直接变成神经网络',
  'feder-cr/git-ai': '为 AI 时代重新设计的 Git',
};

// 匹配不到 CURATED 时，靠名字和描述里的关键词猜个方向
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

// 写死词条，优先级最高
export function curatedZh(project) {
  if (!project) return '';
  const short = String(project.name || '').split('/').pop();
  return CURATED[project.name] || CURATED[short] || '';
}

// 关键词猜方向，作为最低一档兜底
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
  return curatedZh(project) || ruleZh(project);
}
