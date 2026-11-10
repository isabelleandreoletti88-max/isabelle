import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Creation } from '@/types';
import { materialLabels, seasonLabels } from '@/config/catalog';
import { formatPrice } from '@/lib/seo';
import { thumbUrl } from '@/lib/seo';

const badgeLabels: Record<string, string> = {
  personnalisable: 'Personnalisable',
  'piece-unique': 'Pièce unique',
  nouveaute: 'Nouveauté',
  'petite-serie': 'Petite série',
};

const badgeDots: Record<string, string> = {
  personnalisable: 'bg-terracotta',
  'piece-unique': 'bg-sage-dark',
  nouveaute: 'bg-honey',
  'petite-serie': 'bg-sage',
};

export default function ProductCard({ creation, compact = false }: { creation: Creation; compact?: boolean }) {
  const badge = creation.badges[0];
  // La seconde photo n'est chargée qu'au premier survol.
  const second = creation.gallery.find((img) => img !== creation.mainImage);
  const [hovered, setHovered] = useState(false);
  return (
    <article className="group relative flex h-full flex-col" onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(true); }}>
      <div className="relative aspect-square overflow-hidden rounded-soft-lg bg-sand-light shadow-soft transition-shadow duration-500 group-hover:shadow-card-hover">
        <img
          src={thumbUrl(creation.mainImage)}
          alt={creation.mainImageAlt}
          width={640}
          height={640}
          loading="lazy"
          decoding="async"
          onError={(e) => { if (e.currentTarget.src !== creation.mainImage) e.currentTarget.src = creation.mainImage; }}
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
        {second && hovered && (
          <img src={thumbUrl(second)} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        )}
        <span className="pointer-events-none absolute bottom-3 right-3 hidden lg:inline-flex h-11 w-11 items-center justify-center rounded-full bg-off-white text-wood-deep shadow-card opacity-0 translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:translate-y-0" aria-hidden="true">
          <ArrowUpRight className="h-5 w-5" />
        </span>
        {badge && (
          <span className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 inline-flex items-center gap-1.5 rounded-pill bg-off-white/95 px-2.5 py-1 text-[0.7rem] sm:text-xs font-medium text-wood-deep shadow-soft">
            <span className={`h-1.5 w-1.5 rounded-full ${badgeDots[badge] || 'bg-terracotta'}`} aria-hidden="true" />
            {badgeLabels[badge]}
          </span>
        )}
        {creation.availability === 'sold' && (
          <span className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 rounded-pill bg-wood-deep/85 px-2.5 py-1 text-[0.7rem] sm:text-xs font-medium text-off-white">Vendue</span>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-3 sm:pt-4">
        <h3 className="font-serif text-[1.05rem] sm:text-xl leading-snug text-wood-deep">
          {/* Le lien couvre toute la carte (pseudo-élément) : une seule cible, nom lisible par les lecteurs d'écran. */}
          <Link to={`/creations/${creation.slug}`} className="after:absolute after:inset-0 after:content-[''] after:rounded-soft-lg group-hover:text-terracotta transition-colors focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-terracotta">
            {creation.name}
          </Link>
        </h3>
        {!compact && (
          <p className="mt-1 hidden sm:block text-sm text-wood-deep/60 leading-relaxed">
            <span className="line-clamp-2">{creation.shortDescription}</span>
          </p>
        )}
        <div className="mt-auto flex items-baseline justify-between gap-3 pt-2 sm:pt-3">
          <span className="text-[0.95rem] sm:text-base font-medium text-wood-deep tabular-nums">
            {creation.price !== null ? (
              <>
                {creation.priceFrom && <span className="text-xs sm:text-sm font-normal text-wood-deep/55">dès </span>}
                {formatPrice(creation.price)}
              </>
            ) : (
              <span className="text-sm font-normal text-wood-deep/55">Prix sur demande</span>
            )}
          </span>
          <span className="hidden sm:inline text-xs text-wood-deep/50 truncate">
            {creation.materials.map((m) => materialLabels[m] || m).join(' · ')}
            {creation.seasons.length > 0 && ` · ${creation.seasons.map((s) => seasonLabels[s]).join(', ')}`}
          </span>
        </div>
      </div>
    </article>
  );
}
