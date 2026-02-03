import React, { useState } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import { WelcomeStep } from './steps/WelcomeStep.js';
import { ModelSelectStep } from './steps/ModelSelectStep.js';
import { ApiKeyStep } from './steps/ApiKeyStep.js';
import { StyleQuestionnaireStep } from './steps/StyleQuestionnaireStep.js';
import { SummaryStep } from './steps/SummaryStep.js';

type Step = 'welcome' | 'model' | 'apiKey' | 'style' | 'summary';

interface Config {
  model?: string;
  apiKeys: Record<string, string>;
  userStyle?: Record<string, string>;
}

function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [config, setConfig] = useState<Config>({ apiKeys: {} });
  const { exit } = useApp();

  useInput((input) => {
    if (input.toLowerCase() === 'q' && step === 'welcome') {
      exit();
    }
  });

  const nextStep = (data?: Partial<Config>) => {
    if (data) {
      setConfig((prev) => ({ ...prev, ...data }));
    }
    
    const steps: Step[] = ['welcome', 'model', 'apiKey', 'style', 'summary'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const skipStep = () => nextStep();

  const handleExit = () => {
    exit();
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box 
        marginBottom={1} 
        borderStyle="double" 
        borderColor="red" 
        paddingX={2}
        justifyContent="center"
      >
        <Text bold color="red">🐉 DragonFly</Text>
        <Text color="gray"> - AI 股票分析助手 配置向导</Text>
      </Box>

      {step === 'welcome' && (
        <WelcomeStep onNext={() => nextStep()} onExit={handleExit} />
      )}
      {step === 'model' && (
        <ModelSelectStep onNext={nextStep} onSkip={skipStep} />
      )}
      {step === 'apiKey' && (
        <ApiKeyStep onNext={nextStep} onSkip={skipStep} />
      )}
      {step === 'style' && (
        <StyleQuestionnaireStep onNext={nextStep} onSkip={skipStep} />
      )}
      {step === 'summary' && (
        <SummaryStep config={config} onExit={handleExit} />
      )}

      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray" dimColor>
          Step: {step} | ↑↓ Navigate | Enter Select | Q Quit
        </Text>
      </Box>
    </Box>
  );
}

render(<App />);
