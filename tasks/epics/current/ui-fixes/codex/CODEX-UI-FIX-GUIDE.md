# Codex UI 修复任务指南
> 优先级: P0 (阻塞用户体验)
> 分支: `refactor/ui-fixes-2026-01-21`
> 创建于: 2026-01-21

---

## Codex 任务文件已创建！ ✅

```
tasks/epics/current/ui-fixes/codex/CODEX-UI-FIX-GUIDE.md
```

## 任务概览

| ID | 任务 | 预估 |
|----|------|------|
| CDX-UI-001 | 修复股票名称显示 (代码→中文名) | 30min |
| CDX-UI-002 | 自选股拖拽删除功能 | 45min |
| CDX-UI-003 | AI 聊天高级功能迁移 (流式/工具/深度模式) | 120min |
| CDX-UI-004 | 股票信息面板迁移 (资金流向/数字滚动) | 90min |

**总预估**: 4.5 小时

## 给 Codex 的指令

```
请阅读并执行 tasks/epics/current/ui-fixes/codex/CODEX-UI-FIX-GUIDE.md

参考图片在: tasks/epics/current/ui-fixes/*.png
(包含旧版 UI 截图，展示目标效果)

回滚点: git reset --hard HEAD~1 (checkpoint: pre-Codex UI fixes)
```

---

## 任务清单

修复 refactor_v2 前端的四个关键问题:
1. **股票名称显示错误** - 显示代码而非中文名
2. **自选股删除功能缺失** - 加入后无法删除
3. **AI 聊天功能退化** - 丢失了工具调用和深度思考模式
4. **股票信息面板缺失** - K线上方的详细指标、资金流向、数字滚动动画

---

## 📸 新旧 UI 对比参考

### 旧版 UI - 详细股票信息面板 (目标效果)
![贵州茅台详情](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/tasks/epics/current/ui-fixes/old-ui-stock-panel-1.png)

![航天电子详情](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/tasks/epics/current/ui-fixes/old-ui-stock-panel-2.png)

**旧版特性:**
- 大字体价格显示 + 涨跌幅
- 股票名称 + 代码 (如 "贵州茅台 (600519)")
- 资金流向指标: 主力净流入、超大单、大单、换手率、量比
- 交易数据: 今开、昨收、最高、最低、成交量
- 基本面: 成交额、换手率、市盈率、总市值、流通市值
- **数字滚动动画** (ScrollNumber)

### 新版 UI - 当前问题
![只显示代码](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/tasks/epics/current/ui-fixes/new-ui-stock-code-only.png)

**当前问题:**
- 只显示股票代码 "300502"，没有公司名称
- 缺少详细的交易数据和资金流向
- 没有数字滚动动画效果

### AI 聊天 - 功能退化
![AI聊天基础版](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/tasks/epics/current/ui-fixes/ai-chat-basic.png)

**问题:** AI 没有获取实时数据，回答缺乏针对性

---

## 任务 1: CDX-UI-001 - 修复股票名称显示

### 问题描述
股票头部显示股票代码 (如 `300502`) 而不是公司名称 (如 `新易盛`)。

### 根因分析
`StockHeader.tsx` 正确使用了 `quote.name`，但 API 返回的数据可能缺少 `name` 字段。

### 需要检查的文件
1. `client/src/refactor_v2/components/CenterTop/StockHeader.tsx`
2. `client/src/refactor_v2/components/CenterTop/index.tsx` - 查看数据来源
3. `client/src/refactor_v2/api/stocks.ts` - 检查 API 调用
4. `server/routers/stocks.ts` - 检查 getQuote 返回值

### 修复步骤
1. 确认 `getQuoteWithFallback` 返回的对象包含 `name` 字段
2. 如果 API 返回了 `code` 但没有 `name`，需要在前端或后端补充名称查询
3. 检查 Eastmoney API 是否正确返回股票名称

### 验证方法
- 启动开发服务器 `pnpm dev`
- 选中任意股票，确认头部显示中文名称而非代码
- 检查控制台无错误

---

## 任务 2: CDX-UI-002 - 添加自选股拖拽删除

### 问题描述
用户将股票加入自选后，无法删除。

### 需要实现的功能
实现 **拖拽到底部删除区域** 的交互方式（类似 iOS 拖到底部删除的体验）：

1. 长按股票项开始拖拽
2. 底部出现删除区域（红色高亮）
3. 拖到删除区域松手触发删除
4. 调用后端 `watchlist.remove` API

### 需要修改的文件
1. `client/src/refactor_v2/components/LeftPane/StockListItem.tsx` - 添加拖拽功能
2. `client/src/refactor_v2/components/LeftPane/index.tsx` - 添加底部删除区域
3. `client/src/refactor_v2/api/watchlist.ts` - 删除 API 调用

