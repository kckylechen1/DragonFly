# Agent Optimization 研究笔记（Phase 0）

更新时间：2026-01-24

## FinRobot（agents/ 目录 + Director Agent）
- 目录结构以 AutoGen 为核心，提供单 Agent、RAG 增强、Shadow 模式、多 Agent 协作等多种工作流；核心模块集中在 `finrobot/agents/`。
- Multi‑assistant with leader（导演/指挥型 Agent）使用“Leader + Sub‑agents”的协作模式：Leader 负责分解/协调，子代理负责专业子任务，最终汇总答案。
- Agent 框架包含任务调度、Agent 注册、Tool/Memory/RAG 组件的标准化接口，强调可插拔与多工作流复用。

## OrchestraLLM（可学习路由）
- 通过“Exemplar Pool（示例池）”为每个 API/模型收集对话状态样本，并用微调过的句向量模型衡量对话状态相似度。
- 采用 kNN 检索最相似示例并用多数投票决定路由目标，实现“小模型 + 检索 + 投票”的轻量路由。
- 关键启发：路由器不必完全依赖分类器；“相似度检索 + 投票”在成本与稳定性上更划算。

## Probabilistic Consensus（多模型共识）
- “Ensemble Validation / Consensus”思路：多个模型对同一输入给出答案，通过一致性（agreement）提升可靠性。
- 通过统计模型间一致率，能在几乎不牺牲太多召回的前提下提升精度，强调“少数模型的一致性就能显著提升置信度”。
- 对工程落地的启发：关键决策走“多数投票 + 仲裁”，且可按模型质量加权。

## FinRL（回测与风控）
- 典型“训练‑验证‑回测/交易”流水线，强调数据处理、环境建模与回测评估的一体化。
- 在应用层提供风险控制、评估指标与策略对比的组件化框架，利于在 Agent 侧调用“回测/风控”模块化能力。

## FinGPT（金融领域微调与数据）
- 聚焦金融语料与指令数据集构建，通过指令微调/LoRA 等方式对 LLM 进行金融域适配。
- 工程启发：提示词需要对“数据来源与结构化输出”做强约束，降低幻觉与泛化失真。

## LangChain Router 设计模式（参考）
- Router 将用户请求分派到不同子链/子 Agent，常见模式是：路由器先判定意图 → 分派到专用链 → 汇总输出。
- 规则/模型混合路由是常见落地手段，能在稳定性与灵活性间取得平衡。

---

### 可借鉴的设计模式（落地提炼）
1. **路由层“检索 + 投票”**：对话状态嵌入 + kNN + 多数投票 → 轻量、低成本的可学习路由。
2. **关键决策的多模型共识**：并行多模型 → 一致性评分 → 仲裁模型兜底。
3. **Leader‑SubAgent 协作**：复杂任务先拆解，细分为技术/资金/基本面/情绪等子任务并行完成。
4. **强数据约束提示词**：系统层强制“仅使用实时数据、不可使用训练记忆”。
5. **可切换输出模板**：简洁/详细两套 prompt，按用户或任务切换。

### 参考链接（用于复核）
- FinRobot GitHub: https://github.com/AI4Finance-Foundation/FinRobot
- FinRobot Agents DeepWiki: https://deepwiki.com/AI4Finance-Foundation/FinRobot/3.1-agent-framework
- FinRobot Multi‑Assistant: https://deepwiki.com/AI4Finance-Foundation/FinRobot/3.3-multi-assistant-workflows
- OrchestraLLM 摘要: https://www.emergentmind.com/papers/2311.00990
- Probabilistic Consensus 摘要: https://www.emergentmind.com/papers/2408.11318
- FinRL GitHub: https://github.com/AI4Finance-Foundation/FinRL
- FinGPT GitHub: https://github.com/AI4Finance-Foundation/FinGPT
- LangChain Router Docs: https://python.langchain.com/docs/concepts/routing/
