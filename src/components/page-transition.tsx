"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MOTION_TARGETS = [
  ".home-hero .hero-copy",
  ".home-hero .hero-aside",
  ".home-hero .hero-bottomline",
  "main > section:not(.home-hero)",
  ".inner-hero > .container",
  ".section-heading-row > *",
  ".intro-layout > *",
  ".services-layout > *",
  ".ecosystem-layout > *",
  ".division-tile",
  ".info-card",
  ".principle-grid article",
  ".capability-list article",
  ".ecosystem-links a",
  ".text-rows article",
  ".application-panel",
  ".contact-grid > *",
  ".contact-banner-content",
  ".footer-grid > div",
  ".admin-heading",
  ".admin-stats article",
  ".admin-list",
  ".admin-detail",
  ".admin-submission",
  ".audit-event",
  ".admin-auth-card",
  ".admin-communication-view > *",
];

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    prevPath.current = pathname;
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let observer: IntersectionObserver | null = null;
    const observed = new WeakSet<Element>();

    const observeTargets = () => {
      if (!observer) return;
      document.querySelectorAll(MOTION_TARGETS.join(",")).forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.classList.add("motion-reveal");
        observer?.observe(element);
      });
    };

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.classList.add("motion-visible");
          observer?.unobserve(element);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );

    observeTargets();
    const mutationObserver = new MutationObserver(observeTargets);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer?.disconnect();
    };
  }, [pathname]);

  return (
    <div
      className="page-transition-wrapper"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
      }}
    >
      {children}
    </div>
  );
}
