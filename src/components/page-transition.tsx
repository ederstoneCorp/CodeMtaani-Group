"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      // Scroll to top on navigation
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      // Quick fade-in
      setVisible(false);
      const timer = requestAnimationFrame(() => {
        setVisible(true);
      });
      prevPath.current = pathname;
      return () => cancelAnimationFrame(timer);
    }
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
