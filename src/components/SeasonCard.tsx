import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { SeasonInfo } from '@/types';
import { useSeasonImages } from '@/lib/siteImages';

export default function SeasonCard({ season }: { season: SeasonInfo }) {
  const { seasonImages } = useSeasonImages();
  const image = seasonImages[season.slug] || season.image;
  return (
    <Link
      to={`/creations?saison=${season.slug}`}
      className="card group block hover:-translate-y-1 hover:shadow-[0_12px_40px_-10px_rgba(45,27,14,0.25)]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-sand/30">
        <img
          src={image}
          alt={season.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-medium text-wood-deep mb-1.5">{season.name}</h3>
        <p className="text-sm text-wood-deep/60 leading-relaxed mb-3">{season.description}</p>
        <span className="inline-flex items-center gap-1.5 text-sm text-terracotta font-medium">
          Voir les créations
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
