"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, CalendarDays, GitFork, Star, X } from "lucide-react";
import type { Repo } from "./types";

type ProjectModalProps = {
  repo: Repo | null;
  onClose: () => void;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(value));

/** Glassmorphic inspection modal, ported from ECHO's project-modal. */
export function ProjectModal({ repo, onClose }: ProjectModalProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!repo) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [repo, onClose]);

  return (
    <AnimatePresence>
      {repo && (
        <motion.div
          key="project-modal"
          className="project-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            className="project-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: reducedMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="project-modal-head">
              <div>
                <span className="project-modal-category">{repo.language ?? "Open Source"}</span>
                <h3 id="project-modal-title">{repo.name}</h3>
              </div>
              <button className="project-modal-close" onClick={onClose} aria-label="Close project details">
                <X size={15} />
              </button>
            </div>

            <div className="project-modal-art" aria-hidden="true">
              <span className="project-modal-art-grid" />
              <span className="project-modal-art-mark">{repo.name.slice(0, 2).toUpperCase()}</span>
              {repo.fork && <span className="project-modal-fork">FORK</span>}
            </div>

            <p className="project-modal-desc">
              {repo.description || "No description provided by this repository."}
            </p>

            <div className="project-modal-stats">
              <div>
                <span className="project-modal-stat-label">
                  <Star size={12} /> Stars
                </span>
                <span className="project-modal-stat-value">{repo.stargazers_count}</span>
              </div>
              <div>
                <span className="project-modal-stat-label">
                  <GitFork size={12} /> Forks
                </span>
                <span className="project-modal-stat-value">{repo.forks_count}</span>
              </div>
              <div>
                <span className="project-modal-stat-label">
                  <CalendarDays size={12} /> Updated
                </span>
                <span className="project-modal-stat-value">{formatDate(repo.updated_at)}</span>
              </div>
            </div>

            <div className="project-modal-tags">
              <span>{repo.language ?? "Language not specified"}</span>
              <span>{repo.full_name}</span>
            </div>

            <a
              className="project-modal-cta"
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
            >
              View repository <ArrowUpRight size={14} />
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
