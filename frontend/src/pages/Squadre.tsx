import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Wrench, Loader2, X, ChevronDown } from 'lucide-react';
import { squadreService } from '../services/squadre.service';
import { authService } from '../services/auth.service';

const COLORI_PRESET = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
  '#22c55e', '#14b8a6', '#f59e0b', '#ef4444',
];

const SPECIALIZZAZIONI_OPTIONS = [
  'Bagno', 'VascaInDoccia', 'Clima', 'Cucina', 'Pavimenti', 'Elettrico', 'Idraulica',
];

export default function Squadre() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: squadre, isLoading } = useQuery({
    queryKey: ['squadre'],
    queryFn: () => squadreService.getSquadre(),
  });

  const { data: caposquadre } = useQuery({
    queryKey: ['utenti'],
    queryFn: authService.getUtenti,
  });

  const { data: utentiDisponibili } = useQuery({
    queryKey: ['utentiDisponibili'],
    queryFn: squadreService.getUtentiDisponibili,
    enabled: showModal,
  });

  const { mutate: crea, isPending } = useMutation({
    mutationFn: squadreService.creaSquadra,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['squadre'] });
      qc.invalidateQueries({ queryKey: ['utentiDisponibili'] });
      setShowModal(false);
    },
  });

  const [form, setForm] = useState({
    nome: '',
    descrizione: '',
    colore: '#3b82f6',
    specializzazioni: [] as string[],
    caposquadraId: undefined as number | undefined,
    membroIds: [] as number[],
  });

  const handleCrea = () => {
    if (!form.nome) return;
    crea({
      nome: form.nome,
      descrizione: form.descrizione || undefined,
      colore: form.colore,
      specializzazioni: form.specializzazioni.join(',') || undefined,
      caposquadraId: form.caposquadraId,
      membroIds: form.membroIds,
    });
  };

  const resetForm = () => setForm({
    nome: '', descrizione: '', colore: '#3b82f6',
    specializzazioni: [], caposquadraId: undefined, membroIds: [],
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Squadre installazione</h1>
          <p className="text-sm text-gray-500 mt-0.5">{squadre?.length ?? 0} squadre</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus size={16} />
          Nuova squadra
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-400" />
        </div>
      ) : !squadre?.length ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Users size={40} className="mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">Nessuna squadra</p>
          <p className="text-sm mt-1">Crea la prima squadra per iniziare</p>
        </div>
      ) : (
        <div className="space-y-3">
          {squadre.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
              >
                {/* Colore squadra */}
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: s.colore + '20' }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.colore }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{s.nome}</p>
                    {!s.isActive && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inattiva</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.caposquadraNome ? `Capo: ${s.caposquadraNome}` : 'Nessun caposquadra'} •{' '}
                    {s.numMembri} {s.numMembri === 1 ? 'membro' : 'membri'}
                    {s.specializzazioni && ` • ${s.specializzazioni.split(',').join(', ')}`}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm flex-shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="font-bold text-gray-900">{s.lavoriAttivi}</p>
                    <p className="text-xs text-gray-400">Lavori attivi</p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${expanded === s.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded: dettaglio membri */}
              {expanded === s.id && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} className="text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Membri squadra</p>
                  </div>
                  {s.numMembri === 0 ? (
                    <p className="text-sm text-gray-400">Nessun membro assegnato</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* I membri completi vengono dal getSquadra(id), qui mostriamo il count */}
                      <p className="text-sm text-gray-500 col-span-2">
                        {s.numMembri} {s.numMembri === 1 ? 'membro' : 'membri'} in questa squadra
                      </p>
                    </div>
                  )}

                  {s.specializzazioni && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.specializzazioni.split(',').map(spec => (
                        <span key={spec} className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: s.colore + '20', color: s.colore }}>
                          {spec.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal nuova squadra */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Nuova squadra</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome squadra *</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="es. Squadra Bagni Nord" />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                  placeholder="Note sulla squadra..." />
              </div>

              {/* Colore */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Colore nel calendario</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORI_PRESET.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, colore: c }))}
                      className={`w-8 h-8 rounded-full transition-all ${form.colore === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                  <input type="color" value={form.colore}
                    onChange={e => setForm(f => ({ ...f, colore: e.target.value }))}
                    className="w-8 h-8 rounded-full cursor-pointer border-0" title="Colore personalizzato" />
                </div>
              </div>

              {/* Specializzazioni */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specializzazioni</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZZAZIONI_OPTIONS.map(spec => (
                    <button key={spec}
                      onClick={() => setForm(f => ({
                        ...f,
                        specializzazioni: f.specializzazioni.includes(spec)
                          ? f.specializzazioni.filter(s => s !== spec)
                          : [...f.specializzazioni, spec]
                      }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.specializzazioni.includes(spec)
                          ? 'text-white border-transparent'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                      style={form.specializzazioni.includes(spec)
                        ? { backgroundColor: form.colore }
                        : undefined}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caposquadra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caposquadra</label>
                <select value={form.caposquadraId ?? ''}
                  onChange={e => setForm(f => ({ ...f, caposquadraId: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="">Seleziona caposquadra...</option>
                  {caposquadre?.filter(u => u.role === 'Caposquadra' || u.role === 'Trasportatore').map(u => (
                    <option key={u.id} value={u.id}>{u.nome} {u.cognome} ({u.role})</option>
                  ))}
                </select>
              </div>

              {/* Membri */}
              {utentiDisponibili && utentiDisponibili.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membri ({form.membroIds.length} selezionati)
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-50">
                    {utentiDisponibili.map(u => (
                      <label key={u.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox"
                          checked={form.membroIds.includes(u.id)}
                          onChange={e => setForm(f => ({
                            ...f,
                            membroIds: e.target.checked
                              ? [...f.membroIds, u.id]
                              : f.membroIds.filter(id => id !== u.id)
                          }))}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">{u.nome} {u.cognome}</span>
                        <span className="text-xs text-gray-400 ml-auto">{u.role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Annulla
                </button>
                <button onClick={handleCrea} disabled={isPending || !form.nome}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium">
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {isPending ? 'Creazione...' : 'Crea squadra'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function _WorkIcon() { return <Wrench size={14} />; }
