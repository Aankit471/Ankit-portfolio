"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion, useSpring } from "motion/react";

interface MagneticProps {
  children: ReactNode;
  /** Maximum travel in px at the element's edge. */
  strength?: number;
  className?: string;
}

/**
 * Gently pulls its child toward the pointer — a small "premium" interaction
 * that stays completely still for reduced-motion users and touch devices.
 */
export function Magnetic({ children, strength = 6, className }: MagneticProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const x = useSpring(0, { stiffness: 260, damping: 22, mass: 0.5 });
  const y = useSpring(0, { stiffness: 260, damping: 22, mass: 0.5 });

  return (
    <motion.div
      className={className}
      style={{ x: reducedMotion ? 0 : x, y: reducedMotion ? 0 : y, display: "inline-flex" }}
      onPointerMove={(event) => {
        if (reducedMotion || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(((event.clientX - rect.left) / rect.width - 0.5) * strength * 2);
        y.set(((event.clientY - rect.top) / rect.height - 0.5) * strength * 2);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
