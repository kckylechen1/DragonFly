# Ralph - Autonomous AI Coding System

Ralph 是一个自主 AI 编码系统，可以自动迭代完成 PRD 中的用户故事。

## 工作原理

1. **创建 PRD** - 使用 PRD Skill 生成功能需求文档
2. **转换为 JSON** - 使用 Ralph Skill 将 PRD 转换为 prd.json
3. **自动迭代** - Ralph 循环运行 AI Agent 完成每个用户故事
4. **质量保证** - 每个故事完成后自动运行 typecheck/test
5. **持续学习** - 通过 progress.txt 记录学习成果

## 文件结构

```
scripts/ralph/
├── ralph.sh           # 主循环脚本
├── CLAUDE.md          # Agent 指令模板
├── SKILL.md           # Ralph Skill（PRD转JSON）
├── SKILL_PRD.md       # PRD Skill（创建需求文档）
├── prd.json           # 当前任务清单（由 Skill 生成）
├── prd.json.example   # 示例格式
└── progress.txt       # 学习日志和进度记录
```

## 使用方法

### 1. 创建 PRD

```bash
# 在 Claude 中执行
Load the PRD skill from scripts/ralph/SKILL_PRD.md and create a PRD for [功能描述]
```

这会生成 `tasks/prd-[feature-name].md`

### 2. 转换为 Ralph 格式

```bash
# 在 Claude 中执行
Load the ralph skill from scripts/ralph/SKILL.md and convert tasks/prd-[feature-name].md to prd.json
```

这会生成 `scripts/ralph/prd.json`

### 3. 运行 Ralph

```bash
# 运行 10 次迭代（默认）
./scripts/ralph/ralph.sh

# 运行指定次数
./scripts/ralph/ralph.sh 20

# 使用 Claude Code（如果使用 Claude 而不是 Amp）
./scripts/ralph/ralph.sh 10 claude
```

## 关键概念

### 故事大小

每个用户故事必须能在**一次迭代**内完成。如果太大，LLM 会在完成前耗尽上下文，产生劣质代码。

**合适的大小：**

- 添加数据库列和迁移
- 添加 UI 组件到现有页面
- 更新 server action 逻辑
- 添加筛选下拉框

**太大（需要拆分）：**

- "构建整个仪表板"
- "添加认证系统"
- "重构整个 API"

### 依赖顺序

故事按优先级顺序执行，前面的故事不能依赖后面的故事。

**正确顺序：**

1. Schema/数据库变更
2. Server actions / 后端逻辑
3. 使用后端数据的 UI 组件
4. 聚合数据的仪表板/摘要视图

### 验收标准

每个标准必须是**可验证**的，不能模糊。

**好的标准：**

- "添加 `status` 列到 tasks 表，默认值为 'pending'"
- "筛选下拉框选项：All, Active, Completed"
- "点击删除显示确认对话框"
- "Typecheck passes"
- "Verify in browser using dev-browser skill"

**坏的标准：**

- "正常工作"
- "用户可以轻松做 X"
- "良好的 UX"

## 工作流程

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  创建 PRD   │───▶│ 转换为 JSON  │───▶│  运行 Ralph  │
└─────────────┘    └──────────────┘    └─────────────┘
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
                 ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
                 │ 读取 prd.json│       │ 选取高优先级 │       │ 实现故事    │
                 │ 检查分支     │       │ 未完成故事   │       │ 运行检查    │
                 │ 读取 progress│       │             │       │ 提交代码    │
                 └─────────────┘       └─────────────┘       └─────────────┘
                                                                      │
                        ┌─────────────────────────────────────────────┘
                        ▼
                 ┌─────────────┐
                 │ 更新 prd.json│
                 │ 标记为 passes│
                 │ 追加 progress│
                 └─────────────┘
                        │
                        ▼
                 ┌─────────────┐
                 │ 所有故事完成？│
                 └─────────────┘
                    │        │
                   否        是
                    │        │
                    ▼        ▼
                 [继续]   [完成]
```

## 调试

查看当前状态：

```bash
# 查看哪些故事已完成
cat scripts/ralph/prd.json | jq '.userStories[] | {id, title, passes}'

# 查看之前迭代的学习成果
cat scripts/ralph/progress.txt

# 查看 Git 历史
git log --oneline -10
```

## 自定义

复制 `CLAUDE.md` 并根据你的项目自定义：

- 添加项目特定的质量检查命令
- 包含代码库约定
- 添加常见陷阱

## 参考

- [Geoffrey Huntley 的 Ralph 文章](https://ghuntley.com/ralph/)
- [原始仓库](https://github.com/snarktank/ralph)
