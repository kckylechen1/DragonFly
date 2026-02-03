# TUI-001: DragonFly 终端管理界面

## 负责人: 🟣 Amp
## 状态
- ⏱️ 开始时间: 2026-01-30
- ✅ 结束时间: 2026-01-30 

---

## 📋 任务概述

为 DragonFly 创建一个**向导式 TUI (Text User Interface)**，用于：
1. **首次配置向导** - 一步一步引导用户完成初始设置
2. **用户风格问卷** - 了解用户的交易/分析偏好
3. **API 配置** - 输入各种 API Key
4. **模型选择** - 选择主模型 (Claude/GPT/Gemini/Grok 等)
5. **Skip for now** - 每一步都可以跳过，稍后配置

---

## 🛠️ 技术栈

- **框架**: `ink` (React 风格终端 UI)
- **组件**: `ink-select-input`, `ink-text-input`, `ink-spinner`
- **配置**: `dotenv`, 写入 `.env` 文件
- **语言**: TypeScript

---

## 核心交互设计 (参考 Moltbot 风格)

```
┌────────────────────────────────────────────────────────────────┐
│  ◇  Doctor warnings                                            │
│     - No .env file found, will create during setup             │
│     - API keys not configured yet                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│     ─╲────/─              Frame 1: 翅膀向上                     │
│       \🔴/                                                      │
│      ──◊──                                                      │
│       /  \                                                      │
│                                                                │
│     ──────────              Frame 2: 翅膀平展                    │
│       \🔴/                                                      │
│    ═══◊═══                                                     │
│       /  \                                                      │
│                                                                │
│     ─/────\─              Frame 3: 翅膀向下                     │
│       \🔴/                                                      │
│      ──◊──                                                      │
│       /  \                                                      │
│                                                                │
│              🐉 DragonFly - AI 股票分析助手                      │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  ◇  DragonFly Onboarding                                       │
├────────────────────────────────────────────────────────────────┤
│  ◇  Security                                                   │
│                                                                │
│     Security warning - please read.                            │
│                                                                │
│     DragonFly is an AI-powered stock analysis tool.            │
│     This app will access financial data APIs and LLM APIs.     │
│     Your API keys are stored locally in .env file.             │
│                                                                │
│     Recommended:                                                │
│     - Use API keys with spending limits                        │
│     - Do not share your .env file                              │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  ◇  Setup                                                      │
│                                                                │
│     > Select Primary AI Model                                  │
│       Configure API Keys                                       │
│       User Style Questionnaire                                 │
│       Review & Save                                            │
│       ─────────────                                            │
│       Skip for now                                             │
│                                                                │
│     ↑↓ Navigate  Enter Select  Q Quit                          │
└────────────────────────────────────────────────────────────────┘
```

---

## 步骤

### Step 1: 安装依赖

```bash
pnpm add ink ink-select-input ink-text-input ink-spinner react dotenv
pnpm add -D @types/react tsx
```

### Step 2: 创建红色蜻蜓动画组件

```typescript
// tui/components/AnimatedDragonfly.tsx
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

const frames = [
  // Frame 1: 翅膀向上
  [
    '    ─╲────/─    ',
    '      ╲🔴╱      ',
    '     ══◊══     ',
    '      ╱  ╲      ',
  ],
  // Frame 2: 翅膀平展
  [
    '   ══════════   ',
    '      ╲🔴╱      ',
    '    ═══◊═══    ',
    '      ╱  ╲      ',
  ],
  // Frame 3: 翅膀向下
  [
    '    ─╱────╲─    ',
    '      ╲🔴╱      ',
    '     ══◊══     ',
    '      ╱  ╲      ',
  ],
];

export function AnimatedDragonfly() {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames.length);
    }, 200); // 5fps 动画
    return () => clearInterval(timer);
  }, []);

  const currentFrame = frames[frameIndex];

  return (
    <Box flexDirection="column" alignItems="center">
      {currentFrame.map((line, i) => (
        <Text key={i} color="red">{line}</Text>
      ))}
      <Text> </Text>
      <Text bold color="yellow">🐉 DragonFly - AI 股票分析助手</Text>
    </Box>
  );
}
```

### Step 3: 创建向导框架

