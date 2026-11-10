import { RisingTitle } from '@/components/motion';

interface SectionTitleProps {
  /** Conservé pour compatibilité ; n'est plus affiché. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  as?: 'h1' | 'h2' | 'h3';
}

export default function SectionTitle({
  title,
  subtitle,
  center = true,
  as: Tag = 'h2',
}: SectionTitleProps) {
  return (
    <div className={center ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}>
      <RisingTitle as={Tag} text={title} className="font-serif text-[2rem] leading-[1.08] sm:text-[2.6rem] lg:text-[3.25rem] font-normal tracking-[-0.015em] text-wood-deep text-balance" />
      {subtitle && (
        <p className="mt-4 text-base md:text-lg text-wood-deep/70 leading-relaxed text-pretty">{subtitle}</p>
      )}
    </div>
  );
}
