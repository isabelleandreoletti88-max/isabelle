import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: string;
  /** Données structurées Schema.org injectées dans une balise script. */
  jsonLd?: Record<string, unknown>;
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

export default function SEO({ title, description, image, type = 'website', jsonLd }: SEOProps) {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : '';
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
    if (image) {
      setMeta('property', 'og:image', image);
      setMeta('name', 'twitter:image', image);
    }

    let script: HTMLScriptElement | null = null;
    if (jsonLdString) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = jsonLdString;
      document.head.appendChild(script);
    }

    return () => {
      if (script) document.head.removeChild(script);
    };
  }, [title, description, image, type, jsonLdString]);

  return null;
}
