# DragonFly 脚本工具说明

## 目录结构

```
scripts/
├── analysis/         # 数据分析脚本
│   ├── analyze_980112.ts      # 股票 980112 分析
│   ├── analyze_ai_sector.ts   # AI 板块分析
│   └── analyze_zijin.ts       # 资金流向分析
└── backtest/        # 回测脚本
    └── bull_stock_signal.ts   # 牛股信号回测
```

## 使用方法

```bash
# 运行分析脚本
npx tsx server/scripts/analysis/analyze_980112.ts

# 运行回测脚本
npx tsx server/scripts/backtest/bull_stock_signal.ts
```

## 添加新脚本

1. 将脚本放入对应目录
2. 添加 JSDoc 注释说明用途
3. 更新本 README

## 脚本说明

### 分析脚本 (`scripts/analysis/`)

- `analyze_980112.ts` - 股票 980112 完整分析 (final 版本)
- `analyze_ai_sector.ts` - AI 板块完整分析 (full 版本)
- `analyze_zijin.ts` - 资金流向分析

### 回测脚本 (`scripts/backtest/`)

- `bull_stock_signal.ts` - 牛股信号回测

## 实验性代码

之前的实验版本已移至 `server/experiments/` 目录：

- `analyze_980112_v1.ts` - 980112 原始版本
- `analyze_980112_simple.ts` - 980112 简化版本
- `analyze_ai_sector_v1.ts` - AI 板块原始版本
- `analyze_ai_sector_simple.ts` - AI 板块简化版本
