"use client";

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowUpRight, Code2, ExternalLink, GitFork } from "lucide-react";
import { SiteNav } from "@/components/echo/site-nav";
import { ProjectModal } from "@/components/echo/project-modal";
import { FlexCarousel, type ShowcaseItem } from "@/components/echo/flex-carousel";
import { WheelCarousel } from "@/components/ui/wheel-carousel";
import { Ambient } from "@/components/ui/ambient";
import { Cursor } from "@/components/ui/cursor";
import { Magnetic } from "@/components/ui/magnetic";
import { SectionIndex } from "@/components/ui/section-index";
import type { Repo } from "@/components/echo/types";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
type Repository = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  fork: boolean;
};

type GithubProfile = {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
};

type RepoState = "loading" | "ready" | "empty" | "error";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */
const GITHUB_USER  = "Aankit471";
const GITHUB_URL   = `https://github.com/${GITHUB_USER}`;
const LINKEDIN_URL = "https://www.linkedin.com/in/ankit-kumar-39a105404/";

const TECH_STACK = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Tailwind CSS",
  "Git",
  "Python",
  "Open Source",
];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [repos,      setRepos]      = useState<Repository[]>([]);
  const [profile,    setProfile]    = useState<GithubProfile | null>(null);
  const [repoState,  setRepoState]  = useState<RepoState>("loading");
  const [photoOk,    setPhotoOk]    = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);

  // About scroll state
  const aboutSectionRef   = useRef<HTMLElement>(null);
  const [scrollProg, setScrollProg] = useState(0);

  const reducedMotion = useReducedMotion();

  /* ---- Hero: portrait parallax + pointer tilt ---- */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroPortraitY = useTransform(heroScroll, [0, 1], [0, 64]);
  const tiltY = useSpring(0, { stiffness: 150, damping: 20, mass: 0.6 });
  const tiltX = useSpring(0, { stiffness: 150, damping: 20, mass: 0.6 });

  const handleHeroPointer = (event: ReactPointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    tiltY.set(px * 9);
    tiltX.set(py * -7);
  };

  const resetHeroTilt = () => {
    tiltY.set(0);
    tiltX.set(0);
  };

  /* ---- GitHub data ---- */
  useEffect(() => {
    const ctl = new AbortController();
    async function load() {
      try {
        const [pRes, r1Res] = await Promise.all([
          fetch(`https://api.github.com/users/${GITHUB_USER}`, {
            signal: ctl.signal,
            headers: { Accept: "application/vnd.github+json" },
          }),
          fetch(
            `https://api.github.com/users/${GITHUB_USER}/repos?type=owner&sort=updated&per_page=100&page=1`,
            { signal: ctl.signal, headers: { Accept: "application/vnd.github+json" } },
          ),
        ]);
        if (!r1Res.ok) throw new Error(`GitHub ${r1Res.status}`);
        const p1 = (await r1Res.json()) as Repository[];
        const all = [...p1];
        let pg = 2;
        const more = p1.length === 100;
        while (more) {
          const rn = await fetch(
            `https://api.github.com/users/${GITHUB_USER}/repos?type=owner&sort=updated&per_page=100&page=${pg}`,
            { signal: ctl.signal, headers: { Accept: "application/vnd.github+json" } },
          );
          if (!rn.ok) throw new Error(`GitHub ${rn.status}`);
          const pn = (await rn.json()) as Repository[];
          all.push(...pn);
          if (pn.length < 100) break;
          pg++;
        }
        if (pRes.ok) setProfile((await pRes.json()) as GithubProfile);
        setRepos(all);
        setRepoState(all.length ? "ready" : "empty");
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setRepoState("error");
      }
    }
    void load();
    return () => ctl.abort();
  }, []);

  /* ---- About scroll progress ---- */
  useEffect(() => {
    if (reducedMotion) return;
    const handleScroll = () => {
      const section = aboutSectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const totalScroll = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const prog = Math.max(0, Math.min(1, scrolled / Math.max(1, totalScroll)));
      setScrollProg(prog);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reducedMotion]);

  const languages   = Array.from(new Set(repos.map((r) => r.language).filter(Boolean))) as string[];
  const displayName = profile?.name || profile?.login || "Ankit Kumar";

  // About card sizing: starts 300x400, expands to ~88vw x 84vh
  // Use CSS calc to avoid SSR window access — interpolate between start and end with a CSS variable
  const cardWNum = 300 + scrollProg * 900; // 300 → ~1200px, clamp via CSS max-width
  const cardHNum = 400 + scrollProg * 360; // 400 → ~760px, clamp via CSS max-height
  const cardW = reducedMotion ? "88vw" : `${cardWNum}px`;
  const cardH = reducedMotion ? "84vh" : `${cardHNum}px`;
  const blurOpacity = reducedMotion ? 0 : Math.max(0, 1 - scrollProg * 2.5);
  const contentVisible = reducedMotion || scrollProg > 0.4;
  // "ABOUT" drifts left, "ME" drifts right
  const aboutLeftX  = reducedMotion ? 0 : -scrollProg * 80;
  const aboutRightX = reducedMotion ? 0 :  scrollProg * 80;

  return (
    <>
      {/* ============================================================
          NAV (scrollspy + drawer — ported from ECHO)
      ============================================================ */}
      <Ambient />
      <Cursor />
      <SiteNav />
      <SectionIndex />

      <main>
        {/* ============================================================
            HERO
        ============================================================ */}
        <section
          className="hero-section"
          id="home"
          ref={heroRef}
          onPointerMove={handleHeroPointer}
          onPointerLeave={resetHeroTilt}
        >
          <div className="hero-title-row">
            {["EXPLORE MY", "PORTFOLIO"].map((line, lineIndex) => (
              <span key={line} className="hero-title-line">
                {line.split(" ").map((word, wordIndex) => (
                  <span key={`${word}-${wordIndex}`} className="hero-word">
                    <motion.span
                      className="metallic-title"
                      initial={reducedMotion ? false : { y: "108%" }}
                      animate={{ y: 0 }}
                      transition={{
                        duration: 0.95,
                        delay: 0.08 + (lineIndex * 2 + wordIndex) * 0.075,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </span>
            ))}
          </div>

          <motion.div
            className="hero-grid"
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
          >
            {/* Left col */}
            <div className="hero-left">
              <p className="hero-note">
                B.Tech CSE student at Echelon Institute of Technology, Faridabad.
                Building real things with real code.
              </p>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <Magnetic strength={5}>
                  <a className="circle-btn" href="#projects" aria-label="View projects">
                    <ArrowUpRight size={20} />
                  </a>
                </Magnetic>
                <a className="pill-btn" href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                  LinkedIn <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Center — portrait */}
            <div className="hero-portrait-wrap">
              <motion.div
                className="hero-portrait-tilt"
                style={{
                  rotateX: reducedMotion ? 0 : tiltX,
                  rotateY: reducedMotion ? 0 : tiltY,
                  y: reducedMotion ? 0 : heroPortraitY,
                }}
              >
                <div className="hero-portrait-frame hero-portrait-mask">
                  {photoOk ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/ankit.jpeg"
                      alt="Ankit Kumar"
                      onError={() => setPhotoOk(false)}
                    />
                  ) : (
                    <div className="hero-portrait-frame-placeholder">A</div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right col */}
            <div className="hero-right">
              <div className="hero-disciplines-label">Disciplines</div>
              <ul className="hero-disciplines-list">
                <li>Frontend Development</li>
                <li>Backend Development</li>
                <li>Open Source</li>
                <li>TypeScript / React</li>
              </ul>
            </div>
          </motion.div>

          <div className="hero-marquee" aria-hidden="true">
            <div className="hero-marquee-track">
              {[0, 1].map((copy) => (
                <div className="hero-marquee-group" key={copy}>
                  {TECH_STACK.map((tech) => (
                    <span key={`${copy}-${tech}`}>
                      {tech}
                      <i>·</i>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="hero-scroll-line">
            <span>Scroll to explore</span>
          </div>
        </section>

        {/* ============================================================
            ABOUT (dark scroll-expand card)
        ============================================================ */}
        <section
          className="about-section"
          id="about"
          ref={aboutSectionRef}
        >
          <div className="about-sticky">
            {/* Split title letters */}
            <div className="about-titles-wrap" aria-hidden="true">
              <span
                className="about-title-left"
                style={{ transform: `translateX(${aboutLeftX}px)` }}
              >
                ABOUT
              </span>
              <span
                className="about-title-right"
                style={{ transform: `translateX(${aboutRightX}px)` }}
              >
                ME
              </span>
            </div>

            {/* Expanding card */}
            <div
              className="about-card"
              style={{
                width:  reducedMotion ? "88vw" : cardW,
                height: reducedMotion ? "84vh" : cardH,
                maxWidth: "88vw",
                maxHeight: "84vh",
                minWidth: "280px",
                minHeight: "340px",
              }}
            >
              {/* Background image */}
              {photoOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="about-card-img"
                  src="/ankit.jpeg"
                  alt=""
                  aria-hidden="true"
                  onError={() => setPhotoOk(false)}
                />
              ) : (
                <div className="about-card-img-placeholder" aria-hidden="true">A</div>
              )}

              {/* Blur layer that fades out */}
              <div
                className="about-card-blur"
                style={{ opacity: blurOpacity }}
              />

              {/* Content */}
              <div className={`about-card-content${contentVisible ? " visible" : ""}`}>
                <div className="about-kicker">About Me</div>
                <h2 className="about-content-headline">
                  Building real things.<br />
                  One commit at a time.
                </h2>
                <p className="about-content-body">
                  I&apos;m a 3rd-year B.Tech Computer Science student at Echelon Institute
                  of Technology, Faridabad (2022–2026). The projects you see below are pulled
                  live from my public GitHub — no hand-picked filler. I enjoy turning ideas
                  into working software.
                </p>
                {profile?.bio && (
                  <p className="about-content-body" style={{ fontStyle:"italic", opacity:0.6 }}>
                    &ldquo;{profile.bio}&rdquo;
                  </p>
                )}
                <div className="about-content-edu">
                  <div className="about-content-edu-school">Echelon Institute of Technology</div>
                  <div className="about-content-edu-detail">B.Tech CSE · 3rd Year · 2022–2026 · Faridabad</div>
                </div>
                <div className="about-content-links">
                  <a className="about-link-pill" href={GITHUB_URL} target="_blank" rel="noreferrer">
                    <GitFork size={13} /> @{GITHUB_USER}
                  </a>
                  <a className="about-link-pill" href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                    <ExternalLink size={13} /> LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SKILLS (dark, animated grid)
        ============================================================ */}
        <section className="skills-section" id="skills">
          <div className="skills-inner">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55 }}
            >
              <div className="section-kicker">Technical Skills</div>
              <h2 className="skills-headline">
                LANGUAGES<br />IN THE MIX.
              </h2>
              <p className="skills-sub">
                Automatically gathered from public repositories — no hand-picked filler.
              </p>
            </motion.div>

            {languages.length > 0 ? (
              <div className="skills-animated-grid">
                {languages.map((lang, i) => (
                  <motion.div
                    key={lang}
                    className="skill-cell"
                    initial={reducedMotion ? false : { opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.3, delay: reducedMotion ? 0 : i * 0.035 }}
                  >
                    <span className="skill-cell-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="skill-cell-name">{lang}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="skills-empty">
                {repoState === "loading"
                  ? "Loading languages from GitHub…"
                  : "Language data will appear once repositories load."}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            PROJECTS (light, wheel carousel)
        ============================================================ */}
        <section className="projects-section" id="projects">
          <div className="projects-inner">
            <div className="projects-header">
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5 }}
              >
                <div className="projects-kicker">Selected Work</div>
                <h2 className="projects-headline">
                  FEATURED<br />PROJECTS.
                </h2>
                <p className="projects-sub">
                  Every public repository, sorted by most recently updated.
                </p>
              </motion.div>
              <a className="projects-all-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
                All on GitHub <ArrowUpRight size={13} />
              </a>
            </div>

            <AnimatePresence mode="wait">
              {repoState === "loading" && (
                <motion.div key="loading" className="repo-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <span className="loading-ring" />
                  <div>
                    <strong>Fetching repositories</strong>
                    <span>Connecting to the GitHub REST API…</span>
                  </div>
                </motion.div>
              )}
              {repoState === "error" && (
                <motion.div key="error" className="repo-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Code2 size={22} />
                  <div>
                    <strong>Couldn&apos;t load repositories</strong>
                    <span>GitHub may be rate-limiting this request. Refresh in a moment.</span>
                  </div>
                </motion.div>
              )}
              {repoState === "empty" && (
                <motion.div key="empty" className="repo-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Code2 size={22} />
                  <div>
                    <strong>No public repositories found</strong>
                    <span>No public repositories are available on this profile yet.</span>
                  </div>
                </motion.div>
              )}
              {repoState === "ready" && (
                <motion.div
                  key="ready"
                  initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.42 }}
                >
                  <WheelCarousel items={repos} />
                </motion.div>
              )}
            </AnimatePresence>

            {repoState === "ready" && (
              <p className="repo-count">
                {repos.length} public {repos.length === 1 ? "repository" : "repositories"}
                <span>·</span> live from GitHub
              </p>
            )}
          </div>
        </section>

        {/* ============================================================
            SHOWCASE (WebGL liquid carousel — ported from ECHO)
        ============================================================ */}
        <section className="showcase-section" id="showcase">
          <div className="showcase-inner">
            <div className="showcase-header">
              <div>
                <div className="showcase-kicker">Live Previews</div>
                <h2 className="showcase-headline">
                  REPOS IN<br />MOTION.
                </h2>
              </div>
              <p className="showcase-sub">
                Drag the reel, or click a card to open its repository. Every preview is
                generated live from GitHub.
              </p>
            </div>

            {repos.length > 0 ? (
              <div className="showcase-frame">
                <FlexCarousel
                  items={repos.map(
                    (repo): ShowcaseItem => ({
                      src: `https://opengraph.githubassets.com/1/${repo.full_name}`,
                      alt: `${repo.name} preview`,
                      title: repo.name,
                      subtitle: repo.language ?? "Open source",
                      description: repo.description ?? "No description provided by this repository.",
                      link: repo.html_url,
                    }),
                  )}
                  onSelect={(item) => {
                    const match = repos.find((repo) => repo.html_url === item.link);
                    if (match) setSelectedRepo(match);
                  }}
                />
              </div>
            ) : (
              <div className="showcase-empty">Preview reel unlocks once repositories load.</div>
            )}
          </div>
        </section>

        {/* ============================================================
            FOOTER / CONTACT
        ============================================================ */}
        <footer className="site-footer" id="contact">
          <div className="footer-inner">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65 }}
            >
              <div className="footer-big-title">
                <span className="footer-metallic">LET&apos;S</span>
                <br />
                <span className="footer-metallic">TALK</span>
                <span style={{ color:"rgba(255,255,255,0.25)" }}>.</span>
              </div>
            </motion.div>

            <div className="footer-links-row">
              <a className="footer-pill" href={LINKEDIN_URL} target="_blank" rel="noreferrer">LinkedIn</a>
              <a className="footer-pill" href={GITHUB_URL}   target="_blank" rel="noreferrer">GitHub</a>
            </div>

            <div className="footer-bottom">
              <span>ANKIT KUMAR · B.TECH CSE · ECHELON INSTITUTE OF TECHNOLOGY</span>
              <span>© 2026 — ALL RIGHTS RESERVED</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Glassmorphic project inspection modal (ECHO) */}
      <ProjectModal repo={selectedRepo} onClose={() => setSelectedRepo(null)} />
    </>
  );
}
