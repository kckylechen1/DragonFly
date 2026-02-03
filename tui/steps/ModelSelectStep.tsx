import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface Props {
  onNext: (data: { model: string }) => void;
  onSkip: () => void;
}

const models = [
  { label: '🟣 Claude (Anthropic) - 推荐', value: 'claude' },
  { label: '🟢 GPT-4 (OpenAI)', value: 'gpt4' },
  { label: '🔵 Gemini (Google)', value: 'gemini' },
  { label: '⚫ Grok (X.AI)', value: 'grok' },
  { label: '🟡 DeepSeek', value: 'deepseek' },
  { label: '───────────────────────', value: 'divider' },
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
      <Box borderStyle="single" borderColor="cyan" paddingX={2} paddingY={1} marginBottom={1}>
        <Text bold color="cyan">Step 1/4: 选择主 AI 模型</Text>
      </Box>
      
      <Text color="gray">选择你想使用的主要 AI 模型进行股票分析</Text>
      <Text color="gray">你可以稍后在设置中更改</Text>
      
      <Box marginTop={1}>
        <SelectInput 
          items={models.filter(m => m.value !== 'divider')} 
          onSelect={handleSelect}
        />
      </Box>
      
      <Box marginTop={1}>
        <Text color="gray">↑↓ Navigate  Enter Select  Q Quit</Text>
      </Box>
    </Box>
  );
}
