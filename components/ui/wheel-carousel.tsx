"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Code2,
  GitFork,
  Star,
} from "lucide-react";
import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Magnetic } from "@/components/ui/magnetic";

export interface WheelCarouselItem {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  fork: boolean;
}

interface WheelCarouselProps {
  items: WheelCarouselItem[];
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function shortestOffset(index: number, rotation: number, length: number) {
  let offset = index - rotation;
  while (offset > length / 2) offset -= length;
  while (offset < -length / 2) offset += length;
  return offset;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** GitHub's public social-preview image for a repository (no API key, CORS `*`). */
function previewUrl(htmlUrl: string) {
  const slug = htmlUrl.replace(/^https?:\/\/github\.com\//i, "").replace(/\/+$/, "");
  if (slug.split("/").length < 2) return null;
  return `https://opengraph.githubassets.com/1/${slug}`;
}

export function WheelCarousel({ items }: WheelCarouselProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const instanceId = useId();
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [failedShots, setFailedShots] = useState<Record<number, boolean>>({});
  const stageRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const dragOriginRef = useRef({ x: 0, y: 0, rotation: 0, axis: "y" as "x" | "y" });
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitRotation = useCallback(
    (nextRotation: number) => {
      rotationRef.current = nextRotation;
      setRotation(nextRotation);
    },
    [],
  );

  const selectIndex = useCallback(
    (index: number) => {
      if (!items.length) return;
      const currentIndex = wrapIndex(Math.round(rotationRef.current), items.length);
      const targetIndex = wrapIndex(index, items.length);
      commitRotation(
        Math.round(rotationRef.current) +
          shortestOffset(targetIndex, currentIndex, items.length),
      );
    },
    [commitRotation, items.length],
  );

  const moveBy = useCallback(
    (amount: number) => {
      if (!items.length) return;
      commitRotation(Math.round(rotationRef.current) + amount);
    },
    [commitRotation, items.length],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !items.length) return;

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      commitRotation(rotationRef.current + event.deltaY * 0.008);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => {
        commitRotation(Math.round(rotationRef.current));
      }, 110);
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, [commitRotation, items.length]);

  useEffect(
    () => () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    },
    [],
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    const axis = event.pointerType === "touch" ? "x" : "y";
    dragOriginRef.current = {
      x: event.clientX,
      y: event.clientY,
      rotation: rotationRef.current,
      axis,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const { x, y, rotation: originRotation, axis } = dragOriginRef.current;
    const distance = axis === "x" ? event.clientX - x : event.clientY - y;
    const dragSpeed = axis === "x" ? 0.018 : 0.02;
    commitRotation(originRotation - distance * dragSpeed);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    commitRotation(Math.round(rotationRef.current));
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      moveBy(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveBy(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      selectIndex(items.length - 1);
    }
  };

  if (!items.length) return null;

  const selectedIndex = wrapIndex(Math.round(rotation), items.length);
  const selectedItem = items[selectedIndex];
  if (!selectedItem) return null;

  const shotSrc = failedShots[selectedItem.id]
    ? null
    : previewUrl(selectedItem.html_url);

  return (
    <div className="wheel-carousel">
      <div className="wheel-carousel-layout">
        <section className="wheel-feature-card" aria-label="Selected repository">
          <div className="wheel-project-art" aria-hidden="true">
            <div className="wheel-art-grid" />
            <div className="wheel-art-orbit wheel-art-orbit-one" />
            <div className="wheel-art-orbit wheel-art-orbit-two" />
            <div className="wheel-art-mark"><Code2 size={32} strokeWidth={1.5} /></div>
            {shotSrc && (
              <AnimatePresence initial={false}>
                <motion.div
                  key={selectedItem.id}
                  className="wheel-art-shot-frame"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="wheel-art-shot"
                    src={shotSrc}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedShots((prev) => ({ ...prev, [selectedItem.id]: true }))
                    }
                  />
                </motion.div>
              </AnimatePresence>
            )}
            <div className="wheel-art-caption">
              <span>GITHUB REPOSITORY</span>
              <strong>{selectedItem.language ?? "OPEN SOURCE"}</strong>
            </div>
            <span className="wheel-art-index">
              {String(selectedIndex + 1).padStart(2, "0")} <span>/</span> {String(items.length).padStart(2, "0")}
            </span>
          </div>

          <div className="wheel-feature-content">
            <div className="wheel-feature-kicker">
              <span className="wheel-live-dot" /> FEATURED PROJECT
              {selectedItem.fork && <span className="wheel-fork-label">FORK</span>}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selectedItem.id}
                className="wheel-selected-details"
                initial={reducedMotion ? false : { opacity: 0, y: 9 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -7 }}
                transition={{ duration: reducedMotion ? 0 : 0.22 }}
              >
                <h3>{selectedItem.name}</h3>
                <p className="wheel-description">
                  {selectedItem.description || "No description provided by this repository."}
                </p>
                <div className="wheel-project-stats">
                  <span className="wheel-language">
                    <span className="language-dot" />
                    {selectedItem.language ?? "Language not specified"}
                  </span>
                  <span><Star size={15} /> {selectedItem.stargazers_count}</span>
                  <span><GitFork size={15} /> {selectedItem.forks_count}</span>
                  <span><CalendarDays size={14} /> {formatDate(selectedItem.updated_at)}</span>
                </div>
                <Magnetic strength={4}>
                  <a
                    className="wheel-repository-link"
                    href={selectedItem.html_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View repository <ArrowUpRight size={16} />
                  </a>
                </Magnetic>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <div className="wheel-navigation">
          <div className="wheel-navigation-heading">
            <div>
              <span className="section-kicker">SELECTED WORK</span>
              <p>Choose a repository</p>
            </div>
            <div className="wheel-controls">
              <button
                type="button"
                aria-label="Previous project"
                onClick={() => moveBy(-1)}
                disabled={items.length < 2}
              >
                <ChevronUp size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next project"
                onClick={() => moveBy(1)}
                disabled={items.length < 2}
              >
                <ChevronDown size={17} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            ref={stageRef}
            className={`wheel-stage${isDragging ? " is-dragging" : ""}`}
            role="listbox"
            aria-label="GitHub repositories"
            aria-activedescendant={`${instanceId}-item-${selectedItem.id}`}
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onKeyDown={handleKeyDown}
          >
            <div className="wheel-arc-rail" aria-hidden="true" />
            {items.map((item, index) => {
              const offset = shortestOffset(index, rotation, items.length);
              if (Math.abs(offset) > 4) return null;
              const angle = (offset * 13 * Math.PI) / 180;
              const x = -300 * (1 - Math.cos(angle));
              const distance = Math.abs(offset);
              const active = index === selectedIndex;

              return (
                <motion.button
                  id={`${instanceId}-item-${item.id}`}
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  tabIndex={-1}
                  className={`wheel-item${active ? " is-active" : ""}`}
                  style={{ top: "50%", left: "49%", translate: "0 -50%" }}
                  animate={{
                    x,
                    y: offset * 50,
                    opacity: Math.max(0.34, 1 - distance * 0.14),
                    scale: Math.max(0.84, 1 - distance * 0.045),
                  }}
                  transition={{
                    duration: reducedMotion || isDragging ? 0 : 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={() => selectIndex(index)}
                >
                  <span className="wheel-item-marker" aria-hidden="true" />
                  <span className="wheel-item-name">{item.name}</span>
                  {active && <span className="wheel-item-current">CURRENT</span>}
                </motion.button>
              );
            })}
          </div>
          <p className="wheel-hint">Drag, scroll, or use arrow keys</p>
        </div>
      </div>

      <details className="wheel-accessible-list">
        <summary>Browse all {items.length} repositories</summary>
        <ol>
          {items.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                aria-current={index === selectedIndex ? "true" : undefined}
                onClick={() => selectIndex(index)}
              >
                {item.name}
              </button>
              <a href={item.html_url} target="_blank" rel="noreferrer">
                View repository
              </a>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
