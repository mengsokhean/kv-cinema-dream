import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode, forwardRef } from "react";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const PageTransition = forwardRef<HTMLDivElement, { children: ReactNode }>(
  ({ children }, ref) => {
    const location = useLocation();

    return (
      <motion.div
        ref={ref}
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    );
  }
);

PageTransition.displayName = "PageTransition";

export default PageTransition;
