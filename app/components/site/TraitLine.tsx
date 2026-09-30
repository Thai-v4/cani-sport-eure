"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Tendue (flèche nulle) ou au repos (légère courbe, comme une ligne élastique détendue) */
  tense?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
};

const REST_SAG = 9;
const STIFFNESS = 0.14;
const DAMPING = 0.72;

// Ligne de trait : la ligne élastique qui relie le coureur à son chien.
// Seul élément animé du site : elle se dessine une fois, puis se tend au survol
// de l'action qu'elle relie et revient avec un léger rebond.
export default function TraitLine({ tense = false, orientation = "horizontal", className = "" }: Props) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [drawn, setDrawn] = useState(false);
  const sag = useRef(REST_SAG);
  const velocity = useRef(0);
  const frame = useRef<number | null>(null);
  const reduced = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(reduced.current);
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(box);
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const horizontal = orientation === "horizontal";
  const length = horizontal ? size.w : size.h;
  const mid = horizontal ? size.h / 2 : size.w / 2;

  const pathFor = (s: number) =>
    horizontal
      ? `M 0 ${mid} Q ${length / 2} ${mid + s} ${length - 5} ${mid}`
      : `M ${mid} 0 Q ${mid + s} ${length / 2} ${mid} ${length - 5}`;

  // Ressort amorti vers la flèche cible
  useEffect(() => {
    const target = tense ? 0 : REST_SAG;
    if (reduced.current || !pathRef.current) {
      sag.current = target;
      pathRef.current?.setAttribute("d", pathFor(target));
      return;
    }
    const step = () => {
      const force = (target - sag.current) * STIFFNESS;
      velocity.current = (velocity.current + force) * DAMPING;
      sag.current += velocity.current;
      pathRef.current?.setAttribute("d", pathFor(sag.current));
      if (Math.abs(target - sag.current) > 0.05 || Math.abs(velocity.current) > 0.05) {
        frame.current = requestAnimationFrame(step);
      }
    };
    if (frame.current) cancelAnimationFrame(frame.current);
    // Le coup de tension part avec un peu d'élan, comme une ligne qu'on tire
    velocity.current += tense ? -3 : 1.5;
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // pathFor dépend de la taille ; on relance quand elle change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tense, length, mid]);

  const endX = horizontal ? length - 3 : mid;
  const endY = horizontal ? mid : length - 3;

  return (
    <span
      ref={boxRef}
      aria-hidden
      className={`pointer-events-none block ${horizontal ? "h-6 w-full" : "w-6"} ${className}`}
    >
      {length > 0 && (
        <svg width={size.w} height={size.h} className="overflow-visible">
          <path
            ref={pathRef}
            d={pathFor(REST_SAG)}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={2}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={drawn || reducedMotion ? 0 : 1}
            style={{ transition: "stroke-dashoffset 900ms var(--ease-out-expo)" }}
          />
          {/* Mousqueton au bout de la ligne */}
          <circle
            cx={endX}
            cy={endY}
            r={3.5}
            fill="var(--color-paper)"
            stroke="var(--color-line)"
            strokeWidth={2}
            style={{ opacity: drawn ? 1 : 0, transition: "opacity 300ms 700ms" }}
          />
        </svg>
      )}
    </span>
  );
}
