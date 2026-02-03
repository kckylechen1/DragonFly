import React from 'react';
import { Box, Text, useInput } from 'ink';
import { AnimatedDragonfly } from '../components/AnimatedDragonfly.js';
import { DoctorWarnings } from '../components/DoctorWarnings.js';
import { SecurityNotice } from '../components/SecurityNotice.js';

interface Props {
  onNext: () => void;
  onExit: () => void;
}

export function WelcomeStep({ onNext, onExit }: Props) {
  useInput((input, key) => {
    if (input.toLowerCase() === 'q') onExit();
    if (key.return) onNext();
  });

  return (
    <Box flexDirection="column">
      <DoctorWarnings />
      
      <Box marginY={1}>
        <AnimatedDragonfly />
      </Box>
      
      <SecurityNotice />
      
      <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="cyan" paddingX={2} paddingY={1}>
        <Text bold color="cyan">◇ DragonFly Onboarding</Text>
        <Text> </Text>
        <Text>欢迎使用 DragonFly! 🚀</Text>
        <Text color="gray">我们将引导你完成初始配置。</Text>
        <Text color="gray">每一步都可以跳过，稍后在设置中修改。</Text>
      </Box>
      
      <Box marginTop={1}>
        <Text color="green">按 Enter 开始配置</Text>
        <Text> | </Text>
        <Text color="red">按 Q 退出</Text>
      </Box>
    </Box>
  );
}
