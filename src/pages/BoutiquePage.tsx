import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { usePublicCreations } from '@/lib/publicCatalog';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import SectionTitle from '@/components/SectionTitle';
import ProductGrid from '@/components/ProductGrid';
import ProductFilters, { type FilterState } from '@/components/ProductFilters';
import CallToAction from '@/components/CallToAction';
import { siteConfig } from '@/config/site';

export function BoutiquePage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [filters, setFilters] = useState<FilterState>({
    query: params.get('q') || '',
    category: (params.get('categorie') as FilterState['category']) || 'all',
    customizableOnly: false,
    sort: 'newest',
  });
  const { creations, loading, error } = usePublicCreations();

  const availableCategorySlugs = useMemo(
    () => new Set(creations.map((c) => c.category)),
    [creations]
  );

  const filtered = useMemo(() => {
    const result = creations.filter((c) => {
      const q = filters.query.toLowerCase();
      return (!q || `${c.name} ${c.shortDescription} ${c.materials.join(' ')}`.toLowerCase().includes(q))
        && (filters.category === 'all' || c.category === filters.category)
        && (!filters.customizableOnly || c.customizable);
    });
    return [...result].sort((a, b) =>
      filters.sort === 'price-asc' ? (a.price ?? 999) - (b.price ?? 999)
      : filters.sort === 'price-desc' ? (b.price ?? 0) - (a.price ?? 0)
      : Number(b.featured) - Number(a.featured)
    );
  }, [filters, creations]);

  return (
    <>
      <SEO title="La boutique — L'Atelier d'Isabelle" description="Découvrez toutes les créations artisanales disponibles à la vente." />
      <main className="pt-28 lg:pt-36">
        <div className="container-page">
          <Breadcrumb items={[{ label: 'La boutique' }]} />
          <SectionTitle
            eyebrow="La boutique"
            title="Les créations de l'atelier"
            subtitle="Chaque pièce est réalisée à la main, en petite quantité. Trouvez celle qui vous ressemble ou offrez-la à quelqu'un que vous aimez."
          />
          <div className="mt-12">
            {loading && <p className="mb-6 text-sm text-wood-deep/60">Chargement des créations…</p>}
            {error && <p className="mb-6 text-sm text-red-700">{error}</p>}
            <ProductFilters filters={filters} onChange={setFilters} resultCount={filtered.length} totalCount={creations.length} availableCategorySlugs={availableCategorySlugs} />
            {filtered.length ? (
              <ProductGrid creations={filtered} />
            ) : (
              <div className="text-center py-16 rounded-soft-lg bg-off-white">
                <Sparkles className="h-10 w-10 text-terracotta mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-medium">Aucune création ne correspond</h2>
                <p className="mt-2 text-wood-deep/60">Essayez d'élargir votre recherche ou de réinitialiser les filtres.</p>
              </div>
            )}
          </div>
        </div>
        <CallToAction
          title="Vous avez une idée en tête ?"
          text="Isabelle peut imaginer une création spécialement pour vous."
          primaryLabel="Parler de mon projet"
          primaryTo="/personnalisation"
        />
      </main>
    </>
  );
}
