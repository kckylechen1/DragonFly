# C-008: Command Palette (Cmd+K)

## 负责人: 🟢 Codex
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- L-001 (依赖已安装)
- L-004 (UI Store)

## 目标
- [ ] 创建 `components/CommandPalette.tsx`
- [ ] 集成 `cmdk` 库
- [ ] 实现股票搜索、面板切换和主题切换指令
- [ ] 绑定系统快捷键 Cmd+K

---

## 步骤

### Step 1: 创建 CommandPalette.tsx

```typescript
// client/src/refactor_v2/components/CommandPalette.tsx

import React, { useEffect } from "react";
import { Command } from "cmdk";
import { Search, Monitor, Moon, Sun, Layout, ArrowRight } from "lucide-react";
import { useUIStore } from "../stores/ui.store";
import { getPanels } from "./panels/PanelRegistry";

/**
 * 全局命令面板组件 (Cmd+K)
 */
export const CommandPalette: React.FC = () => {
  const { 
    commandPaletteOpen: open, 
    closeCommandPalette: setOpen,
    openCommandPalette: setOpenTrue,
    setCurrentSymbol,
    setActivePanelId
  } = useUIStore();

  // 快捷键监听
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenTrue();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-cyan-950/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command Palette" className="flex flex-col">
          <div className="flex items-center border-b border-gray-800 px-4">
            <Search className="w-5 h-5 text-gray-500 mr-2" />
            <Command.Input 
              autoFocus
              placeholder="搜索股票、面板或切换设置..." 
              className="flex-1 h-14 bg-transparent border-none outline-none text-gray-200 text-sm placeholder:text-gray-600"
            />
            <button onClick={() => setOpen()} className="text-[10px] text-gray-600 border border-gray-800 px-1.5 py-0.5 rounded uppercase tracking-widest">ESC</button>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-smooth">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              未找到相关结果
            </Command.Empty>

            {/* 常用面板 */}
            <Command.Group heading="面板导航" className="px-2 mb-2">
              {getPanels().map(panel => (
                <CommandItem key={panel.id} onSelect={() => {
                  setActivePanelId(panel.id);
                  setOpen();
                }}>
                  <div className="flex items-center gap-2">
                    <Layout size={16} className="text-gray-600" />
                    <span>跳转至 {panel.title}</span>
                  </div>
                </CommandItem>
              ))}
            </Command.Group>

            {/* 个股快捷入口 */}
            <Command.Group heading="热门个股" className="px-2 mb-2">
              {["AAPL", "TSLA", "BITCOIN", "ETH"].map(s => (
                <CommandItem key={s} onSelect={() => {
                  setCurrentSymbol(s);
                  setOpen();
                }}>
                  <div className="flex items-center gap-2">
                    <ArrowRight size={16} className="text-gray-600" />
                    <span>查看 {s} 详情</span>
                  </div>
                </CommandItem>
              ))}
            </Command.Group>

            {/* 系统设置 */}
            <Command.Group heading="系统偏好" className="px-2">
              <CommandItem onSelect={() => console.log("Light Mode")}>
                <div className="flex items-center gap-2">
                  <Sun size={16} className="text-gray-600" />
                  <span>切换至明亮模式</span>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => console.log("Dark Mode")}>
                <div className="flex items-center gap-2">
                  <Moon size={16} className="text-gray-600" />
                  <span>切换至深邃模式</span>
                </div>
              </CommandItem>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
      {/* 点击外部关闭 */}
      <div className="absolute inset-0 -z-10" onClick={() => setOpen()} />
    </div>
  );
};

const CommandItem = ({ children, onSelect }: { children: React.ReactNode, onSelect: () => void }) => (
  <Command.Item
    onSelect={onSelect}
    className="flex items-center px-3 py-2.5 rounded-xl text-sm text-gray-400 aria-selected:bg-cyan-500/10 aria-selected:text-cyan-400 cursor-pointer transition-colors"
  >
    {children}
  </Command.Item>
);

export default CommandPalette;
```

### Step 2: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `CommandPalette.tsx` 已创建
- [ ] 支持 Cmd+K / Ctrl+K 热键唤起
- [ ] 实现面板切换和股票切换指令
- [ ] UI 符合赛博金融视觉风格（毛玻璃 + 青色高亮）
- [ ] `pnpm check` 通道

---

## 产出文件

- `client/src/refactor_v2/components/CommandPalette.tsx`
