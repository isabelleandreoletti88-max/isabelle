import type { Creation } from '@/types';
import ProductCard from './ProductCard';

export default function ProductGrid({ creations }: { creations: Creation[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
      {creations.map((c) => (
        <ProductCard key={c.id} creation={c} />
      ))}
    </div>
  );
}
