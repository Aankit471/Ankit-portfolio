"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "showcase", label: "Showcase" },
  { id: "contact", label: "Contact" },
];

/** Fixed rail that reports which section is currently in view. */
export function SectionIndex() {
  const reducedMotion = useReducedMotion() ?? false;
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  useEffect(() => {
    const elements = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const index = SECTIONS.findIndex((section) => section.id === activeId);
  const current = index === -1 ? SECTIONS[0] : SECTIONS[index];

  return (
    <div className="section-index" aria-hidden="true">
      <span className="section-index-num">{String(index + 1).padStart(2, "0")}</span>
      <span className="section-index-line" />
      <span className="section-index-label">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={current.id}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {current.label}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}
