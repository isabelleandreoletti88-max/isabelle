import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useSiteSettings } from '@/lib/siteData';
import { isPrerender } from '@/components/motion';

/**
 * Mode fête : animation décorative au-dessus des pages (neige, cœurs, feuilles, Noël),
 * réglée dans Admin → Paramètres → Mode fête.
 *
 * - Dessinée dans un canvas : aucun clic n'est bloqué (pointer-events: none).
 * - Moins de particules sur téléphone ; pause quand l'onglet est caché.
 * - Désactivée pour les personnes qui ont demandé moins d'animations, et pendant la pré-génération.
 */
export type FestiveEffect = 'snow' | 'hearts' | 'autumn' | 'christmas';
export type FestiveSetting = 'none' | 'auto' | FestiveEffect;
export type FestiveDensity = 'light' | 'normal' | 'strong';

export const festiveLabels: Record<FestiveSetting, string> = {
  none: 'Désactivé',
  auto: 'Automatique selon la saison',
  snow: 'Neige qui tombe',
  hearts: 'Petits cœurs (Saint-Valentin)',
  autumn: 'Feuilles d’automne',
  christmas: 'Noël (flocons et étoiles dorées)',
};

/** Calendrier du mode automatique. */
export function effectForDate(date = new Date()): FestiveEffect | null {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if ((m === 12) || (m === 1 && d <= 6)) return 'christmas';
  if (m === 1) return 'snow';
  if (m === 2 && d <= 15) return 'hearts';
  if ((m === 9 && d >= 22) || m === 10 || m === 11) return 'autumn';
  return null;
}

export function resolveEffect(setting: string): FestiveEffect | null {
  if (setting === 'auto') return effectForDate();
  return ['snow', 'hearts', 'autumn', 'christmas'].includes(setting) ? (setting as FestiveEffect) : null;
}

type Particle = { x: number; y: number; r: number; vy: number; vx: number; phase: number; spin: number; angle: number; kind: number; color: string; alpha: number };

const PALETTES: Record<FestiveEffect, string[]> = {
  snow: ['#FFFFFF'],
  hearts: ['#C95F3A', '#E07D52', '#E8A3A0', '#D9787A'],
  autumn: ['#B5651D', '#D88820', '#C95F3A', '#8A3318', '#E8A53A'],
  christmas: ['#FFFFFF', '#FDF8F0', '#E8A53A', '#D88820'],
};

const COUNTS: Record<FestiveDensity, number> = { light: 22, normal: 40, strong: 70 };

function heart(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, r * 0.35);
  ctx.bezierCurveTo(r * 1.1, -r * 0.45, r * 0.45, -r * 1.15, 0, -r * 0.45);
  ctx.bezierCurveTo(-r * 0.45, -r * 1.15, -r * 1.1, -r * 0.45, 0, r * 0.35);
  ctx.closePath();
  ctx.fill();
}

function leaf(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.9, -r * 0.2, 0, r);
  ctx.quadraticCurveTo(-r * 0.9, -r * 0.2, 0, -r);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha *= 0.55;
  ctx.strokeStyle = '#6B4A2E';
  ctx.lineWidth = Math.max(0.6, r * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.lineTo(0, r * 1.25);
  ctx.stroke();
}

function flake(ctx: CanvasRenderingContext2D, r: number) {
  ctx.lineWidth = Math.max(0.8, r * 0.18);
  ctx.lineCap = 'round';
  ctx.strokeStyle = ctx.fillStyle as string;
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -r);
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(r * 0.28, -r * 0.8);
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(-r * 0.28, -r * 0.8);
    ctx.stroke();
  }
}

