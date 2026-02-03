import { ThemeProvider } from "@/contexts/ThemeContext";
import { HomePage } from "@/pages/HomePage";
import "@/styles/tokens.css";
import "@/styles/themes/index.css";

export const RefactorApp: React.FC = () => {
  return (
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  );
};

export default RefactorApp;
