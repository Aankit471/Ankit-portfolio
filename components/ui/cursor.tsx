"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

const INTERACTIVE = "a, button, [role='option'], summary, input, textarea, select";

/**
 * Two-part pointer cursor: an instant dot plus a spring-trailed ring that
 * expands over interactive elements. Desktop pointers only.
 */
export function Cursor() {
  const reducedMotion = useReducedMotion() ?? false;
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const ringX = useSpring(x, { stiffness: 340, damping: 28, mass: 0.4 });
  const ringY = useSpring(y, { stiffness: 340, damping: 28, mass: 0.4 });

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    document.documentElement.classList.add("has-custom-cursor");

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      const target = event.target as Element | null;
      setHovering(Boolean(target?.closest?.(INTERACTIVE)));
    };

    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [reducedMotion, x, y]);

  return (
    <div className="cursor-layer" aria-hidden="true" data-visible={visible}>
      <motion.span
        className="cursor-dot"
        style={{ x, y }}
        animate={{ scale: hovering ? 0.35 : 1, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className="cursor-ring"
        style={{ x: ringX, y: ringY }}
        animate={{
          scale: hovering ? 1.85 : 1,
          opacity: visible ? (hovering ? 0.95 : 0.45) : 0,
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
