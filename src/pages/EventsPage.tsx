import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ExternalLink, MapPin } from 'lucide-react';
import SEO from '@/components/SEO';
import { useSiteSettings, useSiteTexts } from '@/lib/siteData';
import { breadcrumbJsonLd } from '@/lib/structuredData';
import Breadcrumb from '@/components/Breadcrumb';
import SectionTitle from '@/components/SectionTitle';
import CallToAction from '@/components/CallToAction';
import { fetchPublicEvents, type EventRow } from '@/lib/catalogService';

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '';
  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  if (start && end && start !== end) return `${fmt(start)} — ${fmt(end)}`;
  return fmt(start || end || '');
}

export function EventsPage() {
  const settings = useSiteSettings();
  const text = useSiteTexts();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchPublicEvents()
      .then((rows) => { if (active) setEvents(rows); })
      .catch(() => { if (active) setError('Les événements ne sont pas disponibles pour le moment.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const permanent = events.filter((e) => e.is_permanent);
  const temporary = events.filter((e) => !e.is_permanent);

  return (
    <>
      <SEO title="Événements et marchés artisanaux dans les Vosges | L'Atelier d'Isabelle" description="Retrouvez les créations d'Isabelle dans ses boutiques partenaires à Saint-Dié-des-Vosges et Raon-l'Étape, et sur les marchés de créateurs des Vosges." jsonLd={breadcrumbJsonLd([{ name: 'Événements', path: '/evenements' }])} />
      <main className="pt-28 lg:pt-36">
        <div className="container-page">
          <Breadcrumb items={[{ label: 'Événements' }]} />
          <SectionTitle
            as="h1"
            eyebrow="Événements"
            title={text('evenements.entete.titre')}
            subtitle={text('evenements.entete.texte')}
          />

          {loading && <p className="mt-12 text-center text-wood-deep/60">Chargement des événements…</p>}
          {error && <p className="mt-12 text-center text-red-700">{error}</p>}

          {!loading && !error && permanent.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-medium mb-6">Boutiques partenaires</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {permanent.map((event) => (
                  <article key={event.id} className="card card-hover overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-sage/25 to-honey/20">
                      {event.image ? (
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex items-center justify-center h-full"><Calendar className="h-16 w-16 text-sage-dark" /></div>
                      )}
                    </div>
                    <div className="p-6">
                      <span className="badge-sage mb-3 inline-block">Boutique partenaire</span>
                      <h3 className="text-xl font-medium">{event.title}</h3>
                      {event.location && (
                        <p className="mt-2 flex items-center gap-2 text-sm text-wood-deep/60">
                          <MapPin className="h-4 w-4 text-terracotta" /> {event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className="mt-3 text-sm text-wood-deep/70 leading-relaxed">{event.description}</p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-2 text-sm text-sage-dark">
                        <Calendar className="h-4 w-4" /> Disponible en permanence
                      </span>
                      {event.link_url && (
                        <a href={event.link_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-terracotta hover:underline">
                          Plus d’informations <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {!loading && !error && temporary.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-medium mb-6">Marchés et salons à venir</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {temporary.map((event) => {
                  const dateRange = formatDateRange(event.start_date, event.end_date);
                  return (
                    <article key={event.id} className="card card-hover overflow-hidden">
                      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-honey/20 to-terracotta/20">
                        {event.image ? (
                          <img src={event.image} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex items-center justify-center h-full"><Calendar className="h-16 w-16 text-terracotta" /></div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-medium">{event.title}</h3>
                        {event.location && (
                          <p className="mt-2 flex items-center gap-2 text-sm text-wood-deep/60">
                            <MapPin className="h-4 w-4 text-terracotta" /> {event.location}
                          </p>
                        )}
                        {dateRange && (
                          <p className="mt-2 flex items-center gap-2 text-sm text-sage-dark">
                            <Calendar className="h-4 w-4" /> {dateRange}
                          </p>
                        )}
                        {event.description && (
                          <p className="mt-3 text-sm text-wood-deep/70 leading-relaxed">{event.description}</p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="mt-16 rounded-soft-lg bg-gradient-to-br from-cream-warm to-sand p-8 lg:p-12 text-center border border-honey/20">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium">Marchés et salons artisanaux</h2>
              <p className="mt-4 text-wood-deep/70 max-w-2xl mx-auto leading-relaxed">
                Isabelle participe régulièrement à des marchés de créateurs et des salons artisanaux dans les Vosges.
                Les dates et lieux des prochaines rencontres seront annoncés ici.
              </p>
              <p className="mt-4 text-sm text-wood-deep/55">
                Pour ne rien manquer, suivez l'atelier sur{' '}
                <a href={settings.facebook} target="_blank" rel="noreferrer" className="text-terracotta hover:underline">Facebook</a>
                {' '}ou{' '}
                <Link to="/contact" className="text-terracotta hover:underline">contactez Isabelle</Link>.
              </p>
            </div>
          )}

          {!loading && !error && temporary.length === 0 && permanent.length > 0 && (
            <div className="mt-16 rounded-soft-lg bg-gradient-to-br from-cream-warm to-sand p-8 lg:p-12 text-center border border-honey/20">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium">Marchés et salons artisanaux</h2>
              <p className="mt-4 text-wood-deep/70 max-w-2xl mx-auto leading-relaxed">
                Isabelle participe régulièrement à des marchés de créateurs et des salons artisanaux dans les Vosges.
                Les dates et lieux des prochaines rencontres seront annoncés ici.
              </p>
              <p className="mt-4 text-sm text-wood-deep/55">
                Pour ne rien manquer, suivez l'atelier sur{' '}
                <a href={settings.facebook} target="_blank" rel="noreferrer" className="text-terracotta hover:underline">Facebook</a>
                {' '}ou{' '}
                <Link to="/contact" className="text-terracotta hover:underline">contactez Isabelle</Link>.
              </p>
            </div>
          )}
        </div>
        <CallToAction
          title="Une question sur un événement ?"
          text="Écrivez à Isabelle pour savoir où la retrouver prochainement."
          primaryLabel="Contacter Isabelle"
        />
      </main>
    </>
  );
}
