import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import kvLogo from "@/assets/kv-logo.png";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 600); // wait for exit animation
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          {/* Glow ring */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute w-72 h-72 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(45 100% 51% / 0.4), transparent 70%)",
            }}
          />

          {/* Logo */}
          <motion.img
            src={kvLogo}
            alt="KV Movies"
            className="h-28 w-28 rounded-full relative z-10"
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          />

          {/* Brand text */}
          <motion.div
            className="mt-6 flex items-baseline gap-1 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
          >
            <span className="font-display text-4xl tracking-wider text-foreground">KV</span>
            <span className="font-display text-4xl tracking-wider text-gold">MOVIES</span>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            className="mt-8 h-0.5 rounded-full bg-gold/20 overflow-hidden relative z-10"
            style={{ width: 160 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              className="h-full rounded-full bg-gold"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.9, duration: 1.2, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
