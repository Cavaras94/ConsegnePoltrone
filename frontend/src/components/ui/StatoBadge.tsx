import type { StatoConsegna, EsitoConsegna } from '../../types';

const STATO_CONFIG: Record<StatoConsegna, { label: string; className: string }> = {
  DaPianificare: { label: 'Da pianificare', className: 'bg-gray-100 text-gray-700 ring-gray-200' },
  Pianificata:   { label: 'Pianificata',    className: 'bg-blue-100 text-blue-700 ring-blue-200' },
  InTransito:    { label: 'In transito',    className: 'bg-yellow-100 text-yellow-700 ring-yellow-200' },
  Consegnata:    { label: 'Consegnata',     className: 'bg-green-100 text-green-700 ring-green-200' },
  NonConsegnata: { label: 'Non consegnata', className: 'bg-red-100 text-red-700 ring-red-200' },
  Annullata:     { label: 'Annullata',      className: 'bg-zinc-100 text-zinc-500 ring-zinc-200' },
};

const ESITO_CONFIG: Record<EsitoConsegna, { label: string; className: string }> = {
  Consegnata:    { label: 'Consegnata',     className: 'bg-green-100 text-green-700' },
  ClienteAssente:{ label: 'Cliente assente',className: 'bg-orange-100 text-orange-700' },
  Rifiutata:     { label: 'Rifiutata',      className: 'bg-red-100 text-red-700' },
  Danneggiata:   { label: 'Danneggiata',    className: 'bg-purple-100 text-purple-700' },
  Altro:         { label: 'Altro',          className: 'bg-gray-100 text-gray-700' },
};

export function StatoBadge({ stato }: { stato: StatoConsegna }) {
  const cfg = STATO_CONFIG[stato] ?? STATO_CONFIG.DaPianificare;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function EsitoBadge({ esito }: { esito: EsitoConsegna }) {
  const cfg = ESITO_CONFIG[esito] ?? ESITO_CONFIG.Altro;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {esito ? cfg.label : '—'}
    </span>
  );
}
