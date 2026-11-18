import { useEffect } from "react"

/** Fade/slide in every [data-reveal] element as it scrolls into view. */
export function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]")
    if (!("IntersectionObserver" in window)) return
    // Reduced motion: leave everything visible, no transitions.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    )

    document.documentElement.classList.add("reveal-ready")
    targets.forEach((target) => observer.observe(target))

    return () => {
      observer.disconnect()
      document.documentElement.classList.remove("reveal-ready")
    }
  }, [])
}
