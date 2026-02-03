/**
 * Settings Modal Component (Theme-aware)
 *
 * 设计原则:
 * - 使用 CSS 变量确保所有主题下可读
 * - 响应式布局
 */

import { X, Shield, Cpu, Bell, Palette } from "lucide-react";
import { useUIStore } from "../../stores/ui.store";
import { PerformanceModeToggle } from "./PerformanceModeToggle";
import { ThemeSelector } from "./ThemeSelector";

export const SettingsModal: React.FC = () => {
  const { settingsOpen: open, closeSettings, activeSettingsTab, setActiveSettingsTab } = useUIStore();

  if (!open) return null;

  const tabs = [
    { id: "appearance" as const, icon: Palette, label: "外观设置" },
    { id: "trading" as const, icon: Shield, label: "交易偏好" },
    { id: "api" as const, icon: Cpu, label: "API 连接" },
    { id: "notifications" as const, icon: Bell, label: "通知策略" },
  ];

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && closeSettings()}
    >
      <div className="w-full max-w-2xl bg-[var(--bg-primary)] border border-[var(--panel-border)] rounded-2xl shadow-2xl flex h-[500px] overflow-hidden">
        {/* 左侧导航 */}
        <div className="w-48 border-r border-[var(--panel-border)] bg-[var(--bg-secondary)]/50 p-4 space-y-2">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 px-2">
            Settings
          </h3>
          {tabs.map((tab) => (
            <NavBtn
              key={tab.id}
              icon={<tab.icon size={16} />}
              label={tab.label}
              active={activeSettingsTab === tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
            />
          ))}
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
          <div className="flex items-center justify-between p-4 border-b border-[var(--panel-border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              {tabs.find((t) => t.id === activeSettingsTab)?.label}
            </h2>
            <button
              onClick={closeSettings}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--panel-hover)]"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {activeSettingsTab === "appearance" && <AppearanceTab />}
            {activeSettingsTab === "trading" && <TradingTab />}
            {activeSettingsTab === "api" && <ApiTab />}
            {activeSettingsTab === "notifications" && <NotificationsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

const NavBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${active
        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
        : "text-[var(--text-muted)] hover:bg-[var(--panel-hover)] hover:text-[var(--text-secondary)]"
      }`}
  >
    {icon} {label}
  </button>
);

const AppearanceTab: React.FC = () => {
  const { fontScale, setFontScale } = useUIStore();

  return (
    <>
      {/* 主题选择 */}
      <section>
        <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-4">颜色主题 (Warp Engine)</h4>
        <ThemeSelector />
      </section>

      {/* 字体大小 */}
      <section>
        <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-4">字体大小</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setFontScale("small")}
            className={`flex-1 py-2 px-3 rounded-lg border transition-all ${
              fontScale === "small"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]/50"
            }`}
          >
            <span className="text-sm">小</span>
          </button>
          <button
            onClick={() => setFontScale("medium")}
            className={`flex-1 py-2 px-3 rounded-lg border transition-all ${
              fontScale === "medium"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]/50"
            }`}
          >
            <span className="text-base">中</span>
          </button>
          <button
            onClick={() => setFontScale("large")}
            className={`flex-1 py-2 px-3 rounded-lg border transition-all ${
              fontScale === "large"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]/50"
            }`}
          >
            <span className="text-lg">大</span>
          </button>
        </div>
      </section>

      {/* 性能模式 */}
      <section>
        <PerformanceModeToggle />
      </section>
    </>
  );
};



const TradingTab: React.FC = () => (
  <div className="space-y-6">
    <section>
      <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-4">交易偏好</h4>
      <div className="space-y-3">
        <label className="flex items-center justify-between p-3 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--panel-border)]">
          <span className="text-sm text-[var(--text-primary)]">涨跌颜色方案</span>
          <select className="bg-[var(--bg-primary)] border border-[var(--panel-border)] rounded px-2 py-1 text-xs text-[var(--text-secondary)]">
            <option>A股标准 (红涨绿跌)</option>
            <option>国际惯例 (绿涨红跌)</option>
          </select>
        </label>
        <label className="flex items-center justify-between p-3 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--panel-border)]">
          <span className="text-sm text-[var(--text-primary)]">默认时间周期</span>
          <select className="bg-[var(--bg-primary)] border border-[var(--panel-border)] rounded px-2 py-1 text-xs text-[var(--text-secondary)]">
            <option>日线</option>
            <option>60分钟</option>
            <option>30分钟</option>
          </select>
        </label>
      </div>
    </section>
  </div>
);

const ApiTab: React.FC = () => (
  <div className="space-y-6">
    <section>
      <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-4">API 配置</h4>
      <div className="p-4 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--panel-border)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-emerald-400">连接正常</span>
        </div>
        <div className="space-y-2 text-xs text-[var(--text-muted)]">
          <div className="flex justify-between">
            <span>WebSocket 延迟</span>
            <span className="text-[var(--text-secondary)]">24ms</span>
          </div>
          <div className="flex justify-between">
            <span>最后心跳</span>
            <span className="text-[var(--text-secondary)]">2s ago</span>
          </div>
        </div>
      </div>
    </section>
  </div>
);

const NotificationsTab: React.FC = () => (
  <div className="space-y-6">
    <section>
      <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-4">通知设置</h4>
      <div className="space-y-3">
        <label className="flex items-center justify-between p-3 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--panel-border)]">
          <span className="text-sm text-[var(--text-primary)]">价格提醒</span>
          <input type="checkbox" defaultChecked className="accent-[var(--color-primary)]" />
        </label>
        <label className="flex items-center justify-between p-3 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--panel-border)]">
          <span className="text-sm text-[var(--text-primary)]">交易通知</span>
          <input type="checkbox" defaultChecked className="accent-[var(--color-primary)]" />
        </label>
        <label className="flex items-center justify-between p-3 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--panel-border)]">
          <span className="text-sm text-[var(--text-primary)]">系统消息</span>
          <input type="checkbox" className="accent-[var(--color-primary)]" />
        </label>
      </div>
    </section>
  </div>
);

export default SettingsModal;
