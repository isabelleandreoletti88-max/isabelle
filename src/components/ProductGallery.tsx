import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { thumbUrl } from '@/lib/seo';

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const next = () => setActive((i) => (i + 1) % images.length);
  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, images.length]);

  return (
    <>
      <div className="space-y-3">
        {/* Image principale */}
        <button
          onClick={() => setLightbox(true)}
          className="block w-full rounded-soft-lg overflow-hidden bg-sand-light group relative shadow-card cursor-zoom-in"
          aria-label="Agrandir l'image"
        >
          <div
            className="relative aspect-square"
            onPointerMove={(e) => {
              if (e.pointerType !== 'mouse') return;
              const box = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--zx', `${((e.clientX - box.left) / box.width) * 100}%`);
              e.currentTarget.style.setProperty('--zy', `${((e.clientY - box.top) / box.height) * 100}%`);
            }}
          >
            <AnimatePresence initial={false}>
              <motion.img
                key={images[active]}
                src={images[active]}
                alt={alt}
                className="absolute inset-0 w-full h-full object-cover [transform-origin:var(--zx,50%)_var(--zy,50%)] transition-transform duration-500 ease-out lg:group-hover:scale-[1.6] motion-reduce:lg:group-hover:scale-100"
                loading="eager"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            </AnimatePresence>
          </div>
          <span className="absolute top-3 right-3 p-2.5 rounded-full bg-off-white/95 shadow-soft opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
            <ZoomIn className="h-4 w-4 text-wood-deep" />
          </span>
        </button>

        {/* Miniatures */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-soft overflow-hidden ring-offset-2 ring-offset-cream transition-all ${
                  active === i ? 'ring-2 ring-terracotta' : 'opacity-70 hover:opacity-100'
                }`}
                aria-label={`Afficher la vue ${i + 1}`}
                aria-current={active === i}
              >
                <img src={thumbUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-wood-deep/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-fast"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu agrandi"
        >
          <button
            className="absolute top-4 right-4 p-2 text-cream hover:text-terracotta transition-colors"
            onClick={() => setLightbox(false)}
            aria-label="Fermer"
          >
            <X className="h-7 w-7" />
          </button>
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 p-2 text-cream hover:text-terracotta transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                className="absolute right-4 p-2 text-cream hover:text-terracotta transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Image suivante"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}
          <img
            src={images[active]}
            alt={alt}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-soft"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
