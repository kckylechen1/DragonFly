import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Palette } from "lucide-react";
import { useTheme } from "@/refactor_v2/hooks/useTheme";

export const ThemeSwitcher: React.FC = () => {
  const { themeId, availableThemes, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themeLabel =
    availableThemes.find(t => t.id === themeId)?.label || themeId;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--panel-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
        aria-label="切换主题"
        aria-expanded={isOpen}
      >
        <Palette className="w-4 h-4" />
        <span className="text-xs hidden sm:inline">{themeLabel}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-[var(--bg-secondary)] border border-[var(--panel-border)] rounded-lg shadow-lg z-50">
          {availableThemes.map(theme => (
            <button
              key={theme.id}
              onClick={() => {
                setTheme(theme.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left hover:bg-[var(--panel-hover)] transition-colors ${
                themeId === theme.id
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <span className="flex-1">{theme.label}</span>
              {themeId === theme.id && (
                <Check className="w-4 h-4 text-[var(--color-primary)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ThemeToggleCompact: React.FC = () => {
  const { themeId, availableThemes, setTheme } = useTheme();

  const nextTheme = () => {
    const currentIndex = availableThemes.findIndex(t => t.id === themeId);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    setTheme(availableThemes[nextIndex].id);
  };

  const themeLabel =
    availableThemes.find(t => t.id === themeId)?.label || themeId;

  return (
    <button
      onClick={nextTheme}
      className="p-2 rounded-lg hover:bg-[var(--panel-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      aria-label="切换主题"
      title={`当前: ${themeLabel}`}
    >
      <Palette className="w-4 h-4" />
    </button>
  );
};
