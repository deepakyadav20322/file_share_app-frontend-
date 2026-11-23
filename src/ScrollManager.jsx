import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// A new page always starts at the top (instantly, no long scroll animation). When the address has a
// #section, that section is scrolled into view smoothly once the page has rendered.
export default function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) return void requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}
