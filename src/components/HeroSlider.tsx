import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
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
    image: '/785364099_2181757785739338_4944579142739418340_n.jpg',
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
    image: '/creation-garcon.webp',
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
    image: '/creation-famille.webp',
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
    image: '/creation-amitie.webp',
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
    image: '/742951638_2150815128833604_2847242481161327155_n.jpg',
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
  const [chapters, setChapters] = useState<Chapter[]>(defaultChapters);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fetchHeroSlides().then((rows) => {
      if (rows.length) setChapters(rows.filter((r) => r.published).map(mapSlide));
    }).catch(() => {});
  }, []);

  const current = chapters[index];
  const nextChapter = chapters[(index + 1) % chapters.length];
  const duration = current.videoId ? VIDEO_SLIDE_MS : IMAGE_SLIDE_MS;

  const goTo = useCallback((i: number) => {
    const clamped = ((i % chapters.length) + chapters.length) % chapters.length;
    setIndex(clamped);
    setProgress(0);
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p >= 1) {
        setIndex((i) => (i + 1) % chapters.length);
        setProgress(0);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, duration, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ') { e.preventDefault(); setPaused((v) => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const posterSrc = current.videoId
    ? `https://img.youtube.com/vi/${current.videoId}/maxresdefault.jpg`
    : current.image ?? '';

  const nextPreviewSrc = nextChapter.videoId
    ? `https://img.youtube.com/vi/${nextChapter.videoId}/hqdefault.jpg`
    : nextChapter.image ?? '';

  return (
    <section
      className="relative w-full overflow-hidden bg-cream text-wood-deep pt-28 md:pt-32 lg:pt-36 pb-24 md:pb-28 lg:pb-32"
      aria-roledescription="carousel"
      aria-label="L'histoire de l'atelier"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cream via-cream-warm to-cream-deep" aria-hidden="true" />
      <div className={`pointer-events-none absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-60 bg-gradient-to-br ${current.palette.accentSoft} to-transparent transition-opacity duration-1000`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-40 bg-gradient-to-tr ${current.palette.accentSoft} to-transparent transition-opacity duration-1000`} aria-hidden="true" />

      <div className="pointer-events-none absolute inset-y-0 left-0 hidden lg:flex items-center pl-2 xl:pl-4">
        <span
          className={`font-serif italic font-light leading-none ${current.palette.number} transition-colors duration-700`}
          style={{ fontSize: 'clamp(12rem, 24vw, 22rem)' }}
          aria-hidden="true"
        >
          {current.number}
        </span>
      </div>

      <div className="relative z-10 container-page">
        <div className="flex items-center justify-between gap-4 mb-8 sm:mb-10">
          <div className="flex items-center gap-4 min-w-0">
            <span className={`inline-block w-10 sm:w-14 h-px bg-gradient-to-r ${current.palette.accent} transition-all duration-700`} />
            <p className={`font-serif italic text-sm sm:text-base ${current.palette.text} tracking-wide truncate transition-colors duration-700`}>
              {current.chapter}
            </p>
          </div>
          <p className="hidden md:flex items-center gap-2 text-wood-deep/50 font-serif italic text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Récit visuel — L’Atelier d’Isabelle
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7 xl:col-span-6 lg:pl-8 xl:pl-14">
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-[0.4em] ${current.palette.text} mb-4 sm:mb-6 transition-colors duration-700`}>
              {current.eyebrow}
            </p>

            <h1
              key={`title-${index}`}
              className="font-serif font-light text-wood-deep animate-hero-fade"
              style={{
                fontSize: 'clamp(2.25rem, 5.5vw, 5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              {current.title.split(' ').map((word, i, arr) => {
                const isAccent = i >= arr.length - 2;
                return (
                  <span
                    key={`${index}-${i}`}
                    className={isAccent ? `bg-gradient-to-r ${current.palette.accent} bg-clip-text text-transparent` : ''}
                  >
                    {word}{i < arr.length - 1 ? ' ' : ''}
                  </span>
                );
              })}
            </h1>

            <div key={`poem-${index}`} className="mt-6 sm:mt-8 max-w-xl animate-hero-fade">
              <p className="text-base sm:text-lg text-wood-deep/80 leading-relaxed font-light">
                {current.poem}
              </p>
              <div className="mt-5 flex items-start gap-3">
                <span className={`mt-2 block w-6 h-px bg-gradient-to-r ${current.palette.accent}`} />
                <p className={`font-serif italic text-sm sm:text-base ${current.palette.text} leading-relaxed`}>
                  « {current.quote} »
                </p>
              </div>
            </div>

            <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to={current.cta.to}
                className={`group inline-flex items-center justify-center gap-3 rounded-pill px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r ${current.palette.accent} text-wood-darker font-medium text-sm sm:text-base shadow-warm-glow hover:-translate-y-0.5 transition-all duration-500`}
              >
                <span>{current.cta.label}</span>
                <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-wood-darker/15">
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-45" />
                </span>
              </Link>
              <Link
                to="/personnalisation"
                className="inline-flex items-center justify-center gap-2 text-wood-deep/85 hover:text-wood-deep text-sm font-medium tracking-wide"
              >
                <span className="border-b border-wood-deep/40 pb-0.5 hover:border-wood-deep transition-colors">
                  Imaginer une création
                </span>
              </Link>
            </div>

          </div>

          <div className="lg:col-span-5 xl:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm lg:max-w-none">
              <div className={`pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br ${current.palette.accent} opacity-20 blur-3xl transition-opacity duration-1000`} />
              <div
                key={`poster-${index}`}
                className="relative w-full sm:w-[22rem] lg:w-[24rem] xl:w-[28rem] mx-auto aspect-[3/4] rounded-[2rem] overflow-hidden shadow-[0_30px_60px_-20px_rgba(45,27,14,0.35)] ring-1 ring-wood-deep/10 bg-cream-deep animate-hero-poster"
              >
                {current.videoId ? (
                  <iframe
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&mute=1&loop=1&playlist=${current.videoId}&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0&iv_load_policy=3&showinfo=0`}
                    title={current.title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                  />
                ) : (
                  <img src={posterSrc} alt={current.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true" />

                <span className="pointer-events-none absolute top-3 left-3 w-6 h-6 border-t border-l border-cream/70 rounded-tl-lg" />
                <span className="pointer-events-none absolute top-3 right-3 w-6 h-6 border-t border-r border-cream/70 rounded-tr-lg" />
                <span className="pointer-events-none absolute bottom-3 left-3 w-6 h-6 border-b border-l border-cream/70 rounded-bl-lg" />
                <span className="pointer-events-none absolute bottom-3 right-3 w-6 h-6 border-b border-r border-cream/70 rounded-br-lg" />

                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-cream/85">Planche</p>
                    <p className="font-serif italic text-cream text-lg">{current.number} / {String(chapters.length).padStart(2, '0')}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.3em] px-2 py-1 rounded-pill border border-cream/40 text-cream bg-wood-darker/20 backdrop-blur-sm">
                    {current.videoId ? 'Vidéo' : 'Image'}
                  </span>
                </div>
              </div>

              <div className="hidden xl:block absolute -bottom-8 -left-14 w-40 aspect-[4/5] rounded-2xl overflow-hidden shadow-elevated ring-1 ring-wood-deep/10 rotate-[-6deg] bg-cream-deep">
                <img src={nextPreviewSrc} alt="" className="w-full h-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-wood-darker/50 to-transparent" />
                <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-[0.3em] text-cream/95 font-medium">
                  Chapitre suivant
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 sm:mt-16 flex items-end justify-between gap-4 sm:gap-6 flex-wrap">
          <div className="hidden md:block flex-1 min-w-0 max-w-2xl px-4">
            <div className="flex items-center justify-between mb-2 text-[10px] uppercase tracking-[0.3em] text-wood-deep/60">
              <span>{current.chapter}</span>
              <span className={`font-serif italic ${current.palette.text} normal-case tracking-normal text-sm`}>{current.eyebrow}</span>
              <span>{String(index + 1).padStart(2, '0')} — {String(chapters.length).padStart(2, '0')}</span>
            </div>
            <div className="relative h-px bg-wood-deep/15 rounded-pill overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${current.palette.accent}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-end gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            {chapters.map((c, i) => (
              <button
                key={c.number}
                onClick={() => goTo(i)}
                className={`relative shrink-0 overflow-hidden rounded-lg transition-all duration-500 ${
                  i === index
                    ? 'w-16 sm:w-20 h-20 sm:h-24 ring-2 ring-wood-deep shadow-md'
                    : 'w-10 sm:w-12 h-14 sm:h-16 ring-1 ring-wood-deep/20 opacity-70 hover:opacity-100'
                }`}
                aria-label={`Aller au ${c.chapter}`}
                aria-current={i === index}
                type="button"
              >
                <img
                  src={c.videoId ? `https://img.youtube.com/vi/${c.videoId}/hqdefault.jpg` : c.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <span className={`absolute top-1 left-1.5 text-[9px] font-serif italic ${i === index ? 'text-cream' : 'text-cream/95'}`}>
                  {c.number}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
