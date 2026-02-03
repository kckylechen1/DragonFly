
interface SentimentTabProps {
  symbol: string;
}

export const SentimentTab: React.FC<SentimentTabProps> = ({ symbol }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="text-4xl mb-4">📊</div>
      <p className="text-[var(--text-muted)] text-sm">情绪数据加载中...</p>
      <p className="text-xs text-[var(--text-muted)] mt-2">
        股票代码: {symbol}
      </p>
    </div>
  );
};

export default SentimentTab;
