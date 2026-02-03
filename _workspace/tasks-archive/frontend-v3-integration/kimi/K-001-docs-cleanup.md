# K-001: 项目文档整理 + README 优化

## 负责 Agent: 🟠 Kimi

## 目标

整理项目文档，创建清晰的项目结构说明，方便新开发者上手。

---

## 📋 任务概述

当前项目有 170+ 个 markdown 文件，很多是任务执行日志，需要：
1. 识别哪些是重要文档 vs 可归档的日志
2. 更新 README.md 让人一眼看懂项目
3. 创建 docs/ARCHITECTURE.md 架构说明

---

## Step 1: 分析当前文档结构 (10 分钟)

```bash
# 统计 markdown 文件
find . -name "*.md" -not -path "./node_modules/*" | wc -l

# 查看主要目录
ls -la docs/
ls -la tasks/
```

输出一份报告：哪些文件夹是什么用途。

---

## Step 2: 更新 README.md (20 分钟)

**文件**: `/Users/kckylechen/Desktop/DragonFly/README.md`

**要求**:
1. 项目简介 - 一句话说明这是什么
2. 功能特性 - 列出 3-5 个核心功能
3. 技术栈 - 前端/后端/数据库
4. 快速开始 - 如何启动项目
5. 项目结构 - 主要目录说明

**参考格式**:
```markdown
# 🐲 DragonFly - A股智能分析助手

> AI 驱动的 A 股投资分析工具

## ✨ 功能特性
- 🤖 AI 对话分析
- 📊 实时行情监控
- 🎨 多主题 UI (Warp 风格)

## 🚀 快速开始
...

## 📁 项目结构
...
```

---

## Step 3: 创建架构文档 (20 分钟)

**新文件**: `/Users/kckylechen/Desktop/DragonFly/docs/ARCHITECTURE.md`

**内容**:
1. 系统架构图 (用 Mermaid)
2. 前端架构 (React + Zustand + tRPC)
3. 后端架构 (Express + tRPC + Drizzle)
4. 数据流说明

---

## Step 4: 清理冗余文档 (可选，需确认)

识别可以归档的文件，**不要直接删除**，列出清单让用户确认：

```markdown
## 建议归档的文件
- tasks/epics/finished/*.md (已完成的任务)
- docs/old/*.md (如果有)
```

---

## 验收标准

- [ ] README.md 内容清晰、专业
- [ ] docs/ARCHITECTURE.md 有架构图
- [ ] 无语法错误

---

## 产出文件

```
README.md              (更新)
docs/ARCHITECTURE.md   (新建)
docs/cleanup-report.md (可选，归档建议)
```
