import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, Calendar, List, Wrench,
  ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, FileText,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { lavoriService } from '../services/lavori.service';
import { squadreService } from '../services/squadre.service';
import { StatoLavoroBadge, TIPO_LABELS, CategoriaBadge } from '../components/ui/LavoroBadges';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { LavoroList, StatoLavoro, TipoLavoro } from '../types';

type Categoria = 'tutte' | 'Lavoro' | 'Assistenza';
type SortDir = 'asc' | 'desc' | null;

const STATI_LAVORO = [
  { value: '', label: 'Tutti gli stati' },
  { value: 'DaPianificare', label: 'Da pianificare' },
  { value: 'Pianificato',   label: 'Pianificato' },
  { value: 'InCorso',       label: 'In corso' },
  { value: 'Completato',    label: 'Completato' },
  { value: 'Sospeso',       label: 'Sospeso' },
  { value: 'Annullato',     label: 'Annullato' },
];

/** Deriva il turno dall'orario di inizio (fallback se turno non è esplicito) */
function deriveTurno(fasciaDalle?: string | null): 'Mattina' | 'Pomeriggio' {
  if (!fasciaDalle) return 'Mattina';
  return fasciaDalle < '13:00' ? 'Mattina' : 'Pomeriggio';
}

export default function Lavori() {
  const { isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  const [cerca,         setCerca]         = useState('');
  const [cercaInput,    setCercaInput]    = useState('');
  const [stato,         setStato]         = useState('');
  const [filtroSquadra, setFiltroSquadra] = useState<number | undefined>();
  const [categoria,     setCategoria]     = useState<Categoria>('tutte');
  const [sortDir,       setSortDir]       = useState<SortDir>(null);

  const { data: squadre } = useQuery({
    queryKey: ['squadre'],
    queryFn: () => squadreService.getSquadre(true),
    enabled: isAdmin || isManager,
  });

  // Fetch everything – categoria filter e sorting sono client-side
  const { data, isLoading } = useQuery({
    queryKey: ['lavori', { cerca, stato, filtroSquadra }],
    queryFn: () => lavoriService.getLavori({
      cerca, stato, squadraId: filtroSquadra, perPagina: 200,
    }),
  });

  const all = data?.data ?? [];

  // ── Conteggi per toggle ──
  const cntLavori     = useMemo(() => all.filter(l => l.categoria === 'Lavoro').length,     [all]);
  const cntAssistenze = useMemo(() => all.filter(l => l.categoria === 'Assistenza').length, [all]);

  // ── Rilevamento conflitti di capacità (su tutti i dati) ──
  // Lavori: max 1 per squadra per giorno
  // Assistenze: max 1 per turno (Mattina/Pomeriggio) per squadra per giorno
  const conflictSet = useMemo(() => {
    const ids = new Set<number>();
    const lavoriPerDay       = new Map<string, number[]>();
    const assistenzePerTurno = new Map<string, number[]>();

    for (const l of all) {
      if (!l.squadraId || !l.dataInizio || l.stato === 'Annullato') continue;

      if (l.categoria === 'Lavoro') {
        const key = `${l.squadraId}-${l.dataInizio}`;
        if (!lavoriPerDay.has(key)) lavoriPerDay.set(key, []);
        lavoriPerDay.get(key)!.push(l.id);
      } else {
        const turno = l.turno ?? deriveTurno(l.fasciaDalle);
        const key   = `${l.squadraId}-${l.dataInizio}-${turno}`;
        if (!assistenzePerTurno.has(key)) assistenzePerTurno.set(key, []);
        assistenzePerTurno.get(key)!.push(l.id);
      }
    }

    for (const [, lids] of lavoriPerDay)       if (lids.length > 1) lids.forEach(id => ids.add(id));
    for (const [, lids] of assistenzePerTurno) if (lids.length > 1) lids.forEach(id => ids.add(id));

    return ids;
  }, [all]);

  // ── Righe visibili: categoria → sort ──
  const righe = useMemo<LavoroList[]>(() => {
    let items = all;
    if (categoria !== 'tutte') items = items.filter(l => l.categoria === categoria);
    if (!sortDir) return items;
    return [...items].sort((a, b) => {
      const da = a.dataInizio ?? '';
      const db = b.dataInizio ?? '';
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return sortDir === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [all, categoria, sortDir]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setCerca(cercaInput); };
  const cycleSort = () => setSortDir(d => d === null ? 'asc' : d === 'asc' ? 'desc' : null);

  const SortIcon  = sortDir === 'asc' ? ArrowUp : sortDir === 'desc' ? ArrowDown : ArrowUpDown;
  const sortColor = sortDir ? 'text-blue-600' : 'text-gray-400';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Installazioni</h1>
          {data && <p className="text-sm text-gray-500 mt-0.5">{righe.length} / {data.total} lavori</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link to="/lavori/calendario"
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            <Calendar size={16} />
            <span className="hidden sm:inline">Calendario</span>
          </Link>
          {isAdmin && (
            <Link to="/lavori/nuovo"
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} />
              <span className="hidden sm:inline">Nuovo</span>
            </Link>
          )}
        </div>
      </div>

      {/* Toggle categoria */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {([
          { key: 'tutte',      label: 'Tutti',      cnt: all.length    },
          { key: 'Lavoro',     label: 'Lavori',     cnt: cntLavori     },
          { key: 'Assistenza', label: 'Assistenze', cnt: cntAssistenze },
        ] as { key: Categoria; label: string; cnt: number }[]).map(({ key, label, cnt }) => (
          <button
            key={key}
            onClick={() => setCategoria(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              categoria === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden text-xs">{label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              categoria === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
            }`}>{cnt}</span>
          </button>
        ))}
      </div>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={cercaInput}
            onChange={e => { setCercaInput(e.target.value); if (!e.target.value) setCerca(''); }}
            placeholder="Cerca per cliente, descrizione, città..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-gray-400 flex-shrink-0" />
          <select
            value={stato}
            onChange={e => setStato(e.target.value)}
            className="flex-1 min-w-[140px] border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {STATI_LAVORO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {(isAdmin || isManager) && squadre && (
            <select
              value={filtroSquadra ?? ''}
              onChange={e => setFiltroSquadra(e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 min-w-[140px] border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Tutte le squadre</option>
              {squadre.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          )}

          {/* Sort by date */}
          <button
            onClick={cycleSort}
            title="Ordina per data inizio"
            className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              sortDir
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SortIcon size={14} className={sortColor} />
            <span className="hidden sm:inline">Data inizio</span>
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm">Caricamento...</p>
            </div>
          </div>
        ) : righe.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Wrench size={40} className="mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">Nessun lavoro trovato</p>
            <p className="text-sm mt-1">Prova a cambiare i filtri</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Installazione</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Cliente</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
                    {/* Sortable date/time column */}
                    <th className="text-left px-4 py-3 font-medium text-gray-500">
                      <button
                        onClick={cycleSort}
                        className={`flex items-center gap-1.5 hover:text-blue-600 transition-colors ${sortDir ? 'text-blue-600' : ''}`}
                      >
                        Data / Orario
                        <SortIcon size={13} className={sortColor} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Stato</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Squadra</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">
                      <span className="flex items-center gap-1"><FileText size={13} /> Docs</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {righe.map(l => {
                    const isAssistenza  = l.categoria === 'Assistenza';
                    const turno         = isAssistenza ? (l.turno ?? deriveTurno(l.fasciaDalle)) : null;
                    const hasConflict   = conflictSet.has(l.id);

                    return (
                      <tr
                        key={l.id}
                        onClick={() => navigate(`/lavori/${l.id}`)}
                        className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${isAssistenza ? 'bg-amber-50/40' : ''}`}
                      >
                        {/* Installazione */}
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">{l.descrizione}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-xs text-gray-400">#{l.numeroLavoro}</span>
                            <CategoriaBadge categoria={l.categoria} />
                          </div>
                        </td>

                        {/* Cliente */}
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-blue-700">{l.clienteNome}</p>
                          <p className="text-xs text-gray-400">{l.clienteCitta}</p>
                        </td>

                        {/* Tipo */}
                        <td className="px-4 py-3.5 text-gray-600 text-xs">
                          {TIPO_LABELS[l.tipo as TipoLavoro]}
                        </td>

                        {/* Data / Orario */}
                        <td className="px-4 py-3.5 text-xs text-gray-500">
                          {l.dataInizio ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-gray-700">
                                  {format(new Date(l.dataInizio), 'dd/MM/yyyy')}
                                </span>
                                {hasConflict && (
                                  <span
                                    title={isAssistenza
                                      ? `Conflitto: turno ${turno} già occupato da un'altra assistenza per questa squadra`
                                      : 'Conflitto: la squadra ha già un lavoro assegnato in questo giorno'}
                                    className="flex-shrink-0 cursor-help"
                                  >
                                    <AlertTriangle size={13} className="text-amber-500" />
                                  </span>
                                )}
                              </div>
                              {/* Turno per assistenze, orario per lavori */}
                              {isAssistenza && turno ? (
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full w-fit ${
                                  turno === 'Mattina'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                  {turno === 'Mattina' ? '🌅' : '🌇'} {turno}
                                </span>
                              ) : l.fasciaDalle ? (
                                <span className="text-gray-400">ore {l.fasciaDalle}</span>
                              ) : null}
                              {l.dataFine && l.dataFine !== l.dataInizio && (
                                <span className="text-gray-400">
                                  → {format(new Date(l.dataFine), 'dd/MM/yyyy', { locale: it })}
                                </span>
                              )}
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Stato */}
                        <td className="px-4 py-3.5">
                          <StatoLavoroBadge stato={l.stato as StatoLavoro} />
                        </td>

                        {/* Squadra */}
                        <td className="px-4 py-3.5">
                          {l.squadraNome ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: l.squadraColore ?? '#3b82f6' }}
                            >
                              <List size={10} />
                              {l.squadraNome}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>

                        {/* Documenti */}
                        <td className="px-4 py-3.5">
                          {l.documentiCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                              <FileText size={13} />
                              {l.documentiCount}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {righe.map(l => {
                const isAssistenza = l.categoria === 'Assistenza';
                const turno        = isAssistenza ? (l.turno ?? deriveTurno(l.fasciaDalle)) : null;
                const hasConflict  = conflictSet.has(l.id);

                return (
                  <Link key={l.id} to={`/lavori/${l.id}`}
                    className={`flex flex-col gap-2 p-4 hover:bg-gray-50 active:bg-gray-100 border-l-4 ${
                      isAssistenza ? 'border-amber-400 bg-amber-50/30' : 'border-transparent'
                    }`}>
                    {/* Riga 1: categoria + stato */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CategoriaBadge categoria={l.categoria} />
                          {hasConflict && (
                            <span title="Conflitto capacità squadra" className="cursor-help">
                              <AlertTriangle size={13} className="text-amber-500" />
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 truncate">{l.descrizione}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{l.clienteNome} · {l.clienteCitta}</p>
                      </div>
                      <StatoLavoroBadge stato={l.stato as StatoLavoro} />
                    </div>

                    {/* Riga 2: tipo + squadra + data + turno/orario */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-500 flex-shrink-0">{TIPO_LABELS[l.tipo as TipoLavoro]}</span>
                        {l.squadraNome && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium truncate"
                            style={{ backgroundColor: l.squadraColore ?? '#3b82f6' }}
                          >
                            {l.squadraNome}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {l.dataInizio && (
                          <span className="text-xs text-gray-500 font-medium">
                            {format(new Date(l.dataInizio), 'dd/MM/yyyy')}
                          </span>
                        )}
                        {isAssistenza && turno ? (
                          <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                            turno === 'Mattina'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {turno === 'Mattina' ? '🌅' : '🌇'} {turno}
                          </span>
                        ) : l.fasciaDalle && !isAssistenza ? (
                          <span className="text-xs text-gray-400">ore {l.fasciaDalle}</span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
