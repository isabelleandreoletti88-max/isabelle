import { useState } from 'react';
import { ArrowUpRight, PenLine } from 'lucide-react';
import { Appear, Cascade, CascadeItem, RisingTitle } from '@/components/motion';
import { useGoogleReviews, useSiteSettings, useSiteTexts, type GoogleReview } from '@/lib/siteData';

/** Étoiles de notation (pleines, demi, vides), dessinées en SVG. */
export function Stars({ value, className = 'h-4 w-4' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5 text-honey" role="img" aria-label={`${value.toLocaleString('fr-FR')} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} viewBox="0 0 20 20" className={className} aria-hidden="true">
            <defs><linearGradient id={`star-${i}-${Math.round(fill * 100)}`}><stop offset={`${fill * 100}%`} stopColor="currentColor" /><stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity="0.22" /></linearGradient></defs>
            <path fill={`url(#star-${i}-${Math.round(fill * 100)})`} d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
          </svg>
        );
      })}
    </span>
  );
}

/** Logo « G » de Google, exigé à côté des avis issus de Google. */
function GoogleMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2-1.9 3.2-4.7 3.2-8.2z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2.2s.2-1.5.4-2.2V6.7H2A11 11 0 0 0 1 11.8c0 1.8.4 3.5 1.2 5.1L5.7 14z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.3 1.7l3.2-3.2A11 11 0 0 0 2 6.7l3.7 2.9C6.6 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const [open, setOpen] = useState(false);
  const long = review.text.length > 380;
  return (
    <figure className="flex h-full flex-col rounded-soft-lg bg-off-white p-5 sm:p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <Stars value={review.rating} />
        <GoogleMark />
      </div>
      <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-wood-deep/80">
        <p className={`whitespace-pre-line ${!open && long ? 'line-clamp-6' : ''}`}>{review.text || <span className="italic text-wood-deep/50">Note sans commentaire.</span>}</p>
        {long && <button type="button" className="mt-2 min-h-[40px] text-sm font-medium text-terracotta underline underline-offset-4" onClick={() => setOpen((v) => !v)} aria-expanded={open}>{open ? 'Réduire' : 'Lire la suite'}</button>}
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-wood-deep/10 pt-4">
        {review.author_photo
          ? <img src={review.author_photo} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-10 w-10 rounded-full object-cover bg-sand-light" />
          : <span className="h-10 w-10 rounded-full bg-sand-light inline-flex items-center justify-center font-serif text-lg text-wood" aria-hidden="true">{review.author.charAt(0)}</span>}
        <span className="min-w-0 text-sm">
          {review.author_uri ? <a href={review.author_uri} target="_blank" rel="noopener noreferrer" className="block truncate font-medium text-wood-deep hover:text-terracotta">{review.author}</a> : <span className="block truncate font-medium">{review.author}</span>}
          <span className="text-wood-deep/55">{review.relative_time}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Section « Avis » : note et avis de la fiche Google de l'atelier, et bouton pour en laisser un.
 * Sans clé Google configurée, seule l'invitation à donner son avis est affichée.
 */
export default function GoogleReviews() {
  const data = useGoogleReviews();
  const settings = useSiteSettings();
  const text = useSiteTexts();
  if (settings.reviews_enabled === 'false') return null;
  const minRating = Number(settings.reviews_min_rating) || 1;
  const reviews = data.reviews.filter((review) => review.rating >= minRating).slice(0, 5);
  const reviewUrl = settings.google_review_url;
  const hasRating = data.rating !== null && data.count > 0;
  const title = 'font-serif font-normal tracking-[-0.015em] text-wood-deep text-[2rem] leading-[1.08] sm:text-[2.6rem] lg:text-[2.75rem]';

  return (
    <section className="py-20 lg:py-28" aria-labelledby="avis-titre">
      <div className="container-page grid lg:grid-cols-12 gap-10 lg:gap-8 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-32">
          <div id="avis-titre"><RisingTitle text={text('accueil.avis.titre')} className={title} /></div>
          {hasRating && (
            <Appear className="mt-6 flex items-end gap-4">
              <span className="font-serif text-6xl leading-none text-wood-deep tabular-nums">{data.rating!.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
              <span className="pb-1">
                <Stars value={data.rating!} className="h-5 w-5" />
                <span className="mt-1 flex items-center gap-1.5 text-sm text-wood-deep/65"><GoogleMark className="h-3.5 w-3.5" />{data.count} avis sur Google</span>
              </span>
            </Appear>
          )}
          <Appear><p className="mt-6 text-base sm:text-lg text-wood-deep/70 leading-relaxed">{text('accueil.avis.texte')}</p></Appear>
          <div className="mt-8 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
            {reviewUrl && reviews.length > 0 && <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className="btn-primary px-6 py-3.5"><PenLine className="h-4 w-4" />Donner mon avis</a>}
            {data.maps_uri && reviews.length > 0 && <a href={data.maps_uri} target="_blank" rel="noopener noreferrer" className="btn-secondary px-6 py-3.5">Voir tous les avis <ArrowUpRight className="h-4 w-4" /></a>}
          </div>
          {reviewUrl && reviews.length > 0 && <p className="mt-3 text-xs text-wood-deep/50">Ouvre Google dans un nouvel onglet ; un compte Google est nécessaire pour publier un avis.</p>}
        </div>

        <div className="lg:col-span-8">
          {reviews.length > 0 ? (
            <Cascade className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              {reviews.map((review, i) => <CascadeItem key={review.id} className={i === 0 && reviews.length % 2 === 1 ? 'sm:col-span-2' : ''}><ReviewCard review={review} /></CascadeItem>)}
            </Cascade>
          ) : (
            <Appear className="rounded-soft-lg border border-dashed border-wood-deep/20 bg-off-white/60 p-8 sm:p-12 text-center">
              <Stars value={5} className="h-7 w-7" />
              <p className="mt-5 font-serif text-2xl sm:text-3xl text-wood-deep">Votre avis compte beaucoup pour l’atelier</p>
              <p className="mx-auto mt-3 max-w-md text-wood-deep/65 leading-relaxed">Une création vous a touché ? Racontez-le en quelques mots sur Google : c’est le plus beau des encouragements pour Isabelle.</p>
              {reviewUrl && <><a href={reviewUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-7 px-6 py-3.5"><GoogleMark className="h-4 w-4 rounded-full bg-off-white p-[1px]" />Laisser un avis sur Google</a><p className="mt-3 text-xs text-wood-deep/50">S’ouvre dans un nouvel onglet ; un compte Google est nécessaire.</p></>}
            </Appear>
          )}
        </div>
      </div>
    </section>
  );
}
