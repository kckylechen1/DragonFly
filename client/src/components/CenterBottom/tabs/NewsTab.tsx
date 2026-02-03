
interface NewsTabProps {
  symbol: string;
}

export const NewsTab: React.FC<NewsTabProps> = ({ symbol }) => {
  const mockNews = [
    {
      id: "1",
      title: "重大公告",
      summary: "2026-01-19 公司发布三季度业绩报告...",
      time: "10:30",
    },
    {
      id: "2",
      title: "行业动态",
      summary: "本月光芯片产业景气度提升...",
      time: "09:15",
    },
  ];

  return (
    <div className="space-y-3">
      {mockNews.map(news => (
        <div
          key={news.id}
          className="p-3 bg-[var(--bg-secondary)] rounded hover:bg-[var(--panel-hover)] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-[var(--text-primary)]">
              {news.title}
            </p>
            <span className="text-xs text-[var(--text-muted)]">
              {news.time}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
            {news.summary}
          </p>
        </div>
      ))}
    </div>
  );
};

export default NewsTab;
