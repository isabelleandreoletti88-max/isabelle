import type { ReactNode } from 'react';

// Éléments d'interface partagés par les pages de l'administration.
export function AdminTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"><div><p className="text-xs uppercase tracking-wider text-terracotta mb-2">L’atelier</p><h1 className="text-3xl sm:text-4xl font-medium">{title}</h1>{description && <p className="mt-2 text-wood-deep/60">{description}</p>}</div>{action}</div>; }
export function Panel({ title, children }: { title: string; children: ReactNode }) { return <section className="bg-off-white rounded-soft shadow-soft p-5 sm:p-6"><h2 className="text-xl font-medium mb-5">{title}</h2>{children}</section>; }
export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) { return <label className="block mb-4"><span className="label-field">{label} {required && <span className="text-terracotta">*</span>}</span>{children}</label>; }
export function Notice({ text, error = false }: { text: string; error?: boolean }) { return <div className={`mb-6 rounded-soft p-4 text-sm ${error ? 'bg-red-50 text-red-800' : 'bg-sage/10 text-sage'}`}>{text}</div>; }
