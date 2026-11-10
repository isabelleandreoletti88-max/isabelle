import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { seasons } from '@/config/catalog';
import { usePublicCategories, usePublicCreations } from '@/lib/publicCatalog';
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/structuredData';
import { metaDescription } from '@/lib/seo';
import { useSiteTexts } from '@/lib/siteData';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import SectionTitle from '@/components/SectionTitle';
import ProductGrid from '@/components/ProductGrid';
import ProductFilters, { type FilterState } from '@/components/ProductFilters';
import CallToAction from '@/components/CallToAction';

export function BoutiquePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug: collectionSlug } = useParams();
  const params = new URLSearchParams(location.search);
  // La catégorie vient de l'adresse : chaque collection a sa propre page (/collections/…), indexable.
  const category = (collectionSlug || 'all') as FilterState['category'];
  const [localFilters, setLocalFilters] = useState<FilterState>({
    query: params.get('q') || '',
    category,
    customizableOnly: false,
    sort: 'newest',
  });
  const { creations, loading, error } = usePublicCreations();
  const { categories } = usePublicCategories();
  const text = useSiteTexts();
  const activeCategory = category === 'all' ? undefined : categories.find((cat) => cat.slug === category);

  const filters: FilterState = useMemo(() => ({ ...localFilters, category }), [localFilters, category]);
  function setFilters(next: FilterState) {
    setLocalFilters(next);
    if (next.category !== category) navigate(next.category === 'all' ? '/boutique' : `/collections/${next.category}`);
  }

  // Anciens liens /boutique?categorie=… : redirection vers la page de la collection.
  const season = seasons.find((item) => item.slug === params.get('saison'));
  const legacyCategory = params.get('categorie');
  useEffect(() => {
    if (legacyCategory && !collectionSlug) navigate(`/collections/${legacyCategory}`, { replace: true });
  }, [legacyCategory, collectionSlug, navigate]);

  const availableCategorySlugs = useMemo(
    () => new Set(creations.map((c) => c.category)),
    [creations]
  );

  // Tant qu'aucune création n'est rattachée à la saison demandée, on montre toute la boutique.
  const seasonHasItems = Boolean(season) && creations.some((c) => c.seasons.includes(season!.slug));
  const filtered = useMemo(() => {
    const result = creations.filter((c) => {
      const q = filters.query.toLowerCase();
      return (!q || `${c.name} ${c.shortDescription} ${c.materials.join(' ')}`.toLowerCase().includes(q))
        && (filters.category === 'all' || c.category === filters.category)
        && (!filters.customizableOnly || c.customizable)
        && (!seasonHasItems || c.seasons.includes(season!.slug));
    });
    return [...result].sort((a, b) =>
      filters.sort === 'price-asc' ? (a.price ?? 999) - (b.price ?? 999)
      : filters.sort === 'price-desc' ? (b.price ?? 0) - (a.price ?? 0)
      : Number(b.featured) - Number(a.featured)
    );
  }, [filters, creations, season, seasonHasItems]);

  return (
    <>
      {activeCategory ? (
        <SEO
          title={`${activeCategory.name.trim()} – Cadeaux faits main dans les Vosges | L'Atelier d'Isabelle`}
          description={metaDescription(`${activeCategory.description} Créations « ${activeCategory.name.trim()} » faites main dans les Vosges par L'Atelier d'Isabelle, personnalisables.`)}
          canonicalPath={`/collections/${activeCategory.slug}`}
          jsonLd={[breadcrumbJsonLd([{ name: 'La boutique', path: '/boutique' }, { name: activeCategory.name, path: `/collections/${activeCategory.slug}` }]), itemListJsonLd(activeCategory.name, filtered)]}
        />
      ) : (
        <SEO
          title="Boutique – Décorations et cadeaux faits main dans les Vosges | L'Atelier d'Isabelle"
          description="Idées cadeaux et décorations faites main dans les Vosges : cadres en galets, papier, bois et fil de fer, personnalisables, pour une naissance, la famille ou l'amitié."
          canonicalPath="/boutique"
          jsonLd={[breadcrumbJsonLd([{ name: 'La boutique', path: '/boutique' }]), itemListJsonLd('La boutique', filtered)]}
        />
      )}
      <main className="pt-28 lg:pt-36">
        <div className="container-page">
          <Breadcrumb items={activeCategory ? [{ label: 'La boutique', path: '/boutique' }, { label: activeCategory.name }] : [{ label: 'La boutique' }]} />
          <SectionTitle
            as="h1"
            eyebrow={activeCategory ? 'Collection' : 'La boutique'}
            title={activeCategory ? activeCategory.name.trim() : text('boutique.entete.titre')}
            subtitle={activeCategory?.description || text('boutique.entete.texte')}
          />
          <div className="mt-12">
            {loading && <p className="mb-6 text-sm text-wood-deep/60">Chargement des créations…</p>}
            {error && <p className="mb-6 text-sm text-red-700">{error}</p>}
            <ProductFilters filters={filters} onChange={setFilters} resultCount={filtered.length} totalCount={creations.length} availableCategorySlugs={availableCategorySlugs} />
            {season && !seasonHasItems && !loading && <p className="mb-6 text-wood-deep/70">Les créations « {season.name} » arrivent bientôt. En attendant, voici toutes les créations de l’atelier.</p>}
            {season && seasonHasItems && <p className="mb-6"><Link to="/boutique" className="inline-flex items-center gap-2 min-h-[40px] rounded-pill bg-wood-deep text-off-white pl-4 pr-3 text-sm font-medium hover:bg-terracotta transition-colors">Saison : {season.name} <X className="h-4 w-4" aria-label="Retirer le filtre" /></Link></p>}
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
