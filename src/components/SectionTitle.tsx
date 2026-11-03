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
      <Tag className="font-serif text-[1.9rem] leading-[1.1] sm:text-4xl md:text-[2.75rem] font-normal tracking-[-0.01em] text-wood-deep text-balance">{title}</Tag>
      {subtitle && (
        <p className="mt-4 text-base md:text-lg text-wood-deep/70 leading-relaxed text-pretty">{subtitle}</p>
      )}
    </div>
  );
}
