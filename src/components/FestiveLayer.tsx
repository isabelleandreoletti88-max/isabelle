import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useSiteSettings } from '@/lib/siteData';
import { isPrerender } from '@/components/motion';

/**
 * Mode fête : animation décorative au-dessus des pages, réglée dans Admin → Paramètres → Mode fête.
 *
 * - Dessinée dans un canvas : aucun clic n'est bloqué (pointer-events: none).
 * - Moins de particules sur téléphone ; pause quand l'onglet est caché.
 * - Désactivée pour les personnes qui ont demandé moins d'animations, et pendant la pré-génération.
 */
export const FESTIVE_EFFECTS = ['snow', 'christmas', 'newyear', 'hearts', 'spring', 'easter', 'mothers', 'summer', 'autumn', 'halloween', 'confetti'] as const;
export type FestiveEffect = (typeof FESTIVE_EFFECTS)[number];
export type FestiveSetting = 'none' | 'auto' | FestiveEffect;
export type FestiveDensity = 'light' | 'normal' | 'strong';

export const festiveLabels: Record<FestiveSetting, string> = {
  none: 'Désactivé',
  auto: 'Automatique selon le calendrier',
  snow: 'Neige qui tombe',
  christmas: 'Noël (flocons et étoiles dorées)',
  newyear: 'Nouvel An (confettis dorés)',
  hearts: 'Petits cœurs (Saint-Valentin)',
  spring: 'Printemps (pétales de fleurs)',
  easter: 'Pâques (petits œufs colorés)',
  mothers: 'Fête des mères (fleurs et cœurs)',
  summer: 'Été (papillons)',
  autumn: 'Feuilles d’automne',
  halloween: 'Halloween (petites citrouilles)',
  confetti: 'Fête ou anniversaire (confettis)',
};

// --- Calendrier du mode automatique -----------------------------------------------------------

