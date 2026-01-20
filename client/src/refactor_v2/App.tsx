import React from "react";
import { ThemeProvider } from "@/refactor_v2/contexts/ThemeContext";
import { HomePage } from "@/refactor_v2/pages/HomePage";
import "@/refactor_v2/styles/tokens.css";
import "@/refactor_v2/styles/themes/index.css";

export const RefactorApp: React.FC = () => {
  return (
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  );
};

export default RefactorApp;
