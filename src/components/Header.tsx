import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { siteConfig, mainNav } from '@/config/site';
import { useSiteImages } from '@/lib/siteImages';

export default function Header() {
  const { images } = useSiteImages();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function openCollections() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }
  function scheduleCloseCollections() {
    closeTimer.current = setTimeout(() => setMobileOpen(false), 200);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/boutique?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-cream/95 backdrop-blur-md shadow-soft' : 'bg-gradient-to-b from-cream/95 to-cream/80 backdrop-blur-sm'}`}>
      <div className="container-page">
        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-14 sm:h-16 lg:h-20' : 'h-16 sm:h-24 lg:h-28'}`}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Accueil">
            <img src={images.header_logo} alt={`Logo ${siteConfig.name}`} className={`w-auto object-contain transition-all duration-300 ${scrolled ? 'h-10 sm:h-12 lg:h-16' : 'h-16 sm:h-24 lg:h-28'}`} loading="eager" />
            <span className="sr-only">{siteConfig.name}</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Navigation principale">
            {mainNav.map((item) => (
              <Link key={item.path} to={item.path} className={`nav-link px-3.5 py-2 rounded-soft text-sm font-medium transition-colors ${isActive(item.path) ? 'text-terracotta' : 'text-wood-deep hover:text-terracotta'}`} aria-current={isActive(item.path) ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden lg:flex items-center gap-1">
            <button onClick={() => setSearchOpen((v) => !v)} className="p-2.5 rounded-soft text-wood-deep hover:text-terracotta hover:bg-sand/20 transition-colors" aria-label="Rechercher">
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Burger mobile */}
          <div className="flex lg:hidden items-center gap-1">
            <button onClick={() => setSearchOpen((v) => !v)} className="h-11 w-11 inline-flex items-center justify-center text-wood-deep hover:text-terracotta transition-colors" aria-label="Rechercher">
              <Search className="h-5 w-5" />
            </button>
            <button className="h-11 w-11 -mr-2 inline-flex items-center justify-center text-wood-deep hover:text-terracotta transition-colors" onClick={() => setMobileOpen((v) => !v)} aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileOpen} aria-controls="mobile-menu">
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-cream/98 backdrop-blur-md shadow-soft animate-slide-down z-40 border-b border-honey/10">
          <div className="container-page py-4">
            <form onSubmit={submitSearch} className="flex gap-2">
              <input autoFocus type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher une création, une matière, une saison…" className="input-field flex-1" />
              <button type="submit" className="btn-primary"><Search className="h-4 w-4" /> Rechercher</button>
              <button type="button" onClick={() => setSearchOpen(false)} className="btn-secondary">Annuler</button>
            </form>
          </div>
        </div>
      )}

      {/* Menu mobile */}
      {mobileOpen && (
        <div id="mobile-menu" className="lg:hidden fixed inset-0 top-14 sm:top-24 z-40 bg-gradient-to-b from-cream to-cream-warm animate-fade-in-fast overflow-y-auto">
          <nav className="container-page pt-4 pb-8 flex flex-col gap-1" aria-label="Navigation mobile">
            {mainNav.map((item) => (
              <Link key={item.path} to={item.path} className={`px-4 py-3.5 rounded-soft text-base font-medium transition-colors ${isActive(item.path) ? 'bg-terracotta/10 text-terracotta' : 'text-wood-deep hover:bg-sand/30'}`} aria-current={isActive(item.path) ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
