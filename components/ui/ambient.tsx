"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Page-wide atmosphere: a static film-grain layer plus a soft spotlight that
 * follows the pointer. Both are non-interactive and disabled for coarse
 * pointers / reduced-motion users.
 */
export function Ambient() {
  const reducedMotion = useReducedMotion() ?? false;
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const spot = spotRef.current;
    if (!spot) return;

    let frame = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    const paint = () => {
      frame = 0;
      spot.style.setProperty("--spot-x", `${x}px`);
      spot.style.setProperty("--spot-y", `${y}px`);
      spot.style.opacity = "1";
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    paint();
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  return (
    <>
      <div className="ambient-grain" aria-hidden="true" />
      <div ref={spotRef} className="ambient-spotlight" aria-hidden="true" />
    </>
  );
}