### 实现方案: react-dnd 拖拽删除 (推荐)

```tsx
// 1. 股票项添加 useDrag
import { useDrag } from "react-dnd";

function StockListItem({ stock }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "STOCK_ITEM",
    item: { code: stock.code },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  
  return <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>...</div>;
}

// 2. 底部添加删除区域 useDrop
import { useDrop } from "react-dnd";

function DeleteZone({ onDelete }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "STOCK_ITEM",
    drop: (item) => onDelete(item.code),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));
  
  return (
    <div 
      ref={drop}
      className={`delete-zone ${isOver ? 'active' : ''}`}
    >
      🗑️ 拖到这里删除
    </div>
  );
}
```

### 样式建议

```css
.delete-zone {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 0, 0, 0.1);
  border-top: 2px dashed var(--color-down);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.delete-zone.active {
  opacity: 1;
  background: rgba(255, 0, 0, 0.3);
}
```

### 依赖安装
```bash
pnpm add react-dnd react-dnd-html5-backend
```

### 验证方法
- 添加股票到自选
- 长按/拖拽股票项
- 拖到底部删除区域
- 确认从列表和后端都正确移除

---

## 任务 3: CDX-UI-003 - 迁移 AI 聊天高级功能 (重点!)

### 问题描述
新的 `refactor_v2/components/AIChatPanel.tsx` (113 行) 相比旧的实现 (457 行) 缺失了关键功能:

| 功能 | 旧版 | 新版 |
|------|------|------|
| 流式 API `/api/ai/stream` | ✅ | ❌ (用 tRPC) |
| 股票上下文传递 | ✅ | ❌ |
| 深度模式 (thinkHard) | ✅ | ❌ |
| 工具调用展示 | ✅ | ❌ |
| 历史会话管理 | ✅ | ❌ |
| Follow-up 建议 | ✅ | ❌ |
| 预设提示 | ✅ | ❌ |

### 旧版关键代码路径
```
client/src/components/ai/
├── AIChatPanel.tsx        # 主面板 (457行) ← 需要迁移
├── ChatHistoryList.tsx    # 历史列表
├── TaskExecutionPanel.tsx # 工具调用展示
└── ...

client/src/components/
├── AIChatBox.tsx          # 聊天消息框
└── PresetPrompts.tsx      # 预设提示按钮
```

### 迁移清单

#### 3.1 流式 API 对接
**旧代码位置**: `components/ai/AIChatPanel.tsx` 第 104-285 行 `streamChatRequest`

需要迁移:
- `/api/ai/stream` POST 请求
- SSE 事件解析
- `AbortController` 取消逻辑

#### 3.2 股票上下文
**旧代码位置**: 第 122-154 行

需要传递给 AI:
- `quote`: 实时行情 (价格、涨跌幅等)
- `capitalFlow`: 资金流向
- `stockCode`: 当前选中股票

#### 3.3 深度模式
**旧代码位置**: 第 29 行 `useState<boolean>(false)` + 第 368-378 行 UI

需要:
- `thinkHard` 状态
- "深度" 按钮 UI
- 请求时带上 `thinkHard` 参数

#### 3.4 工具调用展示
**旧代码位置**: 
- `TaskExecutionPanel.tsx` - 工具执行进度
- 第 89-102 行 `getActiveTodoRun` 查询

需要:
- 迁移 `TaskExecutionPanel` 组件
- 显示 AI 正在执行的工具 (如查询K线、计算技术指标)

#### 3.5 历史会话
**旧代码位置**: 第 50-60 行 + `ChatHistoryList.tsx`

需要:
- 会话创建 / 加载
- 历史列表组件

#### 3.6 预设提示
**旧代码位置**: `PresetPrompts.tsx` + 第 429 行

需要:
- 移植 `PresetPrompts` 组件
- 在无聊天历史时显示预设按钮

### 迁移策略

**推荐方案: 直接采用旧组件**

与其重写，不如:
1. 将 `components/ai/AIChatPanel.tsx` 复制到 `refactor_v2/components/`
2. 更新导入路径 (trpc → refactor_v2/api)
3. 更新样式以匹配 refactor_v2 设计系统
4. 删除旧版并使用修改后的版本

### 验证方法
1. 与 AI 对话，确认收到流式响应
2. 开启深度模式，确认 AI 响应更详细
3. 询问当日大盘情况，确认 AI 获取了正确日期的数据
4. 确认工具调用时能看到执行进度
5. 新建对话 / 查看历史 功能正常

---

