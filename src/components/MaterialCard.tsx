import type { MaterialInfo } from '@/types';

export default function MaterialCard({ material }: { material: MaterialInfo }) {
  return (
    <div className="card overflow-hidden p-0 text-center hover:-translate-y-1 hover:shadow-[0_12px_40px_-10px_rgba(45,27,14,0.25)] transition-all duration-300">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={material.image}
          alt={material.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-medium text-wood-deep mb-2">{material.name}</h3>
        <p className="text-sm text-wood-deep/60 leading-relaxed">{material.description}</p>
      </div>
    </div>
  );
}
