import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Search, Plus, Settings, X } from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

// 导入模块化组件
import { StockListItem, StockDetailPanel } from "@/components/stock";
import { AIChatPanel } from "@/components/ai";

export default function Home() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 获取观察池列表
  const { data: watchlist, isLoading, refetch } = trpc.watchlist.list.useQuery();

  // 搜索股票 - 使用query
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  // 使用tRPC query进行搜索
  const { data: searchData, isFetching: isSearching } = trpc.stocks.search.useQuery(
    { keyword: debouncedKeyword },
    {
      enabled: debouncedKeyword.length > 0,
      staleTime: 30000,
    }
  );

  // 当搜索数据变化时更新结果
  useEffect(() => {
    if (searchData) {
      setSearchResults(searchData);
    }
  }, [searchData]);

  // 添加到观察池
  const addMutation = trpc.watchlist.add.useMutation({
    onSuccess: () => {
      refetch();
      setSearchResults([]);
      setSearchKeyword("");
    },
  });

  // 删除观察池
  const deleteMutation = trpc.watchlist.remove.useMutation({
    onSuccess: () => {
      refetch();
      if (selectedStock) {
        const stillExists = watchlist?.some(item => item.stockCode === selectedStock);
        if (!stillExists) {
          setSelectedStock(null);
        }
      }
    },
  });

  const handleSearch = () => {
    if (!searchKeyword.trim()) return;
    setDebouncedKeyword(searchKeyword.trim());
  };

  const handleAddToWatchlist = (code: string) => {
    addMutation.mutate({
      stockCode: code,
      source: "manual",
    });
  };

  const handleDeleteFromWatchlist = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate({ id });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* 左侧边栏 - 股票列表 */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* 标题栏 - 带齿轮按钮 */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-foreground">自选股</span>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-1.5 rounded-md transition-colors ${isEditMode
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              }`}
            title={isEditMode ? "完成编辑" : "编辑列表"}
          >
            {isEditMode ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 bg-input rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索股票代码/名称"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="border-0 bg-transparent h-6 p-0 focus-visible:ring-0"
            />
          </div>

          {/* 搜索结果 */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-popover border border-border rounded-lg overflow-hidden">
              {searchResults.slice(0, 5).map((result) => (
                <div
                  key={result.code}
                  className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer"
                  onClick={() => handleAddToWatchlist(result.code)}
                >
                  <div>
                    <div className="font-medium text-sm">{result.name}</div>
                    <div className="text-xs text-muted-foreground">{result.code}</div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 编辑模式提示 */}
        {isEditMode && (
          <div className="px-4 py-2 bg-primary/10 text-primary text-sm flex items-center justify-between">
            <span>点击删除按钮移除股票</span>
            <button
              onClick={() => setIsEditMode(false)}
              className="text-xs underline"
            >
              完成
            </button>
          </div>
        )}

        {/* 观察池列表 */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">加载中...</div>
          ) : watchlist && watchlist.length > 0 ? (
            watchlist.map((item) => (
              <StockListItem
                key={item.id}
                item={item}
                isSelected={selectedStock === item.stockCode}
                isEditMode={isEditMode}
                onClick={() => setSelectedStock(item.stockCode)}
                onDelete={(e) => handleDeleteFromWatchlist(item.id, e)}
              />
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p>暂无观察股票</p>
              <p className="text-xs text-muted-foreground mt-2">
                使用上方搜索框添加股票
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 中间和右侧使用可调整面板 */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* 中间内容区 - 详情页 */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <div className="h-full overflow-hidden">
            {selectedStock ? (
              <StockDetailPanel stockCode={selectedStock} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    选择一只股票查看详情
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    从左侧列表中点击股票
                  </p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>

        {/* 拖拽手柄 */}
        <ResizableHandle withHandle />

        {/* 右侧AI聊天面板 */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <AIChatPanel selectedStock={selectedStock} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
