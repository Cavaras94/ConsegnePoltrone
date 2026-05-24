import type { StatoLavoro, PrioritaLavoro, TipoLavoro, CategoriaLavoro } from '../../types';

const STATO_CFG: Record<StatoLavoro, { label: string; className: string }> = {
  DaPianificare: { label: 'Da pianificare', className: 'bg-gray-100 text-gray-600 ring-gray-200' },
  Pianificato:   { label: 'Pianificato',    className: 'bg-blue-100 text-blue-700 ring-blue-200' },
  InCorso:       { label: 'In corso',       className: 'bg-violet-100 text-violet-700 ring-violet-200' },
  Completato:    { label: 'Completato',     className: 'bg-green-100 text-green-700 ring-green-200' },
  Sospeso:       { label: 'Sospeso',        className: 'bg-yellow-100 text-yellow-700 ring-yellow-200' },
  Annullato:     { label: 'Annullato',      className: 'bg-zinc-100 text-zinc-500 ring-zinc-200' },
};

const PRIORITA_CFG: Record<PrioritaLavoro, { label: string; className: string }> = {
  Bassa:   { label: '↓ Bassa',   className: 'bg-slate-100 text-slate-500' },
  Media:   { label: '→ Media',   className: 'bg-blue-50 text-blue-600' },
  Alta:    { label: '↑ Alta',    className: 'bg-orange-100 text-orange-600' },
  Urgente: { label: '🔴 Urgente', className: 'bg-red-100 text-red-600' },
};

export const TIPO_LABELS: Record<TipoLavoro, string> = {
  Bagno: '🛁 Bagno',
  VascaInDoccia: '🚿 Vasca → Doccia',
  Clima: '❄️ Clima',
  Cucina: '🍳 Cucina',
  Pavimenti: '🪵 Pavimenti',
  Elettrico: '⚡ Elettrico',
  Idraulica: '🔧 Idraulica',
  Altro: '📋 Altro',
};

export const TIPO_OPTIONS = Object.entries(TIPO_LABELS).map(([value, label]) => ({ value, label }));

export function StatoLavoroBadge({ stato }: { stato: StatoLavoro }) {
  const cfg = STATO_CFG[stato] ?? STATO_CFG.DaPianificare;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function PrioritaBadge({ priorita }: { priorita: PrioritaLavoro }) {
  const cfg = PRIORITA_CFG[priorita] ?? PRIORITA_CFG.Media;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function CategoriaBadge({ categoria }: { categoria: CategoriaLavoro }) {
  if (categoria === 'Assistenza') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200">
        🔧 Assistenza
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-200">
      🏗️ Lavoro
    </span>
  );
}
