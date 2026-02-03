import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import * as fs from 'fs';
import * as path from 'path';

interface Warning {
  type: 'warn' | 'error' | 'info';
  message: string;
}

export function DoctorWarnings() {
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    const detected: Warning[] = [];
    
    // Check .env file
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      detected.push({ type: 'warn', message: 'No .env file found, will create during setup' });
    } else {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      
      // Check API keys
      const hasAnthropicKey = envContent.includes('ANTHROPIC_API_KEY=') && 
        !envContent.match(/ANTHROPIC_API_KEY=\s*$/m);
      const hasOpenAIKey = envContent.includes('OPENAI_API_KEY=') && 
        !envContent.match(/OPENAI_API_KEY=\s*$/m);
      
      if (!hasAnthropicKey && !hasOpenAIKey) {
        detected.push({ type: 'warn', message: 'No AI model API keys configured yet' });
      }
    }

    // Check Node version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    if (majorVersion < 18) {
      detected.push({ type: 'error', message: `Node.js ${nodeVersion} detected. Require v18+` });
    }

    // Check if aktools is running
    // This is a simplified check
    detected.push({ type: 'info', message: 'AKTools service status: check manually' });

    setWarnings(detected);
  }, []);

  const getColor = (type: Warning['type']) => {
    switch (type) {
      case 'error': return 'red';
      case 'warn': return 'yellow';
      case 'info': return 'gray';
    }
  };

  const getIcon = (type: Warning['type']) => {
    switch (type) {
      case 'error': return '✗';
      case 'warn': return '⚠';
      case 'info': return '○';
    }
  };

  if (warnings.length === 0) {
    return (
      <Box>
        <Text color="green">◇ Doctor: All checks passed ✓</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">◇ Doctor warnings</Text>
      {warnings.map((w, i) => (
        <Text key={i} color={getColor(w.type)}>
          {'   '}{getIcon(w.type)} {w.message}
        </Text>
      ))}
    </Box>
  );
}
