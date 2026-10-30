"use client";

import { useEffect, useRef } from "react";

export type ShowcaseItem = {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  description: string;
  link: string;
};

type EngineOptions = {
  items: ShowcaseItem[];
  preset?: string;
  intro?: string;
  cardHeight?: number;
  gap?: number;
  squeeze?: number;
  focusOnClick?: boolean;
  captions?: boolean;
  onSelect?: (index: number, item: ShowcaseItem) => void;
};

type EngineInstance = { destroy: () => void };

type EngineModule = {
  initFlexCarousel: (
    container: HTMLElement,
    options: EngineOptions,
  ) => EngineInstance | undefined;
};

type FlexCarouselProps = {
  items: ShowcaseItem[];
  onSelect?: (item: ShowcaseItem) => void;
};

/**
 * Mounts ECHO's WebGL liquid carousel (OGL) into React.
 * The engine is a vendored vanilla module — it owns its DOM subtree.
 */
export function FlexCarousel({ items, onSelect }: FlexCarouselProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Re-initialise only when the actual cards change, not on every render.
  const itemsKey = items.map((item) => item.title).join("|");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let engine: EngineInstance | undefined;
    let cancelled = false;

    void (async () => {
      try {
        const mod = (await import("./vendor/flex-carousel")) as unknown as EngineModule;
        if (cancelled) return;
        engine = mod.initFlexCarousel(host, {
          items,
          preset: "liquid",
          intro: "rise",
          cardHeight: 0.5,
          gap: 12,
          squeeze: 0.2,
          focusOnClick: true,
          captions: true,
          onSelect: (_index, item) => onSelectRef.current?.(item),
        });
      } catch (error) {
        // Without WebGL the section simply stays empty rather than crashing the page.
        console.warn("[showcase] WebGL carousel unavailable:", error);
      }
    })();

    return () => {
      cancelled = true;
      engine?.destroy();
      host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itemsKey is the stable identity of `items`
  }, [itemsKey]);

  return <div ref={hostRef} className="showcase-host" />;
}