function star(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * 0.42 : r;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

function makeParticle(effect: FestiveEffect, w: number, h: number, initial: boolean): Particle {
  const p = makeRaw(effect, w, h, initial);
  if (effect === 'christmas') p.kind = p.color === '#D88820' ? 2 : 1;
  return p;
}

function makeRaw(effect: FestiveEffect, w: number, h: number, initial: boolean): Particle {
  const palette = PALETTES[effect];
  const rising = effect === 'hearts';
  const base = { snow: 4, hearts: 7, autumn: 9, christmas: 4.5 }[effect];
  const r = base * (0.55 + Math.random() * 0.9);
  return {
    x: Math.random() * w,
    y: initial ? Math.random() * h : rising ? h + r * 2 : -r * 2,
    r,
    vy: (rising ? -1 : 1) * (effect === 'autumn' ? 0.55 + Math.random() * 0.7 : effect === 'hearts' ? 0.35 + Math.random() * 0.45 : 0.4 + Math.random() * 0.8),
    vx: (Math.random() - 0.5) * 0.3,
    phase: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * (effect === 'autumn' ? 0.04 : 0.012),
    angle: Math.random() * Math.PI * 2,
    // Noël : environ une étoile dorée pour cinq flocons ; neige : quelques vrais flocons parmi les points.
    kind: effect === 'snow' ? (Math.random() < 0.25 ? 1 : 0) : 0,
    color: effect === 'christmas' ? (Math.random() < 0.2 ? '#D88820' : '#FFFFFF') : palette[Math.floor(Math.random() * palette.length)],
    alpha: effect === 'hearts' ? 0.55 + Math.random() * 0.35 : 0.65 + Math.random() * 0.35,
  };
}

/** Animation dans un conteneur : la page entière (fixed) ou un aperçu (absolute). */
export function FestiveCanvas({ effect, density = 'normal', contained = false }: { effect: FestiveEffect; density?: FestiveDensity; contained?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = 0, height = 0, frame = 0, last = performance.now();
    let particles: Particle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const box = contained ? canvas!.parentElement!.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      width = box.width; height = box.height;
      canvas!.width = Math.round(width * dpr); canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`; canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mobile = width < 640;
      const count = Math.round(COUNTS[density] * (contained ? 0.6 : mobile ? 0.5 : 1) * (effect === 'autumn' ? 0.7 : 1));
      particles = Array.from({ length: count }, () => makeParticle(effect, width, height, true));
    }

    function draw(now: number) {
      const dt = Math.min(48, now - last) / 16.7;
      last = now;
      ctx!.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += 0.012 * dt;
        p.angle += p.spin * dt;
        p.y += p.vy * dt;
        p.x += (p.vx + Math.sin(p.phase) * (effect === 'autumn' ? 0.9 : 0.35)) * dt;
        const out = p.vy > 0 ? p.y > height + p.r * 3 : p.y < -p.r * 3;
        if (out || p.x < -40 || p.x > width + 40) { particles[i] = makeParticle(effect, width, height, false); continue; }
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.globalAlpha = p.alpha;
        ctx!.fillStyle = p.color;
        if (effect === 'snow' || effect === 'christmas') {
          if (effect === 'snow' && p.kind === 0) { ctx!.shadowColor = 'rgba(70,45,25,0.55)'; ctx!.shadowBlur = 4; ctx!.beginPath(); ctx!.arc(0, 0, p.r * 0.75, 0, Math.PI * 2); ctx!.fill(); }
          else if (p.kind === 2) { ctx!.rotate(p.angle); ctx!.shadowColor = 'rgba(216,136,32,0.6)'; ctx!.shadowBlur = 6; star(ctx!, p.r * 1.3); }
          else { ctx!.rotate(p.angle); ctx!.shadowColor = 'rgba(70,45,25,0.6)'; ctx!.shadowBlur = 3; flake(ctx!, p.r * 1.7); }
        } else if (effect === 'hearts') {
          ctx!.rotate(Math.sin(p.phase) * 0.35);
          heart(ctx!, p.r);
        } else {
          ctx!.rotate(p.angle);
          ctx!.scale(1, 0.75 + Math.abs(Math.sin(p.phase * 2)) * 0.25);
          leaf(ctx!, p.r);
        }
        ctx!.restore();
      }
      frame = requestAnimationFrame(draw);
    }

    function onVisibility() {
      cancelAnimationFrame(frame);
      if (!document.hidden) { last = performance.now(); frame = requestAnimationFrame(draw); }
    }

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVisibility); };
  }, [effect, density, contained]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none ${contained ? 'absolute inset-0' : 'fixed inset-0 z-[45]'}`} />;
}

/** Couche du site : lit les réglages et n'affiche l'animation que là où elle est demandée. */
export default function FestiveLayer() {
  const settings = useSiteSettings();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const effect = resolveEffect(settings.festive_effect);
  if (!effect || reduce || isPrerender) return null;
  if (settings.festive_scope !== 'all' && pathname !== '/') return null;
  if (pathname.startsWith('/admin') || pathname.startsWith('/panier') || pathname.startsWith('/commande')) return null;
  return <FestiveCanvas effect={effect} density={(settings.festive_density as FestiveDensity) || 'normal'} />;
}
