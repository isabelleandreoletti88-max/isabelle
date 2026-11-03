import { useEffect, useState } from 'react';
import { fetchPublicProducts, fetchCategories } from '@/lib/catalogService';
import type { Category, Creation, Material, Season } from '@/types';

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  price: number | null;
  price_from: boolean;
  categories: { slug: string; name: string } | null;
  previous_slug: string | null;
  seo_title: string;
  seo_description: string;
  created_at: string;
  updated_at: string;
  stripe_payment_link_url: string | null;
  materials: string[];
  dimensions: string;
  colors: string[];
  personalizable: boolean;
  availability_status: string;
  product_images: { public_url: string; alt_text: string; display_order: number; is_main: boolean }[];
  production_time: string;
  maintenance_advice: string;
  featured: boolean;
};

function toSeason(slug: string): Season | null {
  return ['printemps', 'ete', 'automne', 'hiver'].includes(slug) ? slug as Season : null;
}

function toMaterial(value: string): Material {
  return value as Material;
}

function mapProduct(row: ProductRow): Creation {
  const images = [...(row.product_images || [])].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.display_order - b.display_order);
  const seasons = ((row as ProductRow & { product_seasons?: { seasons: { slug: string } | null }[] }).product_seasons || [])
    .map((item) => item.seasons?.slug ? toSeason(item.seasons.slug) : null).filter((item): item is Season => item !== null);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    fullDescription: row.description,
    price: row.price,
    priceFrom: row.price_from,
    category: (row.categories?.slug || 'cadeaux-personnalises') as Creation['category'],
    seasons,
    materials: row.materials.map(toMaterial),
    dimensions: row.dimensions,
    colors: row.colors,
    customizable: row.personalizable,
    availability: row.availability_status,
    mainImage: images[0]?.public_url || '/creation-artisanale-atelier-isabelle.webp',
    mainImageAlt: images[0]?.alt_text || row.name,
    categoryName: row.categories?.name?.trim() || '',
    previousSlug: row.previous_slug,
    seoTitle: row.seo_title || '',
    seoDescription: row.seo_description || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    buyUrl: row.stripe_payment_link_url,
    gallery: images.length ? images.map((image) => image.public_url) : ['/creation-artisanale-atelier-isabelle.webp'],
    leadTime: row.production_time,
    careInstructions: row.maintenance_advice,
    featured: row.featured,
    badges: [row.personalizable ? 'personnalisable' : null, row.availability_status === 'sold' ? 'piece-unique' : null].filter((badge): badge is 'personnalisable' | 'piece-unique' => badge !== null),
  };
}

export function usePublicCreations() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetchPublicProducts().then((rows) => { if (active) setCreations((rows as ProductRow[]).map(mapProduct)); }).catch(() => { if (active) setError('Les créations ne sont pas disponibles pour le moment.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { creations, loading, error };
}

type CategoryRow = { id: string; name: string; slug: string; description: string; image_url: string | null; published: boolean; display_order: number };

export function usePublicCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetchCategories().then((rows) => {
      if (!active) return;
      setCategories((rows as CategoryRow[]).map((r) => ({ slug: r.slug as Category['slug'], name: r.name, description: r.description, emoji: '✨' })));
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { categories, loading };
}
