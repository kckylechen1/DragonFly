import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import * as fs from 'fs';
import * as path from 'path';

interface Config {
  model?: string;
  apiKeys: Record<string, string>;
  userStyle?: Record<string, string>;
}

interface Props {
  config: Config;
  onExit: () => void;
}

const modelLabels: Record<string, string> = {
  claude: '🟣 Claude (Anthropic)',
  gpt4: '🟢 GPT-4 (OpenAI)',
  gemini: '🔵 Gemini (Google)',
  grok: '⚫ Grok (X.AI)',
  deepseek: '🟡 DeepSeek',
};

const styleLabels: Record<string, Record<string, string>> = {
  riskTolerance: {
    conservative: '🛡️ 保守',
    moderate: '⚖️ 中性',
    aggressive: '🚀 激进',
  },
  tradingFrequency: {
    longterm: '📅 长线',
    midterm: '📆 中线',
    shortterm: '📈 短线',
    intraday: '⚡ 日内',
  },
  analysisDepth: {
    brief: '📌 简洁',
    standard: '📋 标准',
    detailed: '📚 详尽',
  },
  marketFocus: {
    a_share: '🇨🇳 A股',
    hk_stock: '🇭🇰 港股',
    us_stock: '🇺🇸 美股',
    multi_market: '🌍 多市场',
  },
};

export function SummaryStep({ config, onExit }: Props) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (input.toLowerCase() === 's' && !saved) {
      saveConfig(config);
    }
    if (key.return || input.toLowerCase() === 'q') {
      onExit();
    }
  });

  const saveConfig = (cfg: Config) => {
    try {
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      
      // Read existing .env if exists
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
        if (!envContent.endsWith('\n')) {
          envContent += '\n';
        }
        envContent += '\n# === DragonFly TUI Config ===\n';
      }
      
      if (cfg.model) {
        envContent += `PRIMARY_MODEL=${cfg.model}\n`;
      }
      
      Object.entries(cfg.apiKeys || {}).forEach(([key, value]) => {
        envContent += `${key}=${value}\n`;
      });
      
      if (cfg.userStyle) {
        Object.entries(cfg.userStyle).forEach(([key, value]) => {
          const envKey = `USER_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
          envContent += `${envKey}=${value}\n`;
        });
      }
      
      fs.writeFileSync(envPath, envContent);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const apiKeysCount = Object.keys(config.apiKeys || {}).length;
  const hasStyle = config.userStyle && Object.keys(config.userStyle).length > 0;

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor="green" paddingX={2} paddingY={1} marginBottom={1}>
        <Text bold color="green">✓ Step 4/4: 配置汇总</Text>
      </Box>
      
      <Box flexDirection="column" marginY={1}>
        <Text bold>主模型:</Text>
        <Text color={config.model ? 'green' : 'gray'}>
          {'  '}{config.model ? modelLabels[config.model] || config.model : '未设置'}
        </Text>
      </Box>
      
      <Box flexDirection="column" marginY={1}>
        <Text bold>API Keys:</Text>
        {apiKeysCount > 0 ? (
          Object.keys(config.apiKeys).map(key => (
            <Text key={key} color="green">{'  '}✓ {key}</Text>
          ))
        ) : (
          <Text color="gray">{'  '}未配置</Text>
        )}
      </Box>
      
      <Box flexDirection="column" marginY={1}>
        <Text bold>用户风格:</Text>
        {hasStyle ? (
          Object.entries(config.userStyle!).map(([key, value]) => (
            <Text key={key} color="green">
              {'  '}{styleLabels[key]?.[value] || value}
            </Text>
          ))
        ) : (
          <Text color="gray">{'  '}未设置</Text>
        )}
      </Box>
      
      {error && (
        <Box marginY={1}>
          <Text color="red">✗ 保存失败: {error}</Text>
        </Box>
      )}
      
      {saved && (
        <Box marginY={1}>
          <Text color="green" bold>✓ 已保存到 .env 文件</Text>
        </Box>
      )}
      
      <Box marginTop={1} borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
        {!saved ? (
          <>
            <Text color="cyan">[S] 保存到 .env</Text>
            <Text> | </Text>
            <Text color="green">[Enter] 完成退出</Text>
          </>
        ) : (
          <Text color="green">[Enter] 完成退出</Text>
        )}
      </Box>
    </Box>
  );
}
