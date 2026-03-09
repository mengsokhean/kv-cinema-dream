import { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import SplashScreen from "./components/SplashScreen.tsx";
import "./index.css";

const Root = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleComplete = useCallback(() => setShowSplash(false), []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleComplete} />}
      <App />
    </>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
