import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Plus } from 'lucide-react';
import SEO from '@/components/SEO';
import HeroSlider from '@/components/HeroSlider';
import ProductCard from '@/components/ProductCard';
import CallToAction from '@/components/CallToAction';
import { Appear, Cascade, CascadeItem, RisingTitle, UnveilImage } from '@/components/motion';
import { usePublicCategories, usePublicCreations } from '@/lib/publicCatalog';
import { useFaqs, useMaterials, useSiteTexts } from '@/lib/siteData';
import { useSeasonImages, useSiteImages } from '@/lib/siteImages';
import { faqJsonLd, storeJsonLd, websiteJsonLd } from '@/lib/structuredData';
import { formatPrice, thumbUrl } from '@/lib/seo';
import { seasons } from '@/config/catalog';
import { siteConfig } from '@/config/site';
import type { Creation } from '@/types';

const title = 'font-serif font-normal tracking-[-0.015em] text-wood-deep text-[2rem] leading-[1.08] sm:text-[2.6rem] lg:text-[3.25rem]';
const lead = 'text-base sm:text-lg text-wood-deep/70 leading-relaxed';
const textLink = 'group inline-flex items-center gap-2 min-h-[44px] text-sm font-medium text-wood-deep underline decoration-wood-deep/25 underline-offset-[6px] hover:text-terracotta hover:decoration-terracotta transition-colors';

/** Bandeau défilant : les mots de l'atelier, entre la bannière et les créations. */
function Ribbon() {
  const words = ['Fait main dans les Vosges', 'Galets', 'Papier', 'Bois', 'Fil de fer', 'Pièces uniques et petites séries', 'Personnalisable'];
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center animate-ribbon motion-reduce:animate-none group-hover:[animation-play-state:paused]" aria-hidden={hidden || undefined}>
      {words.map((word) => (
        <li key={word} className="flex items-center font-serif italic text-xl sm:text-2xl text-wood/80 whitespace-nowrap">
          <span className="px-6 sm:px-9">{word}</span>
          <svg viewBox="0 0 24 14" className="h-3 w-5 text-terracotta/70" aria-hidden="true"><ellipse cx="12" cy="7" rx="11" ry="6" fill="currentColor" /></svg>
        </li>
      ))}
    </ul>
  );
  return <div className="group flex overflow-hidden border-y border-wood-deep/10 py-4 sm:py-5 select-none">{row(false)}{row(true)}</div>;
}

