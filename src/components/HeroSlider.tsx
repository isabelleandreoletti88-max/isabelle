import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { fetchHeroSlides, type HeroSlideRow } from '@/lib/catalogService';

interface Chapter {
  chapter: string;
  number: string;
  image?: string;
  videoId?: string;
  eyebrow: string;
  title: string;
  poem: string;
  quote: string;
  cta: { label: string; to: string };
  palette: {
    accent: string;
    accentSoft: string;
    text: string;
    number: string;
  };
}

const defaultChapters: Chapter[] = [
  {
    chapter: 'Chapitre I',
    number: '01',
    videoId: 'ip18Y5AfQ8s',
    eyebrow: 'L’atelier vivant',
    title: 'Une lumière, des mains, une histoire',
    poem: 'Le temps se suspend dans l’atelier. Sous les doigts d’Isabelle, les galets deviennent regards, les fils deviennent liens.',
    quote: 'Chaque pièce est un moment qu’on garde.',
    cta: { label: 'Voir la boutique', to: '/boutique' },
    palette: {
      accent: 'from-honey via-amber to-honey-light',
      accentSoft: 'from-honey/20',
      text: 'text-honey-dark',
      number: 'text-honey/30',
    },
  },
  {
    chapter: 'Chapitre II',
    number: '02',
    image: '/univers-atelier-isabelle.webp',
    eyebrow: 'Le geste',
    title: 'Là où les matières s’éveillent',
    poem: 'Un galet posé, un fil qui plie, un souffle de patience — chaque création commence par un silence dans les mains d’Isabelle.',
    quote: 'Je ne fabrique pas, je laisse la matière raconter.',
    cta: { label: 'Entrer dans l’atelier', to: '/a-propos' },
    palette: {
      accent: 'from-terracotta via-terracotta-light to-honey',
      accentSoft: 'from-terracotta/20',
      text: 'text-terracotta',
      number: 'text-terracotta/30',
    },
  },
  {
    chapter: 'Chapitre III',
    number: '03',
    image: '/creation-naissance-garcon-galets.webp',
    eyebrow: 'La naissance',
    title: 'Le premier souffle d’une histoire',
    poem: 'Un prénom, quelques galets tendres, un cadre qui accueille l’enfant. Une décoration pour marquer le commencement.',
    quote: 'Que chaque enfant ait son étoile posée sur le mur.',
    cta: { label: 'Créations naissance', to: '/boutique?categorie=naissance-enfance' },
    palette: {
      accent: 'from-copper via-terracotta to-honey',
      accentSoft: 'from-copper/20',
      text: 'text-copper',
      number: 'text-copper/30',
    },
  },
  {
    chapter: 'Chapitre IV',
    number: '04',
    image: '/creation-famille-papier.webp',
    eyebrow: 'La famille',
    title: 'Ceux qu’on aime, assemblés en un tableau',
    poem: 'Papa, maman, grand frère, petite sœur, l’animal fidèle. Un cadre qui rassemble la tribu en une seule scène.',
    quote: 'La famille tient dans un cadre, si on l’imagine ensemble.',
    cta: { label: 'Créations famille', to: '/boutique?categorie=famille' },
    palette: {
      accent: 'from-rust via-terracotta-dark to-copper',
      accentSoft: 'from-rust/20',
      text: 'text-rust',
      number: 'text-rust/30',
    },
  },
  {
    chapter: 'Chapitre V',
    number: '05',
    image: '/creation-amitie-papier.webp',
    eyebrow: 'L’amitié',
    title: 'Deux silhouettes, un même fil',
    poem: 'Pour dire à celle ou celui qui compte que sa place est là, entre le cœur et le mur d’en face.',
    quote: 'Une amitié qui dure, ça se pose en évidence.',
    cta: { label: 'Créations amitié', to: '/boutique?categorie=amitie' },
    palette: {
      accent: 'from-sage via-sage-light to-honey',
      accentSoft: 'from-sage/20',
      text: 'text-sage-dark',
      number: 'text-sage/30',
    },
  },
  {
    chapter: 'Chapitre VI',
    number: '06',
    image: '/atelier-isabelle-creations-artisanales.webp',
    eyebrow: 'Les saisons',
    title: 'Créer au rythme de la nature',
    poem: 'Printemps de renaissance, été de rencontres, automne cuivré, hiver de douceur — chaque saison a son geste et sa couleur.',
    quote: 'On ne travaille pas les saisons, on les écoute.',
    cta: { label: 'Parcourir la boutique', to: '/boutique' },
    palette: {
      accent: 'from-terracotta via-honey to-amber-light',
      accentSoft: 'from-terracotta/20',
      text: 'text-terracotta-dark',
      number: 'text-terracotta/30',
    },
  },
];

