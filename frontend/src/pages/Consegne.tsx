import { useState, useMemo, useEffect, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Filter, Package,
  ArrowUpDown, ArrowUp, ArrowDown, Clock,
  ChevronDown, ChevronRight, Phone,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { consegneService } from '../services/consegne.service';
import { StatoBadge } from '../components/ui/StatoBadge';
import { SkeletonRows } from '../components/ui/Skeleton';
import { format } from 'date-fns';
import type { ConsegnaList, StatoConsegna } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

type Sezione = 'tutte' | 'da_fare' | 'fatte';
type SortDir = 'asc' | 'desc' | null;
type SortKey = 'data' | 'cliente' | 'importo';

const STATI_DA_FARE: StatoConsegna[] = ['DaPianificare', 'Pianificata', 'InTransito'];
const STATI_FATTE:  StatoConsegna[] = ['Consegnata', 'NonConsegnata', 'Annullata'];

const STATI_PER_SEZIONE: Record<Sezione, { value: string; label: string }[]> = {
  tutte: [
    { value: '', label: 'Tutti gli stati' },
    { value: 'DaPianificare',  label: 'Da pianificare' },
    { value: 'Pianificata',    label: 'Pianificata' },
    { value: 'InTransito',     label: 'In transito' },
    { value: 'Consegnata',     label: 'Consegnata' },
    { value: 'NonConsegnata',  label: 'Non consegnata' },
    { value: 'Annullata',      label: 'Annullata' },
  ],
  da_fare: [
    { value: '', label: 'Tutti gli stati' },
    { value: 'DaPianificare', label: 'Da pianificare' },
    { value: 'Pianificata',   label: 'Pianificata' },
    { value: 'InTransito',    label: 'In transito' },
  ],
  fatte: [
    { value: '', label: 'Tutti gli stati' },
    { value: 'Consegnata',    label: 'Consegnata' },
    { value: 'NonConsegnata', label: 'Non consegnata' },
    { value: 'Annullata',     label: 'Annullata' },
  ],
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Consegne() {
  useAuth();
  const navigate = useNavigate();

  const [cerca,       setCerca]       = useState('');
  const [cercaInput,  setCercaInput]  = useState('');
  const [sezione,     setSezione]     = useState<Sezione>('da_fare');
  const [statoFiltro, setStatoFiltro] = useState('');
  const [sortKey,     setSortKey]     = useState<SortKey>('data');
  const [sortDir,     setSortDir]     = useState<SortDir>(null);
  const [expandedId,  setExpandedId]  = useState<number | null>(null);

  // Debounce ricerca: aggiorna `cerca` 300ms dopo l'ultima digitazione
  useEffect(() => {
    const t = setTimeout(() => setCerca(cercaInput.trim()), 300);
    return () => clearTimeout(t);
  }, [cercaInput]);

  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpandedId(prev => prev === id ? null : id);
  };

  // Fetch everything – filtering and sorting happen client-side
  const { data, isLoading } = useQuery({
    queryKey: ['consegne', { cerca }],
    queryFn: () => consegneService.getConsegne({ cerca, perPagina: 200 }),
  });

  const all = data?.data ?? [];

  // ── Derived counts for toggle labels ──
  const cntDaFare = useMemo(() => all.filter(c => (STATI_DA_FARE as string[]).includes(c.stato)).length, [all]);
  const cntFatte  = useMemo(() => all.filter(c => (STATI_FATTE  as string[]).includes(c.stato)).length, [all]);

  // ── Apply sezione → stato → sort ──
  const righe = useMemo<ConsegnaList[]>(() => {
    let items = [...all];

    if (sezione === 'da_fare') items = items.filter(c => (STATI_DA_FARE as string[]).includes(c.stato));
    if (sezione === 'fatte')   items = items.filter(c => (STATI_FATTE  as string[]).includes(c.stato));
    if (statoFiltro)           items = items.filter(c => c.stato === statoFiltro);

    if (sortDir) {
      items.sort((a, b) => {
        let cmp: number;
        if (sortKey === 'cliente') {
          cmp = a.clienteNome.localeCompare(b.clienteNome);
        } else if (sortKey === 'importo') {
          cmp = a.importoDaPagare - b.importoDaPagare;
        } else {
          const da = a.dataPrevistaConsegna ?? '';
          const db = b.dataPrevistaConsegna ?? '';
          if (!da && !db) return 0;
          if (!da) return 1;   // null sempre in fondo
          if (!db) return -1;
          cmp = da.localeCompare(db);
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return items;
  }, [all, sezione, statoFiltro, sortKey, sortDir]);

  // ── Handlers ──
  const changeSezione = (s: Sezione) => { setSezione(s); setStatoFiltro(''); };

  // Click su una colonna: se è già attiva cicla asc→desc→off, altrimenti parte da asc
  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc');
  };

  // ── Sort icon helper per colonna ──
  const sortIconFor = (key: SortKey) => {
    if (sortKey !== key || !sortDir) return { Icon: ArrowUpDown, color: 'text-gray-400' };
    return { Icon: sortDir === 'asc' ? ArrowUp : ArrowDown, color: 'text-blue-600' };
  };
  const dataSort = sortIconFor('data');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Consegne</h1>
        {data && <p className="text-sm text-gray-500 mt-0.5">{righe.length} / {data.total} totali</p>}
      </div>

      {/* Toggle sezione */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {([
          { key: 'tutte',   label: 'Tutte',      cnt: all.length },
          { key: 'da_fare', label: 'Da fare',     cnt: cntDaFare  },
          { key: 'fatte',   label: 'Completate',  cnt: cntFatte   },
        ] as { key: Sezione; label: string; cnt: number }[]).map(({ key, label, cnt }) => (
          <button
            key={key}
            onClick={() => changeSezione(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              sezione === key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden text-xs">{label.replace('Completate', 'Fatte')}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              sezione === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {cnt}
            </span>
          </button>
        ))}
      </div>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={cercaInput}
            onChange={e => setCercaInput(e.target.value)}
            placeholder="Cerca per cliente, ordine, città..."
            aria-label="Cerca consegne"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Filter size={15} className="text-gray-400 flex-shrink-0" />
            <select
              value={statoFiltro}
              onChange={e => setStatoFiltro(e.target.value)}
              aria-label="Filtra per stato"
              className="flex-1 sm:w-44 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
            >
              {STATI_PER_SEZIONE[sezione].map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          {/* Sort by date */}
          <button
            onClick={() => toggleSort('data')}
            aria-label="Ordina per data prevista"
            title={sortKey === 'data' && sortDir === 'asc' ? 'Ordine crescente' : sortKey === 'data' && sortDir === 'desc' ? 'Ordine decrescente' : 'Ordina per data prevista'}
            className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              sortKey === 'data' && sortDir
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <dataSort.Icon size={14} className={dataSort.color} />
            <span className="hidden sm:inline">Data</span>
          </button>
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <SkeletonRows rows={8} />
        ) : righe.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">Nessuna consegna trovata</p>
            <p className="text-sm mt-1 text-gray-500">Prova a cambiare i filtri</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="w-8 px-2 py-3" />
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Ordine</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      <button
                        onClick={() => toggleSort('cliente')}
                        className={`flex items-center gap-1.5 hover:text-blue-600 transition-colors ${sortKey === 'cliente' && sortDir ? 'text-blue-600' : ''}`}
                      >
                        Cliente
                        {(() => { const s = sortIconFor('cliente'); return <s.Icon size={13} className={s.color} />; })()}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Articoli</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      <button
                        onClick={() => toggleSort('importo')}
                        className={`flex items-center gap-1.5 hover:text-blue-600 transition-colors ${sortKey === 'importo' && sortDir ? 'text-blue-600' : ''}`}
                      >
                        Importo
                        {(() => { const s = sortIconFor('importo'); return <s.Icon size={13} className={s.color} />; })()}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      <button
                        onClick={() => toggleSort('data')}
                        className={`flex items-center gap-1.5 hover:text-blue-600 transition-colors ${sortKey === 'data' && sortDir ? 'text-blue-600' : ''}`}
                      >
                        Data prevista
                        <dataSort.Icon size={13} className={dataSort.color} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      <span className="flex items-center gap-1"><Phone size={13} /> Telefono</span>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      <span className="flex items-center gap-1"><Clock size={13} /> Orario</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {righe.map(c => {
                    const isExpanded = expandedId === c.id;
                    return (
                      <Fragment key={c.id}>
                        <tr
                          onClick={() => navigate(`/consegne/${c.id}`)}
                          className={`cursor-pointer transition-colors border-b border-gray-50 ${
                            isExpanded ? 'bg-blue-50/60' : 'hover:bg-blue-50/40'
                          }`}
                        >
                          {/* Expand chevron */}
                          <td className="pl-3 pr-1 py-3.5">
                            <button
                              onClick={e => toggleExpand(e, c.id)}
                              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                              title={isExpanded ? 'Chiudi' : 'Vedi articoli'}
                              aria-label={isExpanded ? 'Chiudi articoli' : 'Vedi articoli'}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded
                                ? <ChevronDown size={14} />
                                : <ChevronRight size={14} />}
                            </button>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono text-xs text-gray-500">#{c.numeroOrdine}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-blue-700">{c.clienteNome}</p>
                            <p className="text-xs text-gray-400">{c.clienteCitta}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-gray-700 truncate max-w-[200px]">{c.articoliSommario}</p>
                            {c.articoliCount > 1 && (
                              <p className="text-xs text-gray-400">{c.articoliCount} articoli</p>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium">€ {c.importoDaPagare.toFixed(2)}</p>
                            {c.pagamentoRicevuto && (
                              <span className="text-xs text-green-600 font-medium">✓ Ritirato</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatoBadge stato={c.stato as StatoConsegna} />
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs">
                            {c.dataPrevistaConsegna
                              ? format(new Date(c.dataPrevistaConsegna), 'dd/MM/yyyy')
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                            {c.clienteTelefono
                              ? <a
                                  href={`tel:${c.clienteTelefono}`}
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-xs whitespace-nowrap"
                                >
                                  <Phone size={12} />{c.clienteTelefono}
                                </a>
                              : <span className="text-gray-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-500">
                            {c.fasciaDalle
                              ? <span className="font-medium">{c.fasciaDalle}{c.fasciaAlle ? ` – ${c.fasciaAlle}` : ''}</span>
                              : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>

                        {/* Riga espansa — lista articoli */}
                        {isExpanded && (
                          <tr className="bg-blue-50/30 border-b border-blue-100">
                            <td />
                            <td colSpan={8} className="px-4 pb-4 pt-2">
                              <div className="border-l-2 border-blue-200 pl-4">
                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                                  Articoli ordine
                                </p>
                                {(c.articoli ?? []).length === 0 ? (
                                  <p className="text-xs text-gray-400">Nessun articolo</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {(c.articoli ?? []).map((art, idx) => (
                                      <div key={art.id ?? idx} className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400 font-mono w-4 flex-shrink-0">{idx + 1}</span>
                                        <div className="flex-1 min-w-0">
                                          <span className="text-sm text-gray-800">{art.descrizione}</span>
                                          {art.codice && (
                                            <span className="ml-2 text-xs text-gray-400 font-mono">{art.codice}</span>
                                          )}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                          ×{art.quantita}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {righe.map(c => {
                const isExpanded = expandedId === c.id;
                return (
                  <div key={c.id} className="flex flex-col">
                    <Link to={`/consegne/${c.id}`}
                      className="flex flex-col gap-2 p-4 hover:bg-gray-50 active:bg-gray-100">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{c.clienteNome}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.clienteCitta} · #{c.numeroOrdine}</p>
                        </div>
                        <StatoBadge stato={c.stato as StatoConsegna} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-600 truncate flex-1">{c.articoliSommario}</p>
                        {/* Expand button */}
                        <button
                          onClick={e => toggleExpand(e, c.id)}
                          className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 font-medium px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100"
                        >
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          {c.articoliCount} art.
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">€ {c.importoDaPagare.toFixed(2)}</span>
                        <div className="flex items-center gap-3">
                          {c.pagamentoRicevuto && <span className="text-xs text-green-600 font-medium">✓ Ritirato</span>}
                          {/* Telefono cliccabile */}
                          {c.clienteTelefono && (
                            <a
                              href={`tel:${c.clienteTelefono}`}
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-blue-600 text-xs font-semibold"
                            >
                              <Phone size={12} />{c.clienteTelefono}
                            </a>
                          )}
                          {c.dataPrevistaConsegna && (
                            <span className="text-xs text-gray-400">
                              {format(new Date(c.dataPrevistaConsegna), 'dd/MM/yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    {/* Expanded articoli su mobile */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-blue-50/30 border-t border-blue-100">
                        <div className="border-l-2 border-blue-200 pl-3 pt-3 space-y-1.5">
                          {(c.articoli ?? []).map((art, idx) => (
                            <div key={art.id ?? idx} className="flex items-start gap-2">
                              <span className="text-xs text-gray-400 font-mono w-4 flex-shrink-0">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-gray-800">{art.descrizione}</span>
                                {art.codice && <span className="ml-1 text-xs text-gray-400 font-mono">{art.codice}</span>}
                              </div>
                              <span className="text-xs text-gray-500 font-semibold flex-shrink-0">×{art.quantita}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
