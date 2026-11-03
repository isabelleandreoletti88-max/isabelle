import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const next = () => setActive((i) => (i + 1) % images.length);
  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);

  return (
    <>
      <div className="space-y-3">
        {/* Image principale */}
        <button
          onClick={() => setLightbox(true)}
          className="block w-full rounded-soft overflow-hidden bg-beige/30 group relative"
          aria-label="Agrandir l'image"
        >
          <div className="aspect-square">
            <img
              src={images[active]}
              alt={alt}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <span className="absolute top-3 right-3 p-2 rounded-full bg-off-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-4 w-4 text-wood-deep" />
          </span>
        </button>

        {/* Miniatures */}
        {images.length > 1 && (
          <div className="flex gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-16 h-16 rounded-soft overflow-hidden border-2 transition-colors ${
                  active === i ? 'border-terracotta' : 'border-transparent hover:border-wood-deep/20'
                }`}
                aria-label={`Image ${i + 1}`}
              >
                <img src={img} alt={`${alt} — vue ${i + 1}`} className="w-full h-full object-cover" />
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