/** Coups de cœur : une grande pièce mise en avant, quatre autres autour. */
function Featured({ creations }: { creations: Creation[] }) {
  const [first, ...rest] = creations;
  if (!first) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:gap-x-8">
      <Appear className="col-span-2 lg:col-span-6">
        <article className="group relative">
          <div className="relative overflow-hidden rounded-soft-lg bg-sand-light shadow-card aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]">
            <img src={first.mainImage} alt={first.mainImageAlt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-wood-darker/80 via-wood-darker/35 to-transparent p-5 sm:p-8 pt-24">
              <h3 className="font-serif text-2xl sm:text-4xl text-off-white leading-tight">
                <Link to={`/creations/${first.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-4 focus-visible:after:outline-off-white">{first.name}</Link>
              </h3>
              <p className="mt-2 flex items-center gap-3 text-off-white/90">
                <span className="tabular-nums">{first.price !== null ? formatPrice(first.price) : 'Prix sur demande'}</span>
                <span className="inline-flex items-center gap-1.5 text-sm">Découvrir <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></span>
              </p>
            </div>
          </div>
        </article>
      </Appear>
      <Cascade className="col-span-2 lg:col-span-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:gap-x-8 content-start">
        {rest.slice(0, 4).map((creation) => <CascadeItem key={creation.id}><ProductCard creation={creation} compact /></CascadeItem>)}
      </Cascade>
    </div>
  );
}

/** Collections : rail horizontal à faire défiler (doigt, molette ou flèches). */
function CollectionsRail({ creations }: { creations: Creation[] }) {
  const { categories } = usePublicCategories();
  const text = useSiteTexts();
  const rail = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' });
  const btn = 'h-11 w-11 inline-flex items-center justify-center rounded-full border border-wood-deep/20 text-wood-deep hover:border-terracotta hover:text-terracotta transition-colors';
  return (
    <>
      <div className="container-page flex items-end justify-between gap-6">
        <RisingTitle text={text('accueil.categories.titre')} className={title} />
        <div className="hidden sm:flex gap-2 shrink-0 pb-1">
          <button type="button" className={btn} onClick={() => scroll(-1)} aria-label="Collections précédentes"><ArrowLeft className="h-4 w-4" /></button>
          <button type="button" className={btn} onClick={() => scroll(1)} aria-label="Collections suivantes"><ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
      <ul ref={rail} className="mt-8 lg:mt-12 flex gap-3 sm:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory rail-pad pb-2">
        {categories.map((cat) => {
          const items = creations.filter((c) => c.category === cat.slug);
          const cover = cat.image || items[0]?.mainImage;
          return (
            <li key={cat.slug} className="snap-start shrink-0 w-[62vw] sm:w-[19rem] lg:w-[21rem]">
              <Link to={`/collections/${cat.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-soft-lg bg-sand-light shadow-soft">
                  {cover && <img src={thumbUrl(cover)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" />}
                  <span className="absolute right-3 top-3 rounded-pill bg-off-white/95 px-2.5 py-1 text-xs font-medium text-wood-deep tabular-nums shadow-soft">{items.length}</span>
                </div>
                <h3 className="mt-4 font-serif text-xl sm:text-2xl leading-snug text-wood-deep group-hover:text-terracotta transition-colors">{cat.name}</h3>
                <p className="mt-1 text-sm text-wood-deep/60 leading-relaxed line-clamp-2">{cat.description}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Saisons : quatre volets ; celui qu'on survole (ou touche) s'ouvre. */
function SeasonsPanels() {
  const { seasonImages } = useSeasonImages();
  const [open, setOpen] = useState(0);
  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:h-[34rem]">
      {seasons.map((season, i) => {
        const active = open === i;
        return (
          <Link
            key={season.slug}
            to={`/boutique?saison=${season.slug}`}
            onMouseEnter={() => setOpen(i)}
            onFocus={() => setOpen(i)}
            className={`group relative overflow-hidden rounded-soft-lg bg-wood-deep min-h-[13rem] lg:min-h-0 transition-[flex-grow] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${active ? 'lg:grow-[3.2]' : 'lg:grow'} lg:basis-0`}
          >
            <img src={seasonImages[season.slug] || season.image} alt="" loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${active ? 'lg:scale-100 lg:opacity-100' : 'lg:scale-110 lg:opacity-70'}`} />
            <span className="absolute inset-0 bg-gradient-to-t from-wood-darker/90 via-wood-darker/55 to-wood-darker/15 lg:via-wood-darker/20 lg:to-transparent" aria-hidden="true" />
            <span className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-off-white">
              <span className="block font-serif text-2xl sm:text-3xl lg:text-[1.7rem] leading-tight">{season.name}</span>
              <span className={`block overflow-hidden transition-[max-height,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${active ? 'lg:max-h-40 lg:opacity-100' : 'lg:max-h-0 lg:opacity-0'}`}>
                <span className="mt-2 block max-w-sm text-sm sm:text-base text-off-white/85 leading-relaxed">{season.description}</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium">Voir les créations <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></span>
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function HomePage() {
  const { creations, loading, error } = usePublicCreations();
  const { images } = useSiteImages();
  const materials = useMaterials();
  const text = useSiteTexts();
  const faqs = useFaqs();
  // Sans création mise en avant, on montre les plus récentes plutôt qu'une section vide.
  const featured = creations.some((c) => c.featured) ? creations.filter((c) => c.featured) : [...creations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const steps = ['Vous racontez votre idée', 'Isabelle échange avec vous', 'La création est réalisée à la main', 'Vous validez avant la remise ou l’expédition'];
  const places = [['Saint-Dié-des-Vosges', 'La Boutik’art'], ['Raon-l’Étape', 'La Boutique des Artisans'], ['Vosges', 'Marchés artisanaux'], ['Sur demande', 'Créations personnalisées']];

  return (
    <>
      <SEO title={siteConfig.defaultSeo.title} description={siteConfig.defaultSeo.description} image={images.og_image} canonicalPath="/" jsonLd={[storeJsonLd(images.og_image), websiteJsonLd(), ...(faqs.length ? [faqJsonLd(faqs)] : [])]} />
      <main>
        <h1 className="sr-only">L’Atelier d’Isabelle — décorations artisanales faites main dans les Vosges : galets, papier, bois et fil de fer</h1>
        {loading && <div className="container-page pt-8 text-sm text-wood-deep/60">Chargement des créations…</div>}
        {error && <div className="container-page pt-8 text-sm text-red-700">{error}</div>}
        <HeroSlider />
        <Ribbon />

        {/* Coups de cœur */}
        <section className="py-20 lg:py-28">
          <div className="container-page">
            <div className="grid lg:grid-cols-12 gap-4 lg:gap-8 items-end mb-10 lg:mb-14">
              <RisingTitle text={text('accueil.coups_de_coeur.titre')} className={`${title} lg:col-span-6`} />
              <Appear className="lg:col-span-5 lg:col-start-8"><p className={lead}>{text('accueil.coups_de_coeur.texte')}</p></Appear>
            </div>
            <Featured creations={featured.slice(0, 5)} />
            <div className="mt-12 lg:mt-16 text-center">
              <Link to="/boutique" className="btn-secondary px-7 py-3.5 group">Voir toutes les créations <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></Link>
            </div>
          </div>
        </section>

        {/* Collections */}
        <section className="py-20 lg:py-28 bg-off-white/60 border-y border-wood-deep/[0.06]">
          <CollectionsRail creations={creations} />
        </section>

        {/* Sur mesure */}
        <section className="py-20 lg:py-32">
          <div className="container-page grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            <UnveilImage src={images.home_sur_mesure_image} alt="Cadre familial personnalisé réalisé en galets" parallax={6} className="lg:col-span-7 rounded-soft-lg aspect-[4/3] shadow-card" />
            <div className="lg:col-span-4 lg:col-start-9">
              <RisingTitle text={text('accueil.sur_mesure.titre')} className={title.replace('lg:text-[3.25rem]', 'lg:text-[2.75rem]')} />
              <Appear><p className={`mt-6 whitespace-pre-line ${lead}`}>{text('accueil.sur_mesure.texte')}</p></Appear>
              <Cascade className="mt-8 border-t border-wood-deep/10">
                {steps.map((step, i) => (
                  <CascadeItem key={step} className="flex items-baseline gap-4 border-b border-wood-deep/10 py-3.5">
                    <span className="font-serif italic text-xl text-terracotta tabular-nums w-5">{i + 1}</span>
                    <span className="text-wood-deep/80">{step}</span>
                  </CascadeItem>
                ))}
              </Cascade>
              <Link to="/personnalisation" className="btn-primary mt-8 px-7 py-3.5 group">Demander une création personnalisée <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></Link>
            </div>
          </div>
        </section>

        {/* Matières */}
        <section className="py-20 lg:py-28 bg-wood-deep text-cream relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(216,136,32,0.22),transparent)]" aria-hidden="true" />
          <div className="container-page relative">
            <RisingTitle text={text('accueil.matieres.titre')} className={`${title} !text-cream max-w-3xl`} />
            <Cascade className="mt-12 lg:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-8">
              {materials.map((m, i) => (
                <CascadeItem key={m.slug} className={i % 2 ? 'lg:mt-14' : ''}>
                  <div className="overflow-hidden rounded-t-[10rem] rounded-b-soft-lg aspect-[3/4] bg-wood">
                    <img src={m.image} alt={m.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.06]" />
                  </div>
                  <h3 className="mt-5 font-serif text-2xl text-cream">{m.name}</h3>
                  <p className="mt-2 text-sm text-cream/70 leading-relaxed">{m.description}</p>
                </CascadeItem>
              ))}
            </Cascade>
          </div>
        </section>

        {/* Saisons */}
        <section className="py-20 lg:py-28">
          <div className="container-page">
            <RisingTitle text={text('accueil.saisons.titre')} className={`${title} mb-10 lg:mb-14`} />
            <SeasonsPanels />
          </div>
        </section>

        {/* L'atelier et les Vosges */}
        <section className="pb-20 lg:pb-32">
          <div className="container-page grid lg:grid-cols-12 gap-10 lg:gap-8 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-32">
              <RisingTitle text={text('accueil.univers.titre')} className={title.replace('lg:text-[3.25rem]', 'lg:text-[2.75rem]')} />
              <Appear><p className={`mt-6 whitespace-pre-line ${lead}`}>{text('accueil.univers.texte')}</p></Appear>
              <Link to="/a-propos" className={`${textLink} mt-6`}>Découvrir l’atelier <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></Link>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <UnveilImage src={images.home_univers_image} alt="Mains d'artisane travaillant une création en galets" parallax={5} className="rounded-soft-lg aspect-[4/3] shadow-card" />
              <div className="mt-12 lg:mt-16">
                <h2 className="font-serif text-2xl sm:text-3xl text-wood-deep leading-tight">{text('accueil.vosges.titre')}</h2>
                <p className="mt-4 text-wood-deep/70 leading-relaxed whitespace-pre-line">{text('accueil.vosges.texte')}</p>
                <dl className="mt-8 border-t border-wood-deep/10">
                  {places.map(([place, detail]) => (
                    <div key={place} className="flex items-baseline justify-between gap-6 border-b border-wood-deep/10 py-3.5">
                      <dt className="font-serif text-lg text-wood-deep">{place}</dt>
                      <dd className="text-sm text-wood-deep/65 text-right">{detail}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/evenements" className="btn-secondary"><MapPin className="h-4 w-4" /> Où trouver l’atelier</Link>
                  <Link to="/contact" className="btn-primary group">Contacter Isabelle <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Questions fréquentes */}
        {faqs.length > 0 && (
          <section className="py-20 lg:py-28 bg-off-white/60 border-t border-wood-deep/[0.06]">
            <div className="container-page grid lg:grid-cols-12 gap-8">
              <RisingTitle text={text('accueil.faq.titre')} className={`${title.replace('lg:text-[3.25rem]', 'lg:text-[2.75rem]')} lg:col-span-4 lg:sticky lg:top-32 lg:self-start`} />
              <div className="lg:col-span-7 lg:col-start-6 border-t border-wood-deep/15">
                {faqs.map((faq) => (
                  <details key={faq.id} className="faq group border-b border-wood-deep/15">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                      <h3 className="font-serif text-xl sm:text-2xl leading-snug text-wood-deep group-hover:text-terracotta transition-colors">{faq.question}</h3>
                      <Plus className="mt-1.5 h-5 w-5 shrink-0 text-terracotta transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-[135deg]" aria-hidden="true" />
                    </summary>
                    <p className="pb-6 pr-10 max-w-[65ch] text-wood-deep/75 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        <CallToAction title={text('accueil.appel.titre')} text={text('accueil.appel.texte')} primaryLabel="Contacter Isabelle" secondaryLabel="Voir les créations" secondaryTo="/boutique" />
      </main>
    </>
  );
}
