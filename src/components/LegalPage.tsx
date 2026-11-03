import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Printer, ArrowUp } from 'lucide-react';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';

export interface LegalSection {
  id: string;
  title: string;
  children: ReactNode;
}

export interface LegalPageProps {
  title: string;
  description?: string;
  breadcrumb: string;
  sections: LegalSection[];
  updatedAt?: string;
  printable?: boolean;
}

export function LegalPage({ title, description, breadcrumb, sections, updatedAt, printable = false }: LegalPageProps) {
  return (
    <>
      <SEO title={`${title} — L'Atelier d'Isabelle`} description={description || title} />
      <main className="pt-28 lg:pt-36 pb-20">
        <div className="container-page max-w-5xl">
          <Breadcrumb items={[{ label: 'Informations légales', path: '/informations-legales' }, { label: breadcrumb }]} />
          <div className="grid lg:grid-cols-[220px_1fr] gap-10 mt-8">
            {/* Sommaire */}
            <aside className="hidden lg:block">
              <nav className="sticky top-28">
                <p className="text-xs uppercase tracking-wider text-wood-deep/50 mb-3">Sommaire</p>
                <ul className="space-y-2 text-sm">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className="text-wood-deep/70 hover:text-terracotta transition-colors">
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
                {printable && (
                  <button onClick={() => window.print()} className="mt-6 flex items-center gap-2 text-sm text-terracotta hover:underline">
                    <Printer className="h-4 w-4" /> Imprimer cette page
                  </button>
                )}
              </nav>
            </aside>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl md:text-4xl font-medium">{title}</h1>
                  {updatedAt && <p className="mt-2 text-sm text-wood-deep/50">Dernière mise à jour : {updatedAt}</p>}
                </div>
                {printable && (
                  <button onClick={() => window.print()} className="lg:hidden flex items-center gap-2 text-sm text-terracotta">
                    <Printer className="h-4 w-4" /> Imprimer
                  </button>
                )}
              </div>

              {description && <p className="text-wood-deep/70 leading-relaxed mb-10">{description}</p>}

              <div className="space-y-12">
                {sections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-28">
                    <h2 className="text-xl font-medium mb-4 text-wood-deep">{section.title}</h2>
                    <div className="text-wood-deep/75 leading-relaxed space-y-4 text-[0.95rem]">
                      {section.children}
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-16 pt-6 border-t border-wood-deep/10 flex items-center justify-between">
                <Link to="/informations-legales" className="flex items-center gap-1.5 text-sm text-terracotta hover:underline">
                  <ChevronRight className="h-4 w-4 rotate-180" /> Retour aux informations légales
                </Link>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1.5 text-sm text-wood-deep/60 hover:text-terracotta">
                  <ArrowUp className="h-4 w-4" /> Haut de page
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export function LegalTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-soft border border-wood-deep/10">
      <table className="w-full text-sm">
        <thead className="bg-beige/30">
          <tr>{headers.map((h) => <th key={h} className="text-left p-3 font-medium text-wood-deep">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-wood-deep/10">
              {row.map((cell, j) => <td key={j} className="p-3 align-top text-wood-deep/75">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalAlert({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-soft bg-beige/40 border border-wood-deep/10 p-4 text-sm text-wood-deep/70 leading-relaxed">
      {children}
    </div>
  );
}

export function LegalEmpty({ label }: { label: string }) {
  return <span className="text-wood-deep/40 italic">{label}</span>;
}

export function FormPrivacyNotice({ kind = 'contact' }: { kind?: 'contact' | 'custom' }) {
  return (
    <p className="text-xs text-wood-deep/60 leading-relaxed bg-beige/20 rounded-soft p-3">
      Les informations saisies sont traitées par L’Atelier d’Isabelle pour répondre à votre {kind === 'custom' ? 'demande de création personnalisée' : 'message'} et, si nécessaire, préparer un échange précontractuel. Les champs indiqués d’un astérisque sont nécessaires. Les données sont destinées à l’atelier et à ses prestataires techniques autorisés, selon les modalités décrites dans la <Link to="/politique-confidentialite" className="text-terracotta hover:underline">politique de confidentialité</Link>. Vous pouvez exercer vos droits à l’adresse indiquée dans les mentions légales.
    </p>
  );
}

