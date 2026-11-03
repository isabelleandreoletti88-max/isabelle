import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { CategorySlug } from '@/types';
import { usePublicCategories } from '@/lib/publicCatalog';

export interface FilterState {
  query: string;
  category: CategorySlug | 'all';
  customizableOnly: boolean;
  sort: 'price-asc' | 'price-desc' | 'newest';
}

interface ProductFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
  totalCount: number;
  availableCategorySlugs?: Set<string>;
}

export default function ProductFilters({
  filters,
  onChange,
  resultCount,
  totalCount,
  availableCategorySlugs,
}: ProductFiltersProps) {
  const { categories } = usePublicCategories();
  const visibleCategories = availableCategorySlugs
    ? categories.filter((cat) => availableCategorySlugs.has(cat.slug))
    : categories;
  const hasActiveFilters =
    filters.query !== '' ||
    filters.category !== 'all' ||
    filters.customizableOnly ||
    filters.sort !== 'newest';

  const reset = () => {
    onChange({
      query: '',
      category: 'all',
      customizableOnly: false,
      sort: 'newest',
    });
  };

  return (
    <div className="mb-8 space-y-4">
      {/* Recherche + tri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wood-deep/40" />
          <label htmlFor="search" className="sr-only">
            Rechercher une création
          </label>
          <input
            id="search"
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Rechercher une création…"
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-wood-deep/40 shrink-0" />
          <label htmlFor="sort" className="sr-only">
            Trier les créations
          </label>
          <select
            id="sort"
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as FilterState['sort'] })}
            className="input-field w-auto"
          >
            <option value="newest">Nouveautés</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => onChange({ ...filters, category: 'all' })}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filters.category === 'all'
              ? 'bg-terracotta text-off-white'
              : 'bg-beige/40 text-wood-deep hover:bg-beige/70'
          }`}
        >
          Toutes
        </button>
        {visibleCategories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => onChange({ ...filters, category: cat.slug })}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filters.category === cat.slug
                ? 'bg-terracotta text-off-white'
                : 'bg-beige/40 text-wood-deep hover:bg-beige/70'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Personnalisable */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <label className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-beige/40 text-wood-deep cursor-pointer hover:bg-beige/70 transition-colors">
          <input
            type="checkbox"
            checked={filters.customizableOnly}
            onChange={(e) => onChange({ ...filters, customizableOnly: e.target.checked })}
            className="h-3.5 w-3.5 accent-terracotta"
          />
          Personnalisable
        </label>
      </div>

      {/* Compteur + reset */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-wood-deep/60" aria-live="polite">
          {resultCount} création{resultCount > 1 ? 's' : ''} sur {totalCount}
        </p>
        {hasActiveFilters && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-sm text-terracotta hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Réinitialiser les filtres
          </button>
        )}
      </div>
    </div>
  );
}
