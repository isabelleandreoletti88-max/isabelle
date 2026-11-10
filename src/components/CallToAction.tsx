import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { RisingTitle } from '@/components/motion';

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
    <section className="container-page py-16 lg:py-24">
      <div className="relative overflow-hidden rounded-soft-xl bg-wood-deep text-cream px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
        <div className="pointer-events-none absolute -right-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,rgba(201,95,58,0.45),transparent)]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,rgba(216,136,32,0.28),transparent)]" aria-hidden="true" />
        <div className="relative grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <RisingTitle text={title} className="font-serif font-normal text-cream text-[2.1rem] leading-[1.05] sm:text-5xl lg:text-6xl tracking-[-0.015em]" />
            {text && <p className="mt-5 max-w-xl text-base sm:text-lg text-cream/80 leading-relaxed">{text}</p>}
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:justify-end gap-3">
            <Link to={primaryTo} className="btn-primary px-7 py-3.5 text-base group w-full sm:w-auto">
              {primaryLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            {secondaryLabel && secondaryTo && (
              <Link to={secondaryTo} className="btn-outline px-7 py-3.5 text-base w-full sm:w-auto">
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
