import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin, Clock, Heart, Lock } from 'lucide-react';
import { siteConfig, mainNav } from '@/config/site';
import { useSiteSettings } from '@/lib/siteData';
import { useSiteImages } from '@/lib/siteImages';

export default function Footer() {
  const settings = useSiteSettings();
  const { images } = useSiteImages();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-wood-deep to-wood-darker text-cream/90 mt-20 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 rounded-pill bg-gradient-to-r from-transparent via-honey to-transparent" aria-hidden="true" />
      <div className="container-page py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Marque */}
          <div className="lg:col-span-1">
            <img
              src={images.logo}
              alt={`Logo ${siteConfig.name}`}
              className="h-12 w-auto mb-4 brightness-0 invert"
            />
            <p className="font-script text-xl text-honey-light mb-2">{settings.slogan}</p>
            <p className="text-sm text-cream/70 leading-relaxed">
              {settings.footer_text}
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Navigation pied de page">
            <p className="text-sm font-semibold uppercase tracking-wider text-honey-light mb-4">
              Navigation
            </p>
            <ul className="space-y-2.5">
              {mainNav.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="text-sm text-cream/70 hover:text-terracotta transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-honey-light mb-4">
              Contact
            </p>
            <ul className="space-y-3 text-sm text-cream/70">
              {settings.phone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-honey-light" />
                  <a href={`tel:${settings.phone}`} className="hover:text-terracotta transition-colors">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.email && (
                <li className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-honey-light" />
                  <a
                    href={`mailto:${settings.email}`}
                    className="hover:text-terracotta transition-colors break-all"
                  >
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.city && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-honey-light" />
                  <span>{settings.city}</span>
                </li>
              )}
              {settings.hours && (
                <li className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0 text-honey-light" />
                  <span>{settings.hours}</span>
                </li>
              )}
              {!settings.email && !settings.phone && (
                <li className="text-cream/50 italic">Coordonnées à compléter</li>
              )}
            </ul>

            {/* Réseaux sociaux */}
            {(settings.facebook || settings.instagram) && (
              <div className="flex gap-3 mt-4">
                {settings.facebook && (
                  <a
                    href={settings.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="p-2 rounded-soft bg-cream/10 hover:bg-terracotta transition-colors"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {settings.instagram && (
                  <a
                    href={settings.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="p-2 rounded-soft bg-cream/10 hover:bg-terracotta transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Pages légales */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-honey-light mb-4">
              Informations légales
            </p>
            <ul className="space-y-2.5">
              <li><Link to="/informations-legales" className="text-sm text-cream/70 hover:text-terracotta transition-colors">Informations légales</Link></li>
              <li><Link to="/mentions-legales" className="text-sm text-cream/70 hover:text-terracotta transition-colors">Mentions légales</Link></li>
              <li><Link to="/politique-confidentialite" className="text-sm text-cream/70 hover:text-terracotta transition-colors">Confidentialité</Link></li>
              <li><Link to="/conditions-utilisation" className="text-sm text-cream/70 hover:text-terracotta transition-colors">Conditions d’utilisation</Link></li>
              <li><Link to="/gestion-des-cookies" className="text-sm text-cream/70 hover:text-terracotta transition-colors">Gérer mes cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream/50">
          <p>
            © {year} {siteConfig.name}.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-1.5 hover:text-terracotta transition-colors">
              <Lock className="h-3 w-3" /> Espace privé
            </Link>
            <p className="flex items-center gap-1.5">
              Fait main avec <Heart className="h-3 w-3 fill-honey text-honey" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
