"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

/**
 * Horizontal scroll-snap carousel. Renders 3 / 2 / 1 slides per view across
 * desktop / tablet / mobile, with arrow controls that disable at the ends.
 * Children are server-rendered cards passed down from the page.
 */
export function Carousel({
  children,
  label = "Featured products",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const slides = Children.toArray(children);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const firstSlide = el.querySelector<HTMLElement>("[data-slide]");
    const step = firstSlide ? firstSlide.offsetWidth + 16 : el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="relative" role="group" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            data-slide
            className="w-[78%] shrink-0 snap-start sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]"
          >
            {slide}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <CarouselButton dir="prev" onClick={() => scrollBy(-1)} disabled={atStart} />
        <CarouselButton dir="next" onClick={() => scrollBy(1)} disabled={atEnd} />
      </div>
    </div>
  );
}

function CarouselButton({
  dir,
  onClick,
  disabled,
}: {
  dir: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = dir === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous" : "Next"}
      className={cn(
        "grid h-11 w-11 place-items-center border border-ink-12 bg-white text-navy-800 transition-colors",
        "hover:bg-navy-800 hover:text-white disabled:pointer-events-none disabled:text-ink-30",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
