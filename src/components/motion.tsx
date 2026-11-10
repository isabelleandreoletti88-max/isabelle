import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/** Courbe de décélération commune à tout le site. */
export const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Pendant la pré-génération des pages (scripts/prerender.cjs), rien n'est animé :
 * le HTML enregistré contient tout le contenu visible, même sans JavaScript.
 */
export const isPrerender = typeof window !== 'undefined' && Boolean((window as unknown as { __PRERENDER__?: boolean }).__PRERENDER__);

function useStill() {
  const reduce = useReducedMotion();
  return isPrerender || Boolean(reduce);
}

/** Titre dont les mots montent un à un derrière un cache, quand il entre à l'écran. */
export function RisingTitle({ text, as: Tag = 'h2', className = '' }: { text: string; as?: 'h1' | 'h2' | 'h3'; className?: string }) {
  const still = useStill();
  const MotionTag = motion[Tag];
  if (still) return <Tag className={className}>{text}</Tag>;
  const words = text.split(' ');
  return (
    <MotionTag className={className} aria-label={text} initial="hidden" whileInView="shown" viewport={{ once: true, margin: '0px 0px -12% 0px' }} transition={{ staggerChildren: 0.045 }}>
      {words.map((word, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
          <motion.span className="inline-block" variants={{ hidden: { y: '105%' }, shown: { y: 0 } }} transition={{ duration: 0.8, ease: EASE }}>
            {word}{i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

/** Photo qui se dévoile comme on soulève un cache, avec un léger recul de l'image. */
export function UnveilImage({ src, alt, className = '', imgClassName = '', parallax = 0, eager = false }: { src: string; alt: string; className?: string; imgClassName?: string; parallax?: number; eager?: boolean }) {
  const still = useStill();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-parallax}%`, `${parallax}%`]);
  if (still) return <div className={`overflow-hidden ${className}`}><img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className={`h-full w-full object-cover ${imgClassName}`} /></div>;
  return (
    <motion.div ref={ref} className={`overflow-hidden ${className}`} initial={{ clipPath: 'inset(0% 0% 100% 0%)' }} whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }} viewport={{ once: true, margin: '0px 0px -10% 0px' }} transition={{ duration: 1.2, ease: EASE }}>
      <motion.img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className={`h-full w-full object-cover ${imgClassName}`} style={parallax ? { y, scale: 1 + parallax / 45 } : undefined} initial={{ scale: 1.18 }} whileInView={{ scale: parallax ? 1 + parallax / 45 : 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: EASE }} />
    </motion.div>
  );
}

/** Bloc de texte qui apparaît en douceur (sans déplacement marqué). */
export function Appear({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const still = useStill();
  if (still) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -8% 0px' }} transition={{ duration: 0.8, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

/** Liste dont les éléments arrivent l'un après l'autre (réservé aux vraies listes). */
export function Cascade({ children, className = '' }: { children: ReactNode; className?: string }) {
  const still = useStill();
  if (still) return <div className={className}>{children}</div>;
  return <motion.div className={className} initial="hidden" whileInView="shown" viewport={{ once: true, margin: '0px 0px -8% 0px' }} transition={{ staggerChildren: 0.08 }}>{children}</motion.div>;
}

export function CascadeItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  const still = useStill();
  if (still) return <div className={className}>{children}</div>;
  return <motion.div className={className} variants={{ hidden: { opacity: 0, y: 24 }, shown: { opacity: 1, y: 0 } }} transition={{ duration: 0.8, ease: EASE }}>{children}</motion.div>;
}
