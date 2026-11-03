import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Creation } from '@/types';
import { materialLabels, seasonLabels } from '@/config/catalog';
import { thumbUrl } from '@/lib/seo';

const badgeStyles: Record<string, string> = {
  personnalisable: 'badge-terracotta',
  'piece-unique': 'badge-sage',
  nouveaute: 'badge-wood',
  'petite-serie': 'badge-sage',
};

const badgeLabels: Record<string, string> = {
  personnalisable: 'Personnalisable',
  'piece-unique': 'Pièce unique',
  nouveaute: 'Nouveauté',
  'petite-serie': 'Petite série',
};

export default function ProductCard({ creation }: { creation: Creation }) {
  return (
    <article className="card group flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_40px_-10px_rgba(45,27,14,0.25)] border border-honey/15">
      <Link to={`/creations/${creation.slug}`} className="block relative overflow-hidden">
        <div className="aspect-square overflow-hidden bg-gradient-to-br from-sand/30 to-honey/20">
          <img
            src={thumbUrl(creation.mainImage)}
            alt={creation.mainImageAlt}
            width={640}
            height={640}
            loading="lazy"
            decoding="async"
            onError={(e) => { if (e.currentTarget.src !== creation.mainImage) e.currentTarget.src = creation.mainImage; }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        {/* Badges */}
        {creation.badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {creation.badges.map((b) => (
              <span key={b} className={badgeStyles[b]}>
                {badgeLabels[b]}
              </span>
            ))}
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-lg font-medium text-wood-deep leading-snug">
            <Link to={`/creations/${creation.slug}`} className="hover:text-terracotta transition-colors">
              {creation.name}
            </Link>
          </h3>
        </div>

        <p className="text-sm text-wood-deep/60 leading-relaxed mb-3 line-clamp-2">
          {creation.shortDescription}
        </p>

        {/* Matériaux */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {creation.materials.map((m) => (
            <span key={m} className="text-xs text-wood-deep/50">
              {materialLabels[m]}
            </span>
          ))}
          {creation.seasons.length > 0 && (
            <span className="text-xs text-sage-dark">
              · {creation.seasons.map((s) => seasonLabels[s]).join(', ')}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-lg font-medium text-wood-deep">
            {creation.price !== null ? (
              <>
                {creation.priceFrom && <span className="text-sm text-wood-deep/50">À partir de </span>}
                {creation.price} €
              </>
            ) : (
              <span className="text-sm text-wood-deep/50">Sur demande</span>
            )}
          </span>
          <Link
            to={`/creations/${creation.slug}`}
            className="btn-ghost text-sm group/btn"
            aria-label={`Voir la création ${creation.name}`}
          >
            Voir la création
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
