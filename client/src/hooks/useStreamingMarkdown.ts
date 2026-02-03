/**
 * Markdown 流式渲染优化 Hook
 *
 * 负责人: 🟢 Codex
 * ⏱️ 开始时间: 2026-01-30 00:00
 *
 * 作用：将高频的小片段 token 缓冲，按固定时间间隔批量更新给 UI。
 *
 * ⚠️ CRITICAL - 避免每个 token 触发重渲染
 */

import { useEffect, useRef, useState } from "react";

export function useStreamingMarkdown(rawContent: string) {
  const pendingRef = useRef(""); // 尚未提交到 UI 的新内容
  const [displayContent, setDisplayContent] = useState("");
  const lastRawLengthRef = useRef(0);

  useEffect(() => {
    // ⚠️ 核心逻辑：每 50ms 批量 commit 一次
    const interval = setInterval(() => {
      if (pendingRef.current) {
        setDisplayContent((prev) => prev + pendingRef.current);
        pendingRef.current = "";
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // 监听 rawContent 变化，存入 pending
  useEffect(() => {
    if (rawContent.length > lastRawLengthRef.current) {
      const newChunk = rawContent.slice(lastRawLengthRef.current);
      pendingRef.current += newChunk;
      lastRawLengthRef.current = rawContent.length;
    } else if (rawContent.length < lastRawLengthRef.current) {
      // 如果内容变短了（例如重新生成），重置状态
      setDisplayContent(rawContent);
      pendingRef.current = "";
      lastRawLengthRef.current = rawContent.length;
    }
  }, [rawContent]);

  return displayContent;
}