## 任务 4: CDX-UI-004 - 迁移股票信息面板 (K线上方)

> [!IMPORTANT]
> 这是视觉体验的核心部分！参考上方截图了解目标效果

### 问题描述
当前 refactor_v2 的股票详情页面缺少丰富的信息展示，只有简单的代码和价格。

### 需要迁移的内容

#### 4.1 价格显示组件
**旧组件**: `components/stock/StockDetailPanel.tsx` (611+ 行)

需要展示:
- 大字体当前价格 (如 `1362.07`)
- 涨跌额和涨跌幅 (如 `-11.48 -0.84%`)
- 股票名称 + 代码 (如 `贵州茅台 (600519)`)

#### 4.2 资金流向指标
需要展示 (带颜色编码):
| 指标 | 说明 |
|------|------|
| 💰 主力净流入 | 主力资金净额 |
| 🏦 超大单 | 超大单净流入 |
| 📊 大单 | 大单净流入 |
| 🔄 换手率 | 当日换手率 |
| 📈 量比 | 量能比较 |

#### 4.3 交易数据
需要展示:
- 今开 / 昨收 / 最高 / 最低
- 成交量 / 成交额
- 换手率 / 市盈率
- 总市值 / 流通市值

#### 4.4 数字滚动动画 (ScrollNumber)
**关键组件**: `components/ui/AnimatedNumber.tsx`

特性:
- 数字变化时有翻页动画效果
- 使用等宽字体确保对齐
- 支持颜色变化 (涨红跌绿)

### 需要复制/迁移的文件
```
client/src/components/ui/AnimatedNumber.tsx  → 复制到 refactor_v2/components/ui/
client/src/components/stock/StockDetailPanel.tsx → 参考并重构到 CenterTop/
```

### 实现步骤
1. 复制 `AnimatedNumber.tsx` 到 refactor_v2 组件库
2. 创建新的 `StockInfoPanel.tsx` 组件 (或扩展 `StockHeader.tsx`)
3. 调用 API 获取详细数据 (getQuote + getExtras)
4. 使用 AnimatedNumber 展示价格变化
5. 按截图布局排列各指标

### 验证方法
1. 选中股票后，K线上方显示完整信息面板
2. 价格变化时有滚动动画
3. 资金流向数据正确显示 (涨红跌绿)
4. 响应式布局在不同屏幕宽度下正常

---

## 完成检查清单

- [ ] CDX-UI-001: 股票头部显示中文名称
- [ ] CDX-UI-002: 自选股删除功能可用
- [ ] CDX-UI-003.1: AI 流式响应工作
- [ ] CDX-UI-003.2: AI 获取正确的股票上下文
- [ ] CDX-UI-003.3: 深度模式 UI 和功能
- [ ] CDX-UI-003.4: 工具调用可见
- [ ] CDX-UI-003.5: 历史会话功能
- [ ] CDX-UI-003.6: 预设提示可用
- [ ] CDX-UI-004.1: 价格显示带名称和代码
- [ ] CDX-UI-004.2: 资金流向指标显示
- [ ] CDX-UI-004.3: 交易数据 (开/收/高/低/量)
- [ ] CDX-UI-004.4: 数字滚动动画 (ScrollNumber)
- [ ] `pnpm check` 通过
- [ ] 无控制台错误

---

## 文件所有权
| 文件/目录 | 归属 |
|-----------|------|
| `client/src/refactor_v2/components/*` | Codex |
| `client/src/refactor_v2/api/*` | Codex |
| `client/src/refactor_v2/stores/*` | Codex |
| `server/routers/stocks.ts` | Codex (只读分析) |

## 注意事项
1. 使用 refactor_v2 的设计系统 (CSS 变量如 `--text-primary`)
2. 保持与 `refactor_v2/stores/aiChat.store.ts` 的兼容
3. 确保不破坏现有的 `FloatingAIChatInput` 功能

---

## 附录: 关键文件对比

### 旧版 AIChatPanel 关键功能
```typescript
// 1. 流式 API
const response = await fetch("/api/ai/stream", {
  method: "POST",
  body: JSON.stringify({
    messages,
    stockCode,
    stockContext,  // 股票数据上下文
    useSmartAgent: true,
    thinkHard,     // 深度模式
    sessionId,
  }),
});

// 2. SSE 解析
const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  // 解析 data: ... 事件
}

// 3. 工具调用展示
{todoRun && <TaskExecutionPanel todoRun={todoRun} />}
```

### 新版 AIChatPanel (当前简化版)
```typescript
// 使用 Zustand store
const { messages, isLoading } = useAIChatStore();
// 缺少流式 API、工具调用、深度模式等
```
