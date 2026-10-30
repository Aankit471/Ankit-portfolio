"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { ExternalLink, GitFork, Menu, X } from "lucide-react";

const GITHUB_URL = "https://github.com/Aankit471";
const LINKEDIN_URL = "https://www.linkedin.com/in/ankit-kumar-39a105404/";

/** Sections that take part in the scrollspy, in document order. */
const NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "showcase", label: "Showcase" },
];

export function SiteNav() {
  const [active, setActive] = useState<string>(NAV_ITEMS[0].id);
  const [open, setOpen] = useState(false);

  /* ---- Page scroll progress (thin line at the very top) ---- */
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 30, mass: 0.3 });

  /* ---- Scrollspy: same observer margins as ECHO (-20% / -60%) ---- */
  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  /* ---- Drawer: lock page scroll, close on Escape ---- */
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <motion.div className="scroll-progress" style={{ scaleX: progress }} aria-hidden="true" />

      <nav className="site-nav">
        <a className="nav-brand" href="#home">
          ANKIT<span>•</span>
        </a>

        {/* Center pill */}
        <div className="nav-center-pill">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={active === item.id ? "is-active" : undefined}
              aria-current={active === item.id ? "true" : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right social pill */}
        <div className="nav-social-pill">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            <GitFork size={13} />
            GitHub
          </a>
          <span className="sep" />
          <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
            <ExternalLink size={13} />
            LinkedIn
          </a>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu size={16} />
        </button>
      </nav>

      {/* Mobile drawer (ECHO pattern: blurred backdrop + right slide panel) */}
      <div
        className={`nav-drawer${open ? " is-open" : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        aria-hidden={!open}
      >
        <div className="nav-drawer-panel" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="nav-drawer-head">
            <span className="nav-drawer-brand">ANKIT•</span>
            <button
              className="nav-drawer-close"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="nav-drawer-links">
            {NAV_ITEMS.map((item, index) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: open ? `${120 + index * 55}ms` : "0ms" }}
                className={active === item.id ? "is-active" : undefined}
              >
                <span className="nav-drawer-num">{String(index + 1).padStart(2, "0")}</span>
                {item.label}
              </a>
            ))}
            <a href="#contact" onClick={() => setOpen(false)}>
              <span className="nav-drawer-num">
                {String(NAV_ITEMS.length + 1).padStart(2, "0")}
              </span>
              Contact
            </a>
          </nav>

          <div className="nav-drawer-foot">
            <p className="nav-drawer-name">ANKIT KUMAR</p>
            <p className="nav-drawer-role">B.Tech CSE · Echelon Institute of Technology</p>
            <div className="nav-drawer-socials">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <GitFork size={13} /> GitHub
              </a>
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                <ExternalLink size={13} /> LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
