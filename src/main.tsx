import { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import SplashScreen from "./components/SplashScreen.tsx";
import "./index.css";

const Root = () => {
  const alreadySeen = sessionStorage.getItem("splash_seen") === "1";
  const [showSplash, setShowSplash] = useState(!alreadySeen);
  const handleComplete = useCallback(() => {
    sessionStorage.setItem("splash_seen", "1");
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleComplete} />}
      <App />
    </>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
