import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

const frames = [
  [
    '    ─╲────/─    ',
    '      ╲🔴╱      ',
    '     ══◊══     ',
    '      ╱  ╲      ',
  ],
  [
    '   ══════════   ',
    '      ╲🔴╱      ',
    '    ═══◊═══    ',
    '      ╱  ╲      ',
  ],
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
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const currentFrame = frames[frameIndex];

  return (
    <Box flexDirection="column" alignItems="center">
      {currentFrame.map((line, i) => (
        <Text key={`frame-${frameIndex}-line-${i}`} color="red">{line}</Text>
      ))}
      <Text> </Text>
      <Text bold color="yellow">🐉 DragonFly - AI 股票分析助手</Text>
    </Box>
  );
}
