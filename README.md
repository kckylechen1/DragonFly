# 🐉 DragonFly - A股智能分析平台

> AI 驱动的 A 股投资分析工具，专为中国股市设计

<p align="center">
  <a href="#✨-功能特性">功能</a> •
  <a href="#🛠-技术栈">技术栈</a> •
  <a href="#🚀-快速开始">快速开始</a> •
  <a href="#📁-项目结构">结构</a> •
  <a href="#📖-文档">文档</a>
</p>

---

## ✨ 功能特性

- 📈 **智能 K 线图表** - 支持多周期切换，红涨绿跌符合 A 股习惯
- 🤖 **AI 分析助手** - 集成多模型 (GPT-4o / DeepSeek / Gemini / GLM)
- 📊 **多数据源** - iFinD / AKShare / Eastmoney 自动容错切换
- 💼 **自选股管理** - 分组管理，键盘快捷操作
- 🎨 **多主题系统** - Pixel / Modern / Dark / Cyberpunk 四套主题

---

## 🛠 技术栈

| 层级     | 技术                             | 用途         |
| -------- | -------------------------------- | ------------ |
| **前端** | React 19 + TypeScript 5.9        | UI 框架      |
|          | Zustand + React Query            | 状态管理     |
|          | lightweight-charts               | K 线图表     |
|          | Tailwind CSS v4                  | 样式系统     |
| **后端** | Node.js + Express                | 服务器       |
|          | tRPC                             | 类型安全 API |
|          | Drizzle ORM + SQLite             | 数据存储     |
| **AI**   | OpenAI / DeepSeek / Gemini / GLM | 多模型支持   |

---

## 🚀 快速开始

```bash
# 1. 克隆并安装
git clone https://github.com/kckylechen1/DragonFly.git && cd DragonFly
pnpm install

# 2. 配置环境
cp .env.example .env
# 编辑 .env 填入 API Keys

# 3. 启动开发服务器
pnpm dev
# 访问 http://localhost:6888
```

**环境要求**: Node.js >= 18, pnpm >= 8

---

## 📁 项目结构

```
DragonFly/
├── client/src/            # 前端应用
│   ├── refactor_v2/       # 新版 UI 组件
│   ├── lib/               # 工具函数
│   └── main.tsx           # 应用入口
├── server/                # 后端服务
│   ├── _core/             # 核心模块 (Express + tRPC)
│   ├── routers/           # API 路由
│   ├── ai/                # AI 服务
│   └── scripts/           # 分析脚本
├── shared/                # 前后端共享类型
├── docs/                  # 项目文档
│   ├── ARCHITECTURE.md    # 架构文档
│   ├── architecture/      # 详细设计
│   └── ai-collab/         # AI 协作手册
├── tasks/                 # 任务管理
│   └── epics/             # Epic 任务
└── drizzle/               # 数据库迁移
```

---

## 📖 文档

| 文档                                                             | 说明         |
| ---------------------------------------------------------------- | ------------ |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)                          | 系统架构设计 |
| [DRAGONFLY-REFACTOR.md](docs/architecture/DRAGONFLY-REFACTOR.md) | 重构详细计划 |
| [AI-COLLAB-PLAYBOOK.md](docs/ai-collab/AI-COLLAB-PLAYBOOK.md)    | AI 协作规范  |

---

## 🤝 贡献

欢迎提交 Issue 和 PR！开发前请阅读 `pnpm check` 通过类型检查。

**License**: MIT - 详见 [LICENSE](LICENSE)

---

<p align="center">
  Made with ❤️ by kckylechen & AI Agents
</p>
