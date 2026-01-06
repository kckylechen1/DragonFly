-- 记忆与对话系统数据库设计 (PostgreSQL + pgvector)

-- 1. 启用向量扩展 (未来做 RAG 检索用)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 会话表 (Chat Sessions)
-- 对应左侧列表的每只股票的聊天窗口
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,          -- 关联用户
    stock_code VARCHAR(20),         -- 关联股票 (为空则代表通用闲聊)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 消息表 (Raw Messages) - 短期记忆
-- 存储完整的聊天记录，用于构建上下文 Context
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id),
    role VARCHAR(20) NOT NULL,      -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,          -- 消息内容
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- 扩展字段，用于前端交互
    is_helpful BOOLEAN,             -- 点赞/点踩
    tokens_usage INTEGER            -- Token 消耗记录
);

-- 4. 交易观点/长期记忆表 (Structured Memories) - 长期记忆
-- 这是 AI 从对话中"提取"出来的关键信息，用于未来的向量检索
CREATE TABLE memories (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    stock_code VARCHAR(20),         -- 关联股票
    
    -- 核心记忆内容
    insight_text TEXT NOT NULL,     -- 观点摘要，例如 "认为比亚迪在260元有支撑"
    sentiment VARCHAR(20),          -- 'bullish'(看多), 'bearish'(看空), 'neutral'(中性)
    
    -- 来源追踪
    original_message_id INTEGER REFERENCES messages(id), -- 来源消息
    
    -- 向量嵌入 (用于语义搜索)
    -- 维度 1536 (对应 OpenAI/DeepSeek embedding 模型)
    embedding vector(1536),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 索引设计
CREATE INDEX idx_messages_session ON messages(session_id);
-- 向量索引 (IVFFlat 或 HNSW)
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);

/*
使用场景示例：

1. 写入记忆 (当用户说："我觉得三七互娱技术面破位了，要跌")
   -> 存入 messages 表 (原始对话)
   -> AI 分析提取 -> 存入 memories 表:
      insight_text: "认为三七互娱技术面破位，看跌"
      sentiment: "bearish"
      stock_code: "002555"
      embedding: [0.12, -0.33, ...] (向量化)

2. 回忆检索 (当用户问："我之前看空过哪些票？")
   -> SELECT * FROM memories 
      WHERE user_id = current_user 
      AND sentiment = 'bearish'
      ORDER BY created_at DESC;

3. 语义关联 (当用户看"完美世界"时)
   -> 系统查询：有什么关于"游戏股"类似的历史观点？
   -> vector 相似度搜索 memories 表
*/
