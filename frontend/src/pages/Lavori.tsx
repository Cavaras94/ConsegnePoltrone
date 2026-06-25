import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Filter, Calendar, List, Wrench,
  ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, FileText,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { lavoriService } from '../services/lavori.service';
import { squadreService } from '../services/squadre.service';
import { StatoLavoroBadge, TIPO_LABELS, CategoriaBadge } from '../components/ui/LavoroBadges';
import { SkeletonRows } from '../components/ui/Skeleton';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { LavoroList, StatoLavoro, TipoLavoro } from '../types';

type Sezione = 'da_fare' | 'tutti';
type Categoria = 'tutte' | 'Lavoro' | 'Assistenza';
type SortDir = 'asc' | 'desc' | null;

// Stati considerati "da fare" (non ancora conclusi)
const STATI_DA_FARE: StatoLavoro[] = ['DaPianificare', 'Pianificato', 'InCorso', 'Sospeso'];

const STATI_PER_SEZIONE: Record<Sezione, { value: string; label: string }[]> = {
  da_fare: [
    { value: '', label: 'Tutti gli stati' },
    { value: 'DaPianificare', label: 'Da pianificare' },
    { value: 'Pianificato',   label: 'Pianificato' },
    { value: 'InCorso',       label: 'In corso' },
    { value: 'Sospeso',       label: 'Sospeso' },
  ],
  tutti: [
    { value: '', label: 'Tutti gli stati' },
    { value: 'DaPianificare', label: 'Da pianificare' },
    { value: 'Pianificato',   label: 'Pianificato' },
    { value: 'InCorso',       label: 'In corso' },
    { value: 'Completato',    label: 'Completato' },
    { value: 'Sospeso',       label: 'Sospeso' },
    { value: 'Annullato',     label: 'Annullato' },
  ],
};

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
  const [sezione,       setSezione]       = useState<Sezione>('da_fare');
  const [categoria,     setCategoria]     = useState<Categoria>('tutte');
  const [sortDir,       setSortDir]       = useState<SortDir>(null);

  // Debounce ricerca: aggiorna `cerca` 300ms dopo l'ultima digitazione
  useEffect(() => {
    const t = setTimeout(() => setCerca(cercaInput.trim()), 300);
    return () => clearTimeout(t);
  }, [cercaInput]);

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
  const cntDaFare = useMemo(() => all.filter(l => (STATI_DA_FARE as string[]).includes(l.stato)).length, [all]);

  // Base filtrata per sezione (su cui si calcolano i conteggi categoria)
  const baseSezione = useMemo(
    () => sezione === 'da_fare' ? all.filter(l => (STATI_DA_FARE as string[]).includes(l.stato)) : all,
    [all, sezione],
  );
  const cntLavori     = useMemo(() => baseSezione.filter(l => l.categoria === 'Lavoro').length,     [baseSezione]);
  const cntAssistenze = useMemo(() => baseSezione.filter(l => l.categoria === 'Assistenza').length, [baseSezione]);

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

  // ── Righe visibili: sezione → categoria → sort ──
  const righe = useMemo<LavoroList[]>(() => {
    let items = baseSezione;
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
  }, [baseSezione, categoria, sortDir]);

  const changeSezione = (s: Sezione) => { setSezione(s); setStato(''); };
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
        <Link to="/lavori/calendario"
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors flex-shrink-0">
          <Calendar size={16} />
          <span className="hidden sm:inline">Calendario</span>
        </Link>
      </div>

      {/* Toggle sezione */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {([
          { key: 'da_fare', label: 'Da fare', cnt: cntDaFare   },
          { key: 'tutti',   label: 'Tutti',   cnt: all.length  },
        ] as { key: Sezione; label: string; cnt: number }[]).map(({ key, label, cnt }) => (
          <button
            key={key}
            onClick={() => changeSezione(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              sezione === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              sezione === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
            }`}>{cnt}</span>
          </button>
        ))}
      </div>

      {/* Filtro secondario categoria (chip) */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {([
          { key: 'tutte',      label: 'Tutti',      cnt: baseSezione.length },
          { key: 'Lavoro',     label: 'Lavori',     cnt: cntLavori          },
          { key: 'Assistenza', label: 'Assistenze', cnt: cntAssistenze      },
        ] as { key: Categoria; label: string; cnt: number }[]).map(({ key, label, cnt }) => (
          <button
            key={key}
            onClick={() => setCategoria(key)}
            aria-pressed={categoria === key}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex-shrink-0 ${
              categoria === key
                ? key === 'Assistenza'
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              categoria === key
                ? key === 'Assistenza' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500'
            }`}>{cnt}</span>
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
            placeholder="Cerca per cliente, descrizione, città..."
            aria-label="Cerca lavori"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-gray-400 flex-shrink-0" />
          <select
            value={stato}
            onChange={e => setStato(e.target.value)}
            className="flex-1 min-w-[140px] border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {STATI_PER_SEZIONE[sezione].map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
          <SkeletonRows rows={8} />
        ) : righe.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Wrench size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">Nessun lavoro trovato</p>
            <p className="text-sm mt-1 text-gray-500">Prova a cambiare i filtri</p>
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
