import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';

interface Props {
  onNext: (data: { apiKeys: Record<string, string> }) => void;
  onSkip: () => void;
}

const apiOptions = [
  { label: '🟣 Anthropic API Key', value: 'ANTHROPIC_API_KEY' },
  { label: '🟢 OpenAI API Key', value: 'OPENAI_API_KEY' },
  { label: '🔵 Gemini API Key', value: 'GEMINI_API_KEY' },
  { label: '⚫ X.AI (Grok) API Key', value: 'XAI_API_KEY' },
  { label: '🟡 DeepSeek API Key', value: 'DEEPSEEK_API_KEY' },
  { label: '📊 AKShare Token (可选)', value: 'AKSHARE_TOKEN' },
  { label: '───────────────────────', value: 'divider' },
  { label: '✓ Done / Skip for now', value: 'done' },
];

export function ApiKeyStep({ onNext, onSkip }: Props) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  useInput((input, key) => {
    if (input.toLowerCase() === 'q' && !editing) {
      onSkip();
    }
    if (key.escape && editing) {
      setEditing(null);
      setInputValue('');
    }
  });

  const handleSelect = (item: { value: string }) => {
    if (item.value === 'done') {
      if (Object.keys(keys).length > 0) {
        onNext({ apiKeys: keys });
      } else {
        onSkip();
      }
    } else if (item.value !== 'divider') {
      setEditing(item.value);
      setInputValue(keys[item.value] || '');
    }
  };

  const handleSubmit = () => {
    if (editing && inputValue.trim()) {
      setKeys((prev) => ({ ...prev, [editing]: inputValue.trim() }));
    }
    setEditing(null);
    setInputValue('');
  };

  if (editing) {
    const keyLabel = apiOptions.find(o => o.value === editing)?.label || editing;
    return (
      <Box flexDirection="column">
        <Box borderStyle="single" borderColor="cyan" paddingX={2} paddingY={1} marginBottom={1}>
          <Text bold color="cyan">Step 2/4: API Keys 配置</Text>
        </Box>
        
        <Text bold color="yellow">输入 {keyLabel}:</Text>
        <Box marginY={1}>
          <Text color="gray">{'> '}</Text>
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            mask="*"
          />
        </Box>
        <Text color="gray">按 Enter 确认 | Esc 取消</Text>
      </Box>
    );
  }

  const configuredCount = Object.keys(keys).length;
  const configuredKeys = Object.keys(keys);

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor="cyan" paddingX={2} paddingY={1} marginBottom={1}>
        <Text bold color="cyan">Step 2/4: API Keys 配置</Text>
      </Box>
      
      <Text color="gray">配置你的 API 密钥用于访问 AI 模型和数据服务</Text>
      
      {configuredCount > 0 && (
        <Box marginY={1} flexDirection="column">
          <Text color="green">✓ 已配置 {configuredCount} 个密钥:</Text>
          {configuredKeys.map(k => (
            <Text key={k} color="gray">  - {k}</Text>
          ))}
        </Box>
      )}
      
      <Box marginTop={1}>
        <SelectInput 
          items={apiOptions.filter(m => m.value !== 'divider')} 
          onSelect={handleSelect}
        />
      </Box>
      
      <Box marginTop={1}>
        <Text color="gray">↑↓ Navigate  Enter Select  Q Skip</Text>
      </Box>
    </Box>
  );
}
