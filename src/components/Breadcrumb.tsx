import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-wood-deep/60">
        <li>
          <Link
            to="/"
            className="inline-flex items-center gap-1 hover:text-terracotta transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Accueil</span>
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-wood-deep/30" />
              {item.path && !isLast ? (
                <Link to={item.path} className="hover:text-terracotta transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'text-wood-deep font-medium' : ''}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
