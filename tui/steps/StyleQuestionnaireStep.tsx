import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';

interface Props {
  onNext: (data: { userStyle: Record<string, string> }) => void;
  onSkip: () => void;
}

const questions = [
  {
    key: 'riskTolerance',
    title: '📊 你的风险偏好是？',
    options: [
      { label: '🛡️ 保守 - 稳健为主，低波动', value: 'conservative' },
      { label: '⚖️ 中性 - 平衡收益与风险', value: 'moderate' },
      { label: '🚀 激进 - 追求高收益，接受高波动', value: 'aggressive' },
      { label: '───────────────────────', value: 'divider' },
      { label: '⏭️ Skip', value: 'skip' },
    ],
  },
  {
    key: 'tradingFrequency',
    title: '⏱️ 你的交易频率是？',
    options: [
      { label: '📅 长线 - 持股数月到数年', value: 'longterm' },
      { label: '📆 中线 - 持股数周到数月', value: 'midterm' },
      { label: '📈 短线 - 持股数天', value: 'shortterm' },
      { label: '⚡ 日内 - 当天买卖', value: 'intraday' },
      { label: '───────────────────────', value: 'divider' },
      { label: '⏭️ Skip', value: 'skip' },
    ],
  },
  {
    key: 'analysisDepth',
    title: '📝 你希望分析报告的详细程度？',
    options: [
      { label: '📌 简洁 - 关键结论即可', value: 'brief' },
      { label: '📋 标准 - 包含主要分析', value: 'standard' },
      { label: '📚 详尽 - 完整技术分析和数据', value: 'detailed' },
      { label: '───────────────────────', value: 'divider' },
      { label: '⏭️ Skip', value: 'skip' },
    ],
  },
  {
    key: 'marketFocus',
    title: '🌏 你主要关注哪个市场？',
    options: [
      { label: '🇨🇳 A股 (沪深)', value: 'a_share' },
      { label: '🇭🇰 港股', value: 'hk_stock' },
      { label: '🇺🇸 美股', value: 'us_stock' },
      { label: '🌍 多市场', value: 'multi_market' },
      { label: '───────────────────────', value: 'divider' },
      { label: '⏭️ Skip', value: 'skip' },
    ],
  },
];

export function StyleQuestionnaireStep({ onNext, onSkip }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useInput((input) => {
    if (input.toLowerCase() === 'q') {
      onSkip();
    }
  });

  const currentQuestion = questions[questionIndex];

  const handleSelect = (item: { value: string }) => {
    if (item.value === 'divider') return;
    
    if (item.value === 'skip') {
      if (questionIndex < questions.length - 1) {
        setQuestionIndex((i) => i + 1);
      } else {
        if (Object.keys(answers).length > 0) {
          onNext({ userStyle: answers });
        } else {
          onSkip();
        }
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

  const answeredCount = Object.keys(answers).length;

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor="cyan" paddingX={2} paddingY={1} marginBottom={1}>
        <Text bold color="cyan">Step 3/4: 用户风格问卷</Text>
        <Text color="gray"> ({questionIndex + 1}/{questions.length})</Text>
      </Box>
      
      {answeredCount > 0 && (
        <Text color="green" dimColor>已回答 {answeredCount} 个问题</Text>
      )}
      
      <Box marginY={1}>
        <Text bold color="yellow">{currentQuestion.title}</Text>
      </Box>
      
      <SelectInput 
        items={currentQuestion.options.filter(o => o.value !== 'divider')} 
        onSelect={handleSelect}
      />
      
      <Box marginTop={1}>
        <Text color="gray">↑↓ Navigate  Enter Select  Q Skip All</Text>
      </Box>
    </Box>
  );
}
