# C-000: 连接状态机与幂等性保证

## 负责人: 🟢 Codex
## 状态
- ⏱️ 开始时间: 2026-01-30 00:33
- ✅ 结束时间: 2026-01-30 00:33

## ⚠️ Oracle P0 护栏 - 必须优先执行

## 目标
- [ ] 创建 `realtime/connectionStateMachine.ts`
- [ ] 实现连接生命周期管理（IDLE, CONNECTING, OPEN, RECONNECTING, CLOSED, ERROR）
- [ ] 保证 `connect()` 的幂等性，处理 React 18 StrictMode 双执行问题
- [ ] 提供全局状态查询接口

---

## 参考文档

- `tasks/epics/frontend-v3/ORACLE_REVIEW.md` 第 59-96 行

---

## 步骤

### Step 1: 创建 connectionStateMachine.ts

```typescript
// client/src/refactor_v2/realtime/connectionStateMachine.ts

/**
 * 连接状态定义
 */
export type ConnectionState = 
  | 'IDLE'
  | 'CONNECTING' 
  | 'OPEN' 
  | 'RECONNECTING' 
  | 'CLOSED' 
  | 'ERROR';

/**
 * 连接状态机处理器
 * 
 * 作用：统一管理 WS 和 SSE 的连接状态，确保操作的幂等性和可预测性。
 */
export class ConnectionStateMachine {
  private _state: ConnectionState = 'IDLE';
  private _onStateChange: ((state: ConnectionState) => void) | null = null;

  constructor(initialState: ConnectionState = 'IDLE') {
    this._state = initialState;
  }

  get state() { return this._state; }

  /**
   * 状态转换核心方法
   */
  transition(newState: ConnectionState) {
    if (this._state === newState) return;
    
    console.log(`[Connection] ${this._state} -> ${newState}`);
    this._state = newState;
    
    if (this._onStateChange) {
      this._onStateChange(newState);
    }
  }

  /**
   * 幂等性检查：是否正在连接或已打开
   */
  isBusy(): boolean {
    return this._state === 'CONNECTING' || this._state === 'OPEN' || this._state === 'RECONNECTING';
  }

  /**
   * 订阅状态变化
   */
  subscribe(callback: (state: ConnectionState) => void) {
    this._onStateChange = callback;
    return () => { this._onStateChange = null; };
  }
}
```

### Step 2: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `connectionStateMachine.ts` 已创建
- [ ] 状态转换逻辑正确（带 log）
- [ ] 导出类型及类定义
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/realtime/connectionStateMachine.ts`