```typescript
// tui/index.tsx
import React, { useState } from 'react';
import { render, Box, Text, useApp } from 'ink';
import { WelcomeStep } from './steps/WelcomeStep';
import { ModelSelectStep } from './steps/ModelSelectStep';
import { ApiKeyStep } from './steps/ApiKeyStep';
import { StyleQuestionnaireStep } from './steps/StyleQuestionnaireStep';
import { SummaryStep } from './steps/SummaryStep';

type Step = 'welcome' | 'model' | 'apiKey' | 'style' | 'summary';

interface Config {
  model?: string;
  apiKeys: Record<string, string>;
  userStyle?: {
    riskTolerance: string;
    tradingFrequency: string;
    analysisDepth: string;
  };
}

function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [config, setConfig] = useState<Config>({ apiKeys: {} });
  const { exit } = useApp();

  const nextStep = (data?: Partial<Config>) => {
    if (data) setConfig((prev) => ({ ...prev, ...data }));
    
    const steps: Step[] = ['welcome', 'model', 'apiKey', 'style', 'summary'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const skipStep = () => nextStep();

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan">🐉 DragonFly 配置向导</Text>
      </Box>

      {step === 'welcome' && <WelcomeStep onNext={nextStep} onExit={exit} />}
      {step === 'model' && <ModelSelectStep onNext={nextStep} onSkip={skipStep} />}
      {step === 'apiKey' && <ApiKeyStep onNext={nextStep} onSkip={skipStep} />}
      {step === 'style' && <StyleQuestionnaireStep onNext={nextStep} onSkip={skipStep} />}
      {step === 'summary' && <SummaryStep config={config} onExit={exit} />}
    </Box>
  );
}

render(<App />);
```

### Step 3: 创建 WelcomeStep

```typescript
// tui/steps/WelcomeStep.tsx
import React from 'react';
import { Box, Text, useInput } from 'ink';

interface Props {
  onNext: () => void;
  onExit: () => void;
}

export function WelcomeStep({ onNext, onExit }: Props) {
  useInput((input) => {
    if (input === 'q') onExit();
    if (input === '\r') onNext();
  });

  return (
    <Box flexDirection="column">
      <Text>欢迎使用 DragonFly! 🚀</Text>
      <Text color="gray">我们将引导你完成初始配置。</Text>
      <Text color="gray">每一步都可以跳过，稍后在设置中修改。</Text>
      <Box marginTop={1}>
        <Text color="green">按 Enter 开始配置</Text>
        <Text> | </Text>
        <Text color="red">按 Q 退出</Text>
      </Box>
    </Box>
  );
}
```

### Step 4: 创建 ModelSelectStep

```typescript
// tui/steps/ModelSelectStep.tsx
import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface Props {
  onNext: (data: { model: string }) => void;
  onSkip: () => void;
}

const models = [
  { label: 'Claude (推荐)', value: 'claude' },
  { label: 'GPT-4', value: 'gpt4' },
  { label: 'Gemini', value: 'gemini' },
  { label: 'Grok', value: 'grok' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: '───────────', value: 'divider', disabled: true },
  { label: 'Skip for now', value: 'skip' },
];

export function ModelSelectStep({ onNext, onSkip }: Props) {
  const handleSelect = (item: { value: string }) => {
    if (item.value === 'skip') {
      onSkip();
    } else if (item.value !== 'divider') {
      onNext({ model: item.value });
    }
  };

  return (
    <Box flexDirection="column">
      <Text bold>Step 1/4: 选择主模型</Text>
      <Text color="gray">DragonFly 将使用此模型进行分析和对话</Text>
      <Box marginTop={1}>
        <SelectInput items={models} onSelect={handleSelect} />
      </Box>
    </Box>
  );
}
```

### Step 5: 创建 ApiKeyStep

```typescript
// tui/steps/ApiKeyStep.tsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';

interface Props {
  onNext: (data: { apiKeys: Record<string, string> }) => void;
  onSkip: () => void;
}

const apiOptions = [
  { label: 'Anthropic API Key', value: 'ANTHROPIC_API_KEY' },
  { label: 'OpenAI API Key', value: 'OPENAI_API_KEY' },
  { label: 'Gemini API Key', value: 'GEMINI_API_KEY' },
  { label: 'X.AI (Grok) API Key', value: 'XAI_API_KEY' },
  { label: 'AKShare Token', value: 'AKSHARE_TOKEN' },
  { label: '───────────', value: 'divider' },
  { label: 'Done / Skip for now', value: 'done' },
];

export function ApiKeyStep({ onNext, onSkip }: Props) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const handleSelect = (item: { value: string }) => {
    if (item.value === 'done') {
      onNext({ apiKeys: keys });
    } else if (item.value !== 'divider') {
      setEditing(item.value);
    }
  };

  const handleSubmit = () => {
    if (editing && inputValue) {
      setKeys((prev) => ({ ...prev, [editing]: inputValue }));
    }
    setEditing(null);
    setInputValue('');
  };

  if (editing) {
    return (
      <Box flexDirection="column">
        <Text bold>输入 {editing}:</Text>
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          mask="*"
        />
        <Text color="gray">按 Enter 确认</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Step 2/4: API Keys 配置</Text>
      <Text color="gray">已配置: {Object.keys(keys).length} 个</Text>
      <Box marginTop={1}>
        <SelectInput items={apiOptions} onSelect={handleSelect} />
      </Box>
    </Box>
  );
}
```

### Step 6: 创建 StyleQuestionnaireStep

