interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  as?: 'h1' | 'h2' | 'h3';
}

export default function SectionTitle({
  eyebrow,
  title,
  subtitle,
  center = true,
  as: Tag = 'h2',
}: SectionTitleProps) {
  return (
    <div className={center ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}>
      {eyebrow && (
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-copper mb-3">
          {eyebrow}
        </p>
      )}
      <Tag className="text-2xl sm:text-3xl md:text-4xl font-medium text-wood-deep">{title}</Tag>
      {subtitle && (
        <p className="mt-4 text-base md:text-lg text-wood-deep/70 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