/** Dimanche de Pâques (calendrier grégorien, algorithme de Meeus). */
function easterSunday(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Fête des mères en France : dernier dimanche de mai, ou premier dimanche de juin s'il tombe à la Pentecôte. */
function mothersDay(year: number) {
  const lastSunday = new Date(year, 4, 31);
  lastSunday.setDate(31 - lastSunday.getDay());
  const pentecost = easterSunday(year);
  pentecost.setDate(pentecost.getDate() + 49);
  if (lastSunday.getTime() === pentecost.getTime()) lastSunday.setDate(lastSunday.getDate() + 7);
  return lastSunday;
}

const dayDiff = (a: Date, b: Date) => Math.round((new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() - new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) / 86400000);

export function effectForDate(date = new Date()): FestiveEffect | null {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const toEaster = dayDiff(date, easterSunday(date.getFullYear()));
  const toMothers = dayDiff(date, mothersDay(date.getFullYear()));
  if ((m === 12 && d === 31) || (m === 1 && d <= 2)) return 'newyear';
  if (m === 12) return 'christmas';
  if (m === 1) return 'snow';
  if (m === 2 && d <= 15) return 'hearts';
  if (toEaster >= -10 && toEaster <= 1) return 'easter';
  if (toMothers >= -7 && toMothers <= 0) return 'mothers';
  if ((m === 3 && d >= 20) || m === 4 || m === 5) return 'spring';
  if ((m === 6 && d >= 21) || m === 7 || m === 8) return 'summer';
  if (m === 10 && d >= 25) return 'halloween';
  if ((m === 9 && d >= 22) || m === 10 || m === 11) return 'autumn';
  return null;
}

export const FESTIVE_CALENDAR = 'Noël en décembre, Nouvel An du 31 décembre au 2 janvier, neige en janvier, cœurs du 1er au 15 février, Pâques les 10 jours avant le lundi de Pâques, printemps du 20 mars à fin mai, fête des mères la semaine qui la précède, été du 21 juin à fin août, feuilles du 22 septembre à fin novembre, Halloween du 25 au 31 octobre ; rien le reste du temps.';

export function resolveEffect(setting: string): FestiveEffect | null {
  if (setting === 'auto') return effectForDate();
  return (FESTIVE_EFFECTS as readonly string[]).includes(setting) ? (setting as FestiveEffect) : null;
}

// --- Dessins ---------------------------------------------------------------------------------

type Shape = 'dot' | 'flake' | 'star' | 'heart' | 'leaf' | 'petal' | 'flower' | 'egg' | 'butterfly' | 'pumpkin' | 'confetti';
type Particle = { x: number; y: number; r: number; vy: number; vx: number; phase: number; spin: number; angle: number; shape: Shape; color: string; alpha: number };

/** Pour chaque ambiance : formes (avec leur proportion), couleurs, taille, vitesse, sens. */
type Config = { shapes: [Shape, number][]; colors: string[]; size: number; speed: [number, number]; rising?: boolean; sway: number; spin: number; count?: number; colorFor?: Partial<Record<Shape, string[]>> };

const CONFIG: Record<FestiveEffect, Config> = {
  snow: { shapes: [['dot', 0.75], ['flake', 0.25]], colors: ['#FFFFFF'], size: 4, speed: [0.4, 1.2], sway: 0.35, spin: 0.012 },
  christmas: { shapes: [['flake', 0.8], ['star', 0.2]], colors: ['#FFFFFF'], colorFor: { star: ['#D88820', '#E8A53A'] }, size: 4.5, speed: [0.4, 1.1], sway: 0.35, spin: 0.012 },
  newyear: { shapes: [['confetti', 0.8], ['star', 0.2]], colors: ['#D88820', '#E8A53A', '#F2E0C4', '#C9A27A', '#FFFFFF'], size: 7, speed: [0.7, 1.5], sway: 0.6, spin: 0.08, count: 1.2 },
  hearts: { shapes: [['heart', 1]], colors: ['#C95F3A', '#E07D52', '#E8A3A0', '#D9787A'], size: 7, speed: [0.35, 0.8], rising: true, sway: 0.35, spin: 0 },
  spring: { shapes: [['petal', 0.8], ['flower', 0.2]], colors: ['#F4C6CF', '#F9DDE2', '#FFFFFF', '#EBB4C0'], colorFor: { flower: ['#F4C6CF', '#FFFFFF', '#E8A53A'] }, size: 6, speed: [0.45, 1], sway: 0.8, spin: 0.03 },
  easter: { shapes: [['egg', 0.75], ['flower', 0.25]], colors: ['#F4C6CF', '#BFD8E8', '#F7E3A1', '#C9E2B8', '#E3D0F0'], colorFor: { flower: ['#F7E3A1', '#FFFFFF'] }, size: 7, speed: [0.4, 0.9], sway: 0.45, spin: 0.015, count: 0.7 },
  mothers: { shapes: [['flower', 0.55], ['heart', 0.45]], colors: ['#E8A3A0', '#C95F3A', '#F4C6CF', '#FFFFFF'], size: 7, speed: [0.35, 0.8], rising: true, sway: 0.4, spin: 0.01, count: 0.8 },
  summer: { shapes: [['butterfly', 1]], colors: ['#E8A53A', '#C95F3A', '#7E9462', '#BFD8E8', '#D88820'], size: 11, speed: [0.25, 0.6], rising: true, sway: 1.2, spin: 0, count: 0.45 },
  autumn: { shapes: [['leaf', 1]], colors: ['#B5651D', '#D88820', '#C95F3A', '#8A3318', '#E8A53A'], size: 9, speed: [0.55, 1.25], sway: 0.9, spin: 0.04, count: 0.7 },
  halloween: { shapes: [['pumpkin', 0.5], ['leaf', 0.5]], colors: ['#D88820', '#B5651D', '#8A3318'], colorFor: { pumpkin: ['#E07D2A', '#D88820'] }, size: 8, speed: [0.5, 1.1], sway: 0.7, spin: 0.03, count: 0.7 },
  confetti: { shapes: [['confetti', 1]], colors: ['#C95F3A', '#E8A53A', '#7E9462', '#BFD8E8', '#E8A3A0', '#F7E3A1'], size: 7, speed: [0.8, 1.6], sway: 0.6, spin: 0.09, count: 1.2 },
};

const COUNTS: Record<FestiveDensity, number> = { light: 22, normal: 40, strong: 70 };
const SHADOW_LIGHT = 'rgba(70,45,25,0.55)';

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
    ctx.moveTo(0, 0); ctx.lineTo(0, -r);
    ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.28, -r * 0.8);
    ctx.moveTo(0, -r * 0.55); ctx.lineTo(-r * 0.28, -r * 0.8);
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

function petal(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r * 0.9, -r * 0.6, r * 0.6, r * 0.8, 0, r * 0.6);
  ctx.bezierCurveTo(-r * 0.6, r * 0.8, -r * 0.9, -r * 0.6, 0, -r);
  ctx.closePath();
  ctx.fill();
}

