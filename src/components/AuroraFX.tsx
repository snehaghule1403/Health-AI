import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * App-wide visual effects: animated aurora blobs, a cursor spotlight,
 * scroll-reveal for [data-reveal] elements and 3D tilt for [data-tilt] elements.
 * Everything is CSS-driven and switches off under prefers-reduced-motion.
 */
export default function AuroraFX() {
  const location = useLocation();

  // Cursor spotlight + tilt (pointer devices only)
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty('--mx', `${e.clientX}px`);
        root.style.setProperty('--my', `${e.clientY}px`);
        const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-tilt], .stat-card, .card');
        if (el) {
          const r = el.getBoundingClientRect();
          el.style.setProperty('--px', `${((e.clientX - r.left) / r.width) * 100}%`);
          el.style.setProperty('--py', `${((e.clientY - r.top) / r.height) * 100}%`);
          if (el.hasAttribute('data-tilt')) {
            const rx = ((e.clientY - r.top) / r.height - 0.5) * -3;
            const ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
            el.style.setProperty('--rx', `${rx}deg`);
            el.style.setProperty('--ry', `${ry}deg`);
          }
        }
      });
    };
    const onOut = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-tilt]');
      if (el && !el.contains(e.relatedTarget as Node)) {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerout', onOut, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerout', onOut);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Scroll reveal — re-scan on every route change and DOM mutation
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    const scan = () => document.querySelectorAll('[data-reveal]:not(.in)').forEach(el => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [location.pathname]);

  return (
    <div className="aurora" aria-hidden="true">
      <span className="aurora-blob b1" />
      <span className="aurora-blob b2" />
      <span className="aurora-blob b3" />
      <span className="aurora-blob b4" />
      <span className="aurora-grid" />
      <span className="aurora-noise" />
      <span className="cursor-glow" />
    </div>
  );
}