const IMAGE_SLIDE_MS = 8500;
const VIDEO_SLIDE_MS = 14000;

function mapSlide(s: HeroSlideRow): Chapter {
  return {
    chapter: s.chapter,
    number: s.number,
    image: s.image ?? undefined,
    videoId: s.video_id ?? undefined,
    eyebrow: s.eyebrow,
    title: s.title,
    poem: s.poem,
    quote: s.quote,
    cta: { label: s.cta_label, to: s.cta_to },
    palette: {
      accent: s.palette_accent,
      accentSoft: s.palette_accent_soft,
      text: s.palette_text,
      number: s.palette_number,
    },
  };
}

export default function HeroSlider() {
  const reduceMotion = useReducedMotion();
  const [chapters, setChapters] = useState<Chapter[]>(defaultChapters);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const rafRef = useRef<number | null>(null);
  // Le premier chapitre est visible d'emblée (page pré-générée) ; seuls les changements s'animent.
  const firstRender = useRef(true);
  useEffect(() => { firstRender.current = false; }, []);

  useEffect(() => {
    fetchHeroSlides().then((rows) => {
      const published = rows.filter((r) => r.published).map(mapSlide);
      if (published.length) setChapters(published);
    }).catch(() => {});
  }, []);

  const safeIndex = index % chapters.length;
  const current = chapters[safeIndex];
  const duration = current.videoId ? VIDEO_SLIDE_MS : IMAGE_SLIDE_MS;
  const running = !paused && !hovered && !reduceMotion && chapters.length > 1;

  const goTo = useCallback((i: number) => {
    setIndex(((i % chapters.length) + chapters.length) % chapters.length);
    setProgress(0);
  }, [chapters.length]);

  useEffect(() => { setVideoReady(false); }, [safeIndex]);

  useEffect(() => {
    if (!running) return;
    const start = performance.now() - progress * duration;
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / duration);
      setProgress(p);
      if (p >= 1) goTo(safeIndex + 1);
      else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, duration, safeIndex, goTo]);

  const ease = [0.16, 1, 0.3, 1] as const;
  const words = current.title.split(' ');
  const poster = current.videoId ? `https://img.youtube.com/vi/${current.videoId}/maxresdefault.jpg` : current.image ?? '';

  return (
    <section
      className="relative w-full overflow-hidden pt-28 md:pt-32 lg:pt-36 pb-16 md:pb-20 lg:pb-24"
      aria-roledescription="carrousel"
      aria-label="L’histoire de l’atelier"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') goTo(safeIndex + 1); if (e.key === 'ArrowLeft') goTo(safeIndex - 1); }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cream via-cream-warm/70 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-10%] top-[10%] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(216,136,32,0.18),transparent)]" aria-hidden="true" />

      <div className="relative container-page grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Texte */}
        <div className="lg:col-span-6 order-2 lg:order-1">
          <h2 key={`t-${safeIndex}`} className="font-serif font-light text-wood-deep text-balance" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.6rem)', lineHeight: 1.04, letterSpacing: '-0.02em' }}>
            {words.map((word, i) => (
              <motion.span
                key={i}
                className={`inline-block ${i >= words.length - 2 ? 'italic text-terracotta' : ''}`}
                initial={firstRender.current || reduceMotion ? false : { opacity: 0, y: '0.4em', filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, ease, delay: 0.25 + i * 0.06 }}
              >
                {word}
              </motion.span>
            )).reduce<ReactNode[]>((acc, el, i) => (i ? [...acc, ' ', el] : [el]), [])}
          </h2>

          <motion.div
            key={`p-${safeIndex}`}
            initial={firstRender.current || reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.55 }}
          >
            <p className="mt-6 sm:mt-8 max-w-[34rem] text-base sm:text-lg text-wood-deep/75 leading-relaxed">{current.poem}</p>
            {current.quote && (
              <p className="mt-5 flex items-baseline gap-3 font-serif italic text-lg text-wood">
                <span className="block h-px w-8 translate-y-[-0.3em] bg-terracotta/60" aria-hidden="true" />
                « {current.quote} »
              </p>
            )}
          </motion.div>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
            <Link to={current.cta.to} className="btn-primary px-7 py-3.5 text-base group">
              {current.cta.label}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link to="/personnalisation" className="inline-flex items-center justify-center min-h-[44px] text-sm font-medium text-wood-deep underline decoration-wood-deep/30 underline-offset-[6px] hover:decoration-terracotta hover:text-terracotta transition-colors">
              Imaginer une création personnalisée
            </Link>
          </div>

          {/* Chapitres */}
          {chapters.length > 1 && (
            <div className="mt-12 lg:mt-16 flex items-end gap-4">
              <ol className="flex-1 grid gap-3" style={{ gridTemplateColumns: `repeat(${chapters.length}, minmax(0, 1fr))` }}>
                {chapters.map((c, i) => (
                  <li key={c.number + i}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`${c.chapter} : ${c.title}`}
                      aria-current={i === safeIndex}
                      className="group w-full text-left pt-3 pb-1 min-h-[44px]"
                    >
                      <span className="block h-[2px] rounded-pill bg-wood-deep/15 overflow-hidden">
                        <span
                          className="block h-full bg-terracotta origin-left"
                          style={{ transform: `scaleX(${i < safeIndex ? 1 : i === safeIndex ? (running || progress ? progress : 1) : 0})` }}
                        />
                      </span>
                      <span className={`mt-2 hidden md:block truncate font-serif italic text-sm transition-colors ${i === safeIndex ? 'text-wood-deep' : 'text-wood-deep/60 group-hover:text-wood-deep'}`}>
                        {c.eyebrow || c.chapter}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                className="shrink-0 h-11 w-11 inline-flex items-center justify-center rounded-full border border-wood-deep/15 text-wood-deep/70 hover:text-terracotta hover:border-terracotta/50 transition-colors"
                aria-label={paused ? 'Reprendre le défilement' : 'Mettre le défilement en pause'}
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Image ou vidéo : chaque chapitre se dévoile par-dessus le précédent */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          <div className="relative mx-auto w-full max-w-[30rem] lg:max-w-none aspect-[4/3] sm:aspect-[4/5] lg:aspect-auto lg:h-[min(74vh,44rem)] rounded-[1.75rem] overflow-hidden bg-sand-light shadow-[0_40px_80px_-30px_rgba(45,27,14,0.45)]">
            <AnimatePresence initial={false}>
              <motion.div
                key={`m-${safeIndex}`}
                className="absolute inset-0"
                initial={reduceMotion ? { opacity: 0 } : { clipPath: 'inset(100% 0% 0% 0%)' }}
                animate={reduceMotion ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0%)' }}
                exit={{ opacity: 1, transition: { duration: 1.2 } }}
                transition={{ duration: 1.1, ease }}
              >
                <motion.img
                  src={poster}
                  alt={current.videoId ? '' : current.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={firstRender.current || reduceMotion ? false : { scale: 1.12 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.6, ease }}
                  onError={(e) => { if (current.videoId && !e.currentTarget.src.includes('hqdefault')) e.currentTarget.src = `https://img.youtube.com/vi/${current.videoId}/hqdefault.jpg`; }}
                  fetchPriority={safeIndex === 0 ? 'high' : 'auto'}
                />
                {current.videoId && (
                  <iframe
                    className={`pointer-events-none absolute top-0 left-1/2 h-full aspect-video -translate-x-1/2 transition-opacity duration-700 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
                    src={`https://www.youtube-nocookie.com/embed/${current.videoId}?autoplay=1&mute=1&loop=1&playlist=${current.videoId}&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0&iv_load_policy=3`}
                    title={current.title}
                    tabIndex={-1}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    onLoad={() => window.setTimeout(() => setVideoReady(true), 1500)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
