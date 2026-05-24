import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, Package,
  ArrowUpDown, ArrowUp, ArrowDown, Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { consegneService } from '../services/consegne.service';
import { StatoBadge } from '../components/ui/StatoBadge';
import { format } from 'date-fns';
import type { ConsegnaList, StatoConsegna } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

type Sezione = 'tutte' | 'da_fare' | 'fatte';
type SortDir = 'asc' | 'desc' | null;

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
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [cerca,       setCerca]       = useState('');
  const [cercaInput,  setCercaInput]  = useState('');
  const [sezione,     setSezione]     = useState<Sezione>('tutte');
  const [statoFiltro, setStatoFiltro] = useState('');
  const [sortDir,     setSortDir]     = useState<SortDir>(null);

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
        const da = a.dataPrevistaConsegna ?? '';
        const db = b.dataPrevistaConsegna ?? '';
        if (!da && !db) return 0;
        if (!da) return 1;   // null sempre in fondo
        if (!db) return -1;
        return sortDir === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
      });
    }
    return items;
  }, [all, sezione, statoFiltro, sortDir]);

  // ── Handlers ──
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setCerca(cercaInput); };

  const changeSezione = (s: Sezione) => { setSezione(s); setStatoFiltro(''); };

  const cycleSort = () =>
    setSortDir(d => d === null ? 'asc' : d === 'asc' ? 'desc' : null);

  // ── Sort icon ──
  const SortIcon = sortDir === 'asc' ? ArrowUp : sortDir === 'desc' ? ArrowDown : ArrowUpDown;
  const sortColor = sortDir ? 'text-blue-600' : 'text-gray-400';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consegne</h1>
          {data && <p className="text-sm text-gray-500 mt-0.5">{righe.length} / {data.total} totali</p>}
        </div>
        {isAdmin && (
          <Link to="/consegne/nuova"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0">
            <Plus size={15} />
            <span className="hidden sm:inline">Nuova consegna</span>
            <span className="sm:hidden">Nuova</span>
          </Link>
        )}
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
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={cercaInput}
            onChange={e => { setCercaInput(e.target.value); if (!e.target.value) { setCercaInput(''); setCerca(''); } }}
            placeholder="Cerca per cliente, ordine, città..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </form>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Filter size={15} className="text-gray-400 flex-shrink-0" />
            <select
              value={statoFiltro}
              onChange={e => setStatoFiltro(e.target.value)}
              className="flex-1 sm:w-44 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
            >
              {STATI_PER_SEZIONE[sezione].map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          {/* Sort by date */}
          <button
            onClick={cycleSort}
            title={sortDir === 'asc' ? 'Ordine crescente' : sortDir === 'desc' ? 'Ordine decrescente' : 'Ordina per data prevista'}
            className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              sortDir
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SortIcon size={14} className={sortColor} />
            <span className="hidden sm:inline">Data</span>
          </button>
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm">Caricamento...</p>
            </div>
          </div>
        ) : righe.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package size={40} className="mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">Nessuna consegna trovata</p>
            <p className="text-sm mt-1">Prova a cambiare i filtri</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Ordine</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Prodotto</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Da ritirare</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
                    {/* Sortable date header */}
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      <button
                        onClick={cycleSort}
                        className={`flex items-center gap-1.5 hover:text-blue-600 transition-colors ${sortDir ? 'text-blue-600' : ''}`}
                      >
                        Data prevista
                        <SortIcon size={13} className={sortColor} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Trasportatore</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      <span className="flex items-center gap-1"><Clock size={13} /> Orario</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {righe.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/consegne/${c.id}`)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-gray-500">#{c.numeroOrdine}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-blue-700">{c.clienteNome}</p>
                        <p className="text-xs text-gray-400">{c.clienteCitta}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-700 truncate max-w-[180px]">{c.prodottoDescrizione}</p>
                        {c.quantita > 1 && <p className="text-xs text-gray-400">Qtà {c.quantita}</p>}
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
                      <td className="px-4 py-3.5 text-gray-500 text-xs">
                        {c.trasportatoreNome ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">
                        {c.fasciaDalle
                          ? <span className="font-medium">{c.fasciaDalle}{c.fasciaAlle ? ` – ${c.fasciaAlle}` : ''}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {righe.map(c => (
                <Link key={c.id} to={`/consegne/${c.id}`}
                  className="flex flex-col gap-2 p-4 hover:bg-gray-50 active:bg-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{c.clienteNome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.clienteCitta} · #{c.numeroOrdine}</p>
                    </div>
                    <StatoBadge stato={c.stato as StatoConsegna} />
                  </div>
                  <p className="text-sm text-gray-600 truncate">{c.prodottoDescrizione}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">€ {c.importoDaPagare.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      {c.pagamentoRicevuto && <span className="text-xs text-green-600 font-medium">✓ Ritirato</span>}
                      {c.dataPrevistaConsegna && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(c.dataPrevistaConsegna), 'dd/MM/yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
