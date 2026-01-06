import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Trash2 } from "lucide-react";

export interface StockListItemProps {
    item: {
        id: number;
        stockCode: string;
        [key: string]: any;
    };
    isSelected: boolean;
    isEditMode?: boolean;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
}

// 获取市场标识
function getMarketTag(code: string): { tag: string; color: string } {
    if (code.startsWith('6')) {
        return { tag: 'SH', color: 'bg-red-600' };
    } else if (code.startsWith('0') || code.startsWith('3')) {
        return { tag: 'SZ', color: 'bg-red-600' };
    } else if (code.startsWith('8') || code.startsWith('4')) {
        return { tag: 'BJ', color: 'bg-orange-600' };
    }
    return { tag: '', color: '' };
}

// 迷你走势图组件
function MiniSparkline({ data, preClose, isPositive }: { data: number[]; preClose: number; isPositive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length < 2) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const padding = 2;

        // 清除画布
        ctx.clearRect(0, 0, width, height);

        // 计算最大最小值（包含昨收价，确保基准线在视野内）
        let min = Math.min(...data, preClose);
        let max = Math.max(...data, preClose);

        // 确保有一定的上下空间，避免线条贴边
        const range = max - min || 1;
        // 稍微扩展上下边界，让波动更居中
        const extendedMin = min - range * 0.1;
        const extendedMax = max + range * 0.1;
        const extendedRange = extendedMax - extendedMin;

        // 绘制 0% 基准线 (昨收价)
        const baselineY = height - padding - ((preClose - extendedMin) / extendedRange) * (height - padding * 2);

        ctx.beginPath();
        ctx.strokeStyle = '#333'; // 暗色虚线
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1;
        ctx.moveTo(0, baselineY);
        ctx.lineTo(width, baselineY);
        ctx.stroke();
        ctx.setLineDash([]); // 重置实线

        // 绘制走势线
        ctx.beginPath();
        ctx.strokeStyle = isPositive ? '#e74c3c' : '#2ecc71';
        ctx.lineWidth = 1.5;

        data.forEach((value, index) => {
            const x = padding + (index / (data.length - 1)) * (width - padding * 2);
            const y = height - padding - ((value - extendedMin) / extendedRange) * (height - padding * 2);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }, [data, preClose, isPositive]);

    return (
        <canvas
            ref={canvasRef}
            width={60}
            height={24}
            className="opacity-90"
        />
    );
}

export function StockListItem({
    item,
    isSelected,
    isEditMode = false,
    onClick,
    onDelete
}: StockListItemProps) {
    // 获取实时行情
    const { data: quote } = trpc.stocks.getDetail.useQuery(
        { code: item.stockCode },
        { refetchInterval: 30000 }
    );

    // 获取分时数据用于迷你图
    const { data: timelineData } = trpc.stocks.getTimeline.useQuery(
        { code: item.stockCode },
        { refetchInterval: 60000 }
    );

    const changePercent = quote?.quote?.changePercent || 0;
    const isPositive = changePercent > 0;
    const isNegative = changePercent < 0;
    const currentPrice = quote?.quote?.price || 0;
    const name = quote?.quote?.name || quote?.stock?.name || "加载中...";

    // 获取市场标识
    const market = getMarketTag(item.stockCode);

    // 处理分时数据为迷你图数据
    const sparklineData = timelineData?.timeline?.map((t: any) => t.price) || [];

    // 涨跌颜色
    const priceColor = isPositive ? 'text-[#e74c3c]' : isNegative ? 'text-[#2ecc71]' : 'text-foreground';
    const badgeColor = isPositive ? 'bg-[#e74c3c]' : isNegative ? 'bg-[#2ecc71]' : 'bg-muted';

    return (
        <div
            className={`
                group px-4 py-3 border-b border-border cursor-pointer transition-all
                ${isSelected ? 'bg-accent' : 'hover:bg-accent/50'}
            `}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                {/* 左侧：名称和代码 */}
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                        {market.tag && (
                            <span className={`text-[10px] px-1 rounded text-white ${market.color}`}>
                                {market.tag}
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                            {item.stockCode}
                        </span>
                    </div>
                </div>

                {/* 中间：迷你走势图 - 居中 */}
                <div className="flex-1 flex justify-center px-2">
                    {sparklineData.length > 5 ? (
                        <MiniSparkline
                            data={sparklineData}
                            preClose={quote?.quote?.preClose || sparklineData[0] || 0}
                            isPositive={isPositive}
                        />
                    ) : (
                        <div className="w-[60px] h-[24px]" />
                    )}
                </div>

                {/* 右侧：价格和涨跌幅 */}
                <div className="flex items-center gap-2">
                    <div className={`font-semibold tabular-nums text-right min-w-[55px] ${priceColor}`}>
                        {currentPrice > 0 ? currentPrice.toFixed(2) : "--"}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium text-white tabular-nums w-[72px] text-center ${badgeColor}`}>
                        {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                    </div>

                    {/* 编辑模式下显示删除按钮 */}
                    {isEditMode && (
                        <button
                            onClick={onDelete}
                            className="p-1.5 hover:bg-destructive/20 rounded-md transition-colors"
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