function flower(ctx: CanvasRenderingContext2D, r: number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    ctx.rotate((Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.36, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = color === '#E8A53A' ? '#FFFFFF' : '#E8A53A';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

function egg(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r * 0.75, -r, r * 0.8, r * 0.8, 0, r * 0.8);
  ctx.bezierCurveTo(-r * 0.8, r * 0.8, -r * 0.75, -r, 0, -r);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.globalAlpha *= 0.7;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-r, -r * 0.05, r * 2, r * 0.22);
  ctx.restore();
}

function butterfly(ctx: CanvasRenderingContext2D, r: number, flap: number) {
  ctx.save();
  ctx.scale(0.35 + Math.abs(flap) * 0.65, 1);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * r * 0.55, -r * 0.3, r * 0.6, r * 0.45, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(side * r * 0.42, r * 0.35, r * 0.4, r * 0.3, -side * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#4A3424';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.1, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
}

function pumpkin(ctx: CanvasRenderingContext2D, r: number) {
  for (const [dx, w] of [[-0.45, 0.55], [0.45, 0.55], [0, 0.6]] as const) {
    ctx.beginPath();
    ctx.ellipse(dx * r, 0, w * r, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#5C7244';
  ctx.fillRect(-r * 0.08, -r * 1.05, r * 0.16, r * 0.35);
}

function confetti(ctx: CanvasRenderingContext2D, r: number, phase: number) {
  ctx.scale(1, Math.cos(phase * 3));
  ctx.fillRect(-r * 0.5, -r * 0.25, r, r * 0.5);
}

function pick<T>(items: T[]) { return items[Math.floor(Math.random() * items.length)]; }

function pickShape(config: Config): Shape {
  let roll = Math.random();
  for (const [shape, share] of config.shapes) { if ((roll -= share) <= 0) return shape; }
  return config.shapes[0][0];
}

function makeParticle(effect: FestiveEffect, w: number, h: number, initial: boolean): Particle {
  const config = CONFIG[effect];
  const shape = pickShape(config);
  const r = config.size * (0.55 + Math.random() * 0.9);
  const speed = config.speed[0] + Math.random() * (config.speed[1] - config.speed[0]);
  return {
    x: Math.random() * w,
    y: initial ? Math.random() * h : config.rising ? h + r * 2 : -r * 2,
    r,
    vy: (config.rising ? -1 : 1) * speed,
    vx: (Math.random() - 0.5) * 0.3,
    phase: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * config.spin * 2,
    angle: Math.random() * Math.PI * 2,
    shape,
    color: pick(config.colorFor?.[shape] ?? config.colors),
    alpha: shape === 'heart' ? 0.55 + Math.random() * 0.35 : 0.7 + Math.random() * 0.3,
  };
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.fillStyle = p.color;
  // Les formes blanches ou très claires ont un léger halo pour rester visibles sur le fond crème.
  const light = p.color === '#FFFFFF' || p.color === '#F9DDE2' || p.color === '#F2E0C4';
  if (light) { ctx.shadowColor = SHADOW_LIGHT; ctx.shadowBlur = 3; }
  switch (p.shape) {
    case 'dot': ctx.beginPath(); ctx.arc(0, 0, p.r * 0.75, 0, Math.PI * 2); ctx.fill(); break;
    case 'flake': ctx.rotate(p.angle); flake(ctx, p.r * 1.7); break;
    case 'star': ctx.rotate(p.angle); ctx.shadowColor = 'rgba(216,136,32,0.6)'; ctx.shadowBlur = 6; star(ctx, p.r * 1.3); break;
    case 'heart': ctx.rotate(Math.sin(p.phase) * 0.35); heart(ctx, p.r); break;
    case 'leaf': ctx.rotate(p.angle); ctx.scale(1, 0.75 + Math.abs(Math.sin(p.phase * 2)) * 0.25); leaf(ctx, p.r); break;
    case 'petal': ctx.rotate(p.angle); ctx.scale(1, 0.6 + Math.abs(Math.sin(p.phase * 2)) * 0.4); petal(ctx, p.r); break;
    case 'flower': ctx.rotate(p.angle); flower(ctx, p.r, p.color); break;
    case 'egg': ctx.rotate(Math.sin(p.phase) * 0.4); egg(ctx, p.r); break;
    case 'butterfly': ctx.rotate(Math.sin(p.phase) * 0.3); butterfly(ctx, p.r, Math.sin(p.phase * 9)); break;
    case 'pumpkin': ctx.rotate(Math.sin(p.phase) * 0.3); pumpkin(ctx, p.r); break;
    case 'confetti': ctx.rotate(p.angle); confetti(ctx, p.r, p.phase); break;
  }
}

/** Animation dans un conteneur : la page entière (fixed) ou un aperçu (absolute). */
export function FestiveCanvas({ effect, density = 'normal', contained = false }: { effect: FestiveEffect; density?: FestiveDensity; contained?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const config = CONFIG[effect];
    let width = 0, height = 0, frame = 0, last = performance.now();
    let particles: Particle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const box = contained ? canvas!.parentElement!.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      width = box.width; height = box.height;
      canvas!.width = Math.round(width * dpr); canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`; canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(COUNTS[density] * (contained ? 0.6 : width < 640 ? 0.5 : 1) * (config.count ?? 1));
      particles = Array.from({ length: Math.max(4, count) }, () => makeParticle(effect, width, height, true));
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
        p.x += (p.vx + Math.sin(p.phase) * config.sway) * dt;
        const out = p.vy > 0 ? p.y > height + p.r * 3 : p.y < -p.r * 3;
        if (out || p.x < -40 || p.x > width + 40) { particles[i] = makeParticle(effect, width, height, false); continue; }
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.globalAlpha = p.alpha;
        drawParticle(ctx!, p);
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
