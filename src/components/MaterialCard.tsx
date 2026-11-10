import type { MaterialInfo } from '@/types';

export default function MaterialCard({ material }: { material: MaterialInfo }) {
  return (
    <div className="group">
      <div className="overflow-hidden rounded-t-[10rem] rounded-b-soft-lg aspect-[3/4] bg-sand-light shadow-soft">
        <img
          src={material.image}
          alt={material.name}
          className="w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          loading="lazy"
        />
      </div>
      <h3 className="mt-5 font-serif text-2xl text-wood-deep">{material.name}</h3>
      <p className="mt-2 text-sm text-wood-deep/65 leading-relaxed">{material.description}</p>
    </div>
  );
}
