import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Creation } from '@/types';
import ProductCard from './ProductCard';

/**
 * Grille des créations. Quand un filtre change, les créations restantes glissent
 * vers leur nouvelle place et les autres s'effacent : on voit ce que le filtre a fait.
 */
export default function ProductGrid({ creations }: { creations: Creation[] }) {
  const reduce = useReducedMotion();
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:gap-x-8">
      <AnimatePresence initial={false} mode="popLayout">
        {creations.map((c) => (
          <motion.div
            key={c.id}
            layout={reduce ? false : 'position'}
            initial={mounted.current ? { opacity: 0, scale: reduce ? 1 : 0.97 } : false}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.97, transition: { duration: 0.18 } }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProductCard creation={c} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
