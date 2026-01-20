# DragonFly 测试文件说明

## 目录结构

```
__tests__/
├── ai_agents/         # AI 代理相关测试
│   ├── 100_stocks_final.test.ts
│   ├── backtest.test.ts
│   └── mock_backtest.test.ts
├── integration/       # 集成测试
│   ├── api_connection.test.ts
│   ├── batch_10_stocks.test.ts
│   ├── batch_5_stocks.test.ts
│   ├── glm_model.test.ts
│   ├── indicators.test.ts
│   ├── model_comparison.test.ts
│   ├── real_api.test.ts
│   ├── single_stock.test.ts
│   └── top_gainers_2025.test.ts
└── unit/             # 单元测试
    ├── auth.logout.test.ts
    ├── eastmoney.test.ts
    ├── grok-api.test.ts
    ├── stocks.test.ts
    └── watchlist.test.ts
```

## 运行测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test -- __tests__/unit

# 运行集成测试
pnpm test -- __tests__/integration

# 运行 AI Agent 测试
pnpm test -- __tests__/ai_agents
```

## 测试文件命名规范

- 单元测试：`*.test.ts`
- 集成测试：`*.test.ts`
- 测试数据：`*.mock.ts`

## 文件说明

### AI Agent 测试 (`__tests__/ai_agents/`)

- `100_stocks_final.test.ts` - 100 只股票的完整测试
- `backtest.test.ts` - 回测功能测试
- `mock_backtest.test.ts` - 使用 Mock 数据的回测测试

### 集成测试 (`__tests__/integration/`)

- `api_connection.test.ts` - API 连接测试
- `real_api.test.ts` - 真实 API 测试
- `batch_10_stocks.test.ts` - 批量 10 只股票测试
- `batch_5_stocks.test.ts` - 批量 5 只股票测试
- `single_stock.test.ts` - 单股测试
- `indicators.test.ts` - 技术指标测试
- `glm_model.test.ts` - GLM 模型测试
- `model_comparison.test.ts` - 模型对比测试
- `top_gainers_2025.test.ts` - 2025 年涨幅榜测试

### 单元测试 (`__tests__/unit/`)

- `auth.logout.test.ts` - 登出测试
- `eastmoney.test.ts` - 东方财富 API 测试
- `grok-api.test.ts` - Grok API 测试
- `stocks.test.ts` - 股票基础测试
- `watchlist.test.ts` - 自选股测试