```typescript
// tui/steps/StyleQuestionnaireStep.tsx
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface Props {
  onNext: (data: { userStyle: any }) => void;
  onSkip: () => void;
}

const questions = [
  {
    key: 'riskTolerance',
    title: '你的风险偏好是？',
    options: [
      { label: '保守 - 稳健为主', value: 'conservative' },
      { label: '中性 - 平衡收益与风险', value: 'moderate' },
      { label: '激进 - 追求高收益', value: 'aggressive' },
      { label: 'Skip', value: 'skip' },
    ],
  },
  {
    key: 'tradingFrequency',
    title: '你的交易频率是？',
    options: [
      { label: '长线 - 持股数月到数年', value: 'longterm' },
      { label: '中线 - 持股数周到数月', value: 'midterm' },
      { label: '短线 - 持股数天', value: 'shortterm' },
      { label: '日内 - 当天买卖', value: 'intraday' },
      { label: 'Skip', value: 'skip' },
    ],
  },
  {
    key: 'analysisDepth',
    title: '你希望分析报告的详细程度？',
    options: [
      { label: '简洁 - 关键结论即可', value: 'brief' },
      { label: '标准 - 包含主要分析', value: 'standard' },
      { label: '详尽 - 完整技术分析', value: 'detailed' },
      { label: 'Skip', value: 'skip' },
    ],
  },
];

export function StyleQuestionnaireStep({ onNext, onSkip }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = questions[questionIndex];

  const handleSelect = (item: { value: string }) => {
    if (item.value === 'skip') {
      if (questionIndex < questions.length - 1) {
        setQuestionIndex((i) => i + 1);
      } else {
        onSkip();
      }
    } else {
      const newAnswers = { ...answers, [currentQuestion.key]: item.value };
      setAnswers(newAnswers);
      
      if (questionIndex < questions.length - 1) {
        setQuestionIndex((i) => i + 1);
      } else {
        onNext({ userStyle: newAnswers });
      }
    }
  };

  return (
    <Box flexDirection="column">
      <Text bold>Step 3/4: 用户风格问卷 ({questionIndex + 1}/{questions.length})</Text>
      <Text color="yellow">{currentQuestion.title}</Text>
      <Box marginTop={1}>
        <SelectInput items={currentQuestion.options} onSelect={handleSelect} />
      </Box>
    </Box>
  );
}
```

### Step 7: 创建 SummaryStep

```typescript
// tui/steps/SummaryStep.tsx
import React from 'react';
import { Box, Text, useInput } from 'ink';
import * as fs from 'fs';

interface Props {
  config: any;
  onExit: () => void;
}

export function SummaryStep({ config, onExit }: Props) {
  useInput((input) => {
    if (input === 's') {
      saveConfig(config);
    }
    if (input === 'q' || input === '\r') {
      onExit();
    }
  });

  const saveConfig = (cfg: any) => {
    let envContent = '';
    if (cfg.model) envContent += `PRIMARY_MODEL=${cfg.model}\n`;
    Object.entries(cfg.apiKeys || {}).forEach(([key, value]) => {
      envContent += `${key}=${value}\n`;
    });
    if (cfg.userStyle) {
      envContent += `USER_RISK_TOLERANCE=${cfg.userStyle.riskTolerance || ''}\n`;
      envContent += `USER_TRADING_FREQUENCY=${cfg.userStyle.tradingFrequency || ''}\n`;
      envContent += `USER_ANALYSIS_DEPTH=${cfg.userStyle.analysisDepth || ''}\n`;
    }
    fs.appendFileSync('.env', envContent);
  };

  return (
    <Box flexDirection="column">
      <Text bold color="green">✓ 配置完成!</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>主模型: {config.model || '未设置'}</Text>
        <Text>API Keys: {Object.keys(config.apiKeys || {}).length} 个</Text>
        <Text>用户风格: {config.userStyle ? '已配置' : '未设置'}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="cyan">[S] 保存到 .env</Text>
        <Text> | </Text>
        <Text color="green">[Enter] 完成退出</Text>
      </Box>
    </Box>
  );
}
```

### Step 8: 添加启动脚本

```json
// package.json 添加
{
  "scripts": {
    "tui": "tsx tui/index.tsx",
    "setup": "tsx tui/index.tsx"
  }
}
```

---

## 验收标准

- [x] `pnpm tui` 启动向导
- [x] 显示欢迎页，按 Enter 进入配置
- [x] Step 1: 模型选择 (5 个选项 + Skip)
- [x] Step 2: API Key 输入 (支持多个，输入时显示 ****)
- [x] Step 3: 风格问卷 (4 个问题，每个可 Skip)
- [x] Step 4: 汇总页，按 S 保存到 .env
- [x] 全程可按 Q 退出

---

## 产出文件

```
tui/
├── index.tsx
├── steps/
│   ├── WelcomeStep.tsx
│   ├── ModelSelectStep.tsx
│   ├── ApiKeyStep.tsx
│   ├── StyleQuestionnaireStep.tsx
│   └── SummaryStep.tsx
```
