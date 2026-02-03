# K-003: AKShare 数据接口完善与测试

## 概述

前端-后端连接已完成 (K-002)。现在需要完善后端的 AKShare 数据接口，确保 Grok 可以通过工具调用获取到真实的股票数据。

## 背景

在 Grok 工具调用测试中，发现以下问题：
1. `get_stock_quote` 返回解析错误
2. `get_fund_flow_history` 返回解析错误  
3. `get_kline_data` 返回 'list' object has no attribute 'get'
4. `call_akshare_api` 调用失败

需要排查并修复这些接口，确保数据正确返回。

## 任务清单

### Phase 1: 诊断问题 (预计 30 分钟)

- [ ] 1.1 检查 AKTools 服务状态
  ```bash
  curl http://localhost:8098/version
  curl http://localhost:8098/api/public/stock_zh_a_spot_em | head -c 500
  ```

- [ ] 1.2 逐个测试核心接口
  - [ ] `stock_zh_a_spot_em` - 实时行情
  - [ ] `stock_individual_fund_flow_rank` - 资金流排行
  - [ ] `stock_zh_a_hist` - K线历史
  - [ ] `stock_lhb_jgmmtj_em` - 机构买卖统计

- [ ] 1.3 记录每个接口的返回格式和错误信息

### Phase 2: 修复 Python 测试脚本 (预计 30 分钟)

文件: `tests/grok_tool_calling_test.py`

- [ ] 2.1 修复 `get_stock_quote` 数据解析
  - 检查 AKShare 返回的字段名是否匹配
  - 处理可能的空响应

- [ ] 2.2 修复 `get_fund_flow_history` 数据解析
  - 确认正确的接口名称
  - 处理分页和限制

- [ ] 2.3 修复 `get_kline_data` 数据解析
  - 检查返回类型（list vs dict）
  - 正确遍历数据

- [ ] 2.4 修复 `call_akshare_api` 动态调用
  - 处理不同接口的参数格式
  - 添加错误重试逻辑

### Phase 3: 创建独立测试文件 (预计 30 分钟)

创建: `tests/akshare_api_tests.py`

- [ ] 3.1 测试框架搭建
  ```python
  import pytest
  import requests
  
  AKTOOLS_URL = "http://localhost:8098"
  
  class TestAKShareAPIs:
      ...
  ```

- [ ] 3.2 编写测试用例
  - [ ] test_stock_quote_600879
  - [ ] test_fund_flow_history
  - [ ] test_kline_data
  - [ ] test_institution_fund_flow
  - [ ] test_longhu_bang

- [ ] 3.3 运行测试并确保全部通过
  ```bash
  cd /Users/kckylechen/Desktop/DragonFly
  python3 -m pytest tests/akshare_api_tests.py -v
  ```

### Phase 4: 验证 Grok 工具调用 (预计 20 分钟)

- [ ] 4.1 运行完整的 Grok 工具调用测试
  ```bash
  python3 tests/grok_tool_calling_test.py
  ```

- [ ] 4.2 验证输出
  - 确认 Grok 成功调用了所有工具
  - 确认返回了真实的股票数据
  - 确认生成的分析报告包含实际数据（非假设数据）

- [ ] 4.3 保存成功的测试报告到 `tests/` 目录

## 验收标准

1. **AKShare 接口**：所有核心接口返回正确数据
2. **测试覆盖**：`akshare_api_tests.py` 通过率 100%
3. **Grok 验证**：
   - 工具调用次数 >= 5
   - 分析报告包含真实数据（非假设）
   - 生成的 MD 文件格式正确

## 关键文件

| 文件 | 用途 |
|------|------|
| `tests/grok_tool_calling_test.py` | Grok 工具调用主测试 |
| `tests/akshare_api_tests.py` | AKShare 接口单元测试 (新建) |
| `server/_core/stockTools.ts` | 后端工具定义 (参考) |
| `scripts/start-aktools.sh` | AKTools 启动脚本 |

## 提交规范

```
feat(tests): add akshare api tests and fix grok tool calling

- Add akshare_api_tests.py with 5 test cases
- Fix data parsing in grok_tool_calling_test.py
- Verify Grok can call tools and get real data
```

## 注意事项

1. **非交易时间**：部分接口在非交易时间可能返回空数据，需要处理
2. **接口限流**：AKShare 有请求频率限制，测试时加入适当延时
3. **数据格式**：AKShare 返回的字段名可能是中文，注意编码

---

*任务分配: Kimi*
*优先级: P0*
*预计耗时: 2 小时*
