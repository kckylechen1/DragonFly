import { Check } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { WARP_THEMES } from "../../themes";

export const ThemeSelector: React.FC = () => {
    const { themeId, setTheme } = useTheme();

    return (
        <div className="grid grid-cols-2 gap-3">
            {WARP_THEMES.map((theme) => {
                const isActive = themeId === theme.id;
                const isLight = theme.type === 'light';
                
                return (
                    <button
                        key={theme.id}
                        onClick={() => setTheme(theme.id)}
                        className={`
                            relative group flex flex-col items-start rounded-xl border-2 transition-all duration-200 overflow-hidden
                            ${isActive
                                ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
                                : "border-[var(--panel-border)] hover:border-[var(--text-muted)]"
                            }
                        `}
                    >
                        {/* Preview Area */}
                        <div className="w-full aspect-[16/10] overflow-hidden relative">
                            {/* Background */}
                            {theme.bgImage ? (
                                <img
                                    src={theme.bgImage}
                                    alt={theme.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                            ) : (
                                <div 
                                    className="w-full h-full" 
                                    style={{ backgroundColor: theme.colors.background }}
                                />
                            )}

                            {/* Preview UI Mock */}
                            <div
                                className="absolute inset-2 flex gap-1 rounded-lg overflow-hidden"
                                style={{ backgroundColor: theme.colors.surface }}
                            >
                                {/* Sidebar mock */}
                                <div 
                                    className="w-1/5 h-full flex flex-col gap-1 p-1"
                                    style={{ borderRight: `1px solid ${theme.colors.border}` }}
                                >
                                    <div 
                                        className="w-full h-1.5 rounded-sm"
                                        style={{ backgroundColor: theme.colors.text.muted }}
                                    />
                                    <div 
                                        className="w-3/4 h-1 rounded-sm"
                                        style={{ backgroundColor: theme.colors.text.muted, opacity: 0.5 }}
                                    />
                                </div>
                                {/* Content mock */}
                                <div className="flex-1 flex flex-col gap-1 p-1.5">
                                    <div 
                                        className="w-1/2 h-1.5 rounded-sm"
                                        style={{ backgroundColor: theme.colors.text.primary, opacity: 0.8 }}
                                    />
                                    <div 
                                        className="w-3/4 h-1 rounded-sm"
                                        style={{ backgroundColor: theme.colors.text.secondary, opacity: 0.6 }}
                                    />
                                    <div 
                                        className="w-2/3 h-1 rounded-sm"
                                        style={{ backgroundColor: theme.colors.text.muted, opacity: 0.4 }}
                                    />
                                    <div className="flex-1" />
                                    {/* Input mock */}
                                    <div 
                                        className="w-full h-3 rounded"
                                        style={{ 
                                            backgroundColor: theme.colors.background,
                                            border: `1px solid ${theme.colors.border}`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Active indicator */}
                            {isActive && (
                                <div 
                                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                                    style={{ backgroundColor: theme.colors.primary }}
                                >
                                    <Check size={12} className="text-white" />
                                </div>
                            )}
                        </div>

                        {/* Label Area */}
                        <div className="px-3 py-2 w-full bg-[var(--bg-secondary)]/50">
                            <div className="flex items-center justify-between w-full">
                                <span className={`text-xs font-medium ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]'}`}>
                                    {theme.name}
                                </span>
                                {isLight && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--text-muted)]/20 text-[var(--text-muted)] font-medium uppercase">
                                        Light
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
