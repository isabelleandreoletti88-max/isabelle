import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_URL, absoluteUrl } from '@/lib/seo';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: string;
  /** Données structurées Schema.org injectées dans une balise script. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Chemin canonique ; par défaut la page courante, sans paramètres. */
  canonicalPath?: string;
  /** Exclut la page des moteurs de recherche (404, administration…). */
  noindex?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

export default function SEO({ title, description, image, type = 'website', jsonLd, canonicalPath, noindex = false }: SEOProps) {
  const { pathname } = useLocation();
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : '';
  const canonicalTarget = canonicalPath ?? pathname;
  const canonical = `${SITE_URL}${canonicalTarget === '/' ? '/' : canonicalTarget.replace(/\/$/, '')}`;
  useEffect(() => {
    document.title = title;
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    setMeta('property', 'og:title', title);
    setMeta('name', 'twitter:title', title);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', canonical);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setCanonical(canonical);
    if (image) {
      setMeta('property', 'og:image', absoluteUrl(image));
      setMeta('name', 'twitter:image', absoluteUrl(image));
    }

    // Les pages pré-générées contiennent déjà ces scripts : on les remplace au lieu de les dupliquer.
    document.head.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
    if (jsonLdString) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoJsonld = '';
      script.text = jsonLdString;
      document.head.appendChild(script);
    }
  }, [title, description, image, type, jsonLdString, canonical, noindex]);

  return null;
}
