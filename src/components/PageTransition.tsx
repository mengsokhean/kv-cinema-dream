import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode } from "react";
import React, { forwardRef } from "react"
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const PageTransition = forwardRef(({ children }, ref) => {
  return <div ref={ref}>{children}</div>
})

  return (
    <motion.div
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
};

export default PageTransition;
