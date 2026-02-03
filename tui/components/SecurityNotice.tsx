import React from 'react';
import { Box, Text } from 'ink';

export function SecurityNotice() {
  return (
    <Box flexDirection="column" marginY={1}>
      <Text bold color="cyan">◇ Security</Text>
      <Text> </Text>
      <Text color="yellow">   Security warning - please read.</Text>
      <Text> </Text>
      <Text>   DragonFly is an AI-powered stock analysis tool.</Text>
      <Text>   This app will access financial data APIs and LLM APIs.</Text>
      <Text>   Your API keys are stored locally in .env file.</Text>
      <Text> </Text>
      <Text color="green">   Recommended:</Text>
      <Text>   - Use API keys with spending limits</Text>
      <Text>   - Do not share your .env file</Text>
      <Text>   - Review API usage regularly</Text>
    </Box>
  );
}
