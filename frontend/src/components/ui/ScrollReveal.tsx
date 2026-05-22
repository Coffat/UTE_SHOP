import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollReveal({ children, className = "", delay = 0 }: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  const revealTransition = shouldReduceMotion
    ? { duration: 0.1 }
    : {
        type: "tween" as const,
        ease: [0.22, 1, 0.36, 1] as const,
        duration: 0.6,
        delay,
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={revealTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

