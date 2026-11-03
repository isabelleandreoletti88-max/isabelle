import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface CallToActionProps {
  title: string;
  text?: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}

export default function CallToAction({
  title,
  text,
  primaryLabel = 'Contacter Isabelle',
  primaryTo = '/contact',
  secondaryLabel,
  secondaryTo,
}: CallToActionProps) {
  return (
    <section className="container-page py-16 lg:py-20">
      <div className="rounded-soft-xl bg-gradient-to-br from-wood-deep via-wood to-wood-darker text-cream text-center px-6 py-14 lg:py-20 relative overflow-hidden">
        {/* Lueurs chaudes */}
        <div className="absolute inset-0 opacity-40" aria-hidden="true">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-terracotta blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-honey blur-3xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-rust blur-3xl opacity-50" />
        </div>
        {/* Trait doré */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 rounded-pill bg-gradient-to-r from-transparent via-honey to-transparent" aria-hidden="true" />

        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-cream mb-4">{title}</h2>
          {text && <p className="text-cream/80 leading-relaxed mb-8">{text}</p>}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={primaryTo} className="btn-primary w-full sm:w-auto">
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {secondaryLabel && secondaryTo && (
              <Link to={secondaryTo} className="btn-outline w-full sm:w-auto">
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
