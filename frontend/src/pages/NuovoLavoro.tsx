import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { lavoriService } from '../services/lavori.service';
import { squadreService } from '../services/squadre.service';
import { TIPO_OPTIONS } from '../components/ui/LavoroBadges';

const TURNO_FASCE = {
  Mattina:    { dalle: '08:00', alle: '13:00' },
  Pomeriggio: { dalle: '14:00', alle: '18:00' },
} as const;

const schema = z.object({
  categoria:       z.enum(['Lavoro', 'Assistenza']).default('Lavoro'),
  tipo:            z.enum(['Bagno', 'VascaInDoccia', 'Clima', 'Cucina', 'Pavimenti', 'Elettrico', 'Idraulica', 'Altro']),
  descrizione:     z.string().min(1, 'Obbligatorio'),
  priorita:        z.enum(['Bassa', 'Media', 'Alta', 'Urgente']).default('Media'),
  clienteNome:     z.string().min(1, 'Obbligatorio'),
  clienteIndirizzo: z.string().min(1, 'Obbligatorio'),
  clienteCitta:    z.string().min(1, 'Obbligatorio'),
  clienteCap:      z.string().min(1, 'Obbligatorio'),
  clienteProvincia: z.string().min(2).max(2, 'Due lettere').toUpperCase(),
  clienteTelefono: z.string().optional(),
  clienteEmail:    z.string().email('Email non valida').optional().or(z.literal('')),
  clienteNote:     z.string().optional(),
  dataInizio:      z.string().optional(),
  dataFine:        z.string().optional(),
  turno:           z.enum(['Mattina', 'Pomeriggio']).optional(),
  fasciaDalle:     z.string().optional(),
  fasciaAlle:      z.string().optional(),
  durataStimataOre: z.coerce.number().positive().optional().or(z.literal('')),
  squadraId:       z.coerce.number().optional().or(z.literal('')),
  notePerSquadra:  z.string().optional(),
  noteInterne:     z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inp = (hasError: boolean) =>
  `w-full border ${hasError ? 'border-red-400' : 'border-gray-300'} rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400`;

export default function NuovoLavoro() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();

  const { data: squadre } = useQuery({
    queryKey: ['squadre'],
    queryFn: () => squadreService.getSquadre(true),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (d: FormData) => {
      const isAssistenza = d.categoria === 'Assistenza';
      const fasciaDalle  = isAssistenza && d.turno ? TURNO_FASCE[d.turno].dalle : (d.fasciaDalle || undefined);
      const fasciaAlle   = isAssistenza && d.turno ? TURNO_FASCE[d.turno].alle  : (d.fasciaAlle  || undefined);

      return lavoriService.creaLavoro({
        categoria:       d.categoria,
        tipo:            d.tipo,
        descrizione:     d.descrizione,
        priorita:        d.priorita,
        clienteNome:     d.clienteNome,
        clienteIndirizzo: d.clienteIndirizzo,
        clienteCitta:    d.clienteCitta,
        clienteCap:      d.clienteCap,
        clienteProvincia: d.clienteProvincia,
        clienteTelefono: d.clienteTelefono || undefined,
        clienteEmail:    d.clienteEmail    || undefined,
        clienteNote:     d.clienteNote     || undefined,
        dataInizio:      d.dataInizio      || undefined,
        dataFine:        d.dataFine        || undefined,
        turno:           isAssistenza ? d.turno : undefined,
        fasciaDalle,
        fasciaAlle,
        durataStimataOre: d.durataStimataOre ? Number(d.durataStimataOre) : undefined,
        squadraId:        d.squadraId ? Number(d.squadraId) : undefined,
        notePerSquadra:   d.notePerSquadra || undefined,
        noteInterne:      d.noteInterne    || undefined,
      });
    },
    onSuccess: (lavoro) => {
      qc.invalidateQueries({ queryKey: ['lavori'] });
      navigate(`/lavori/${lavoro.id}`);
    },
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { categoria: 'Lavoro', tipo: 'Bagno', priorita: 'Media' },
  });

  const categoriaWatch = watch('categoria');
  const turnoWatch     = watch('turno');
  const dataInizio     = watch('dataInizio');

  const isAssistenza = categoriaWatch === 'Assistenza';

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/lavori')}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuova installazione</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAssistenza ? 'Assistenza / intervento rapido' : 'Lavoro di installazione completo'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d as FormData))} className="space-y-6">

        {/* ── Categoria ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Tipo di installazione</h2>

          {/* Selector Lavoro / Assistenza */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(['Lavoro', 'Assistenza'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setValue('categoria', cat);
                  if (cat === 'Lavoro') setValue('turno', undefined);
                }}
                className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  categoriaWatch === cat
                    ? cat === 'Lavoro'
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat === 'Lavoro' ? '🏗️ Lavoro' : '🔧 Assistenza'}
                <p className={`text-xs font-normal mt-0.5 ${
                  categoriaWatch === cat
                    ? cat === 'Lavoro' ? 'text-indigo-500' : 'text-amber-500'
                    : 'text-gray-400'
                }`}>
                  {cat === 'Lavoro' ? 'Max 1 per squadra/giorno' : 'Max 2/giorno (mat. + pom.)'}
                </p>
              </button>
            ))}
          </div>

          {/* Tipo specifico + Priorità */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo intervento *</label>
              <select {...register('tipo')} className={inp(!!errors.tipo) + ' bg-white'}>
                {TIPO_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.tipo && <p className="text-xs text-red-500 mt-1">{errors.tipo.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorità *</label>
              <select {...register('priorita')} className={inp(false) + ' bg-white'}>
                <option value="Bassa">Bassa</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione *</label>
            <textarea
              {...register('descrizione')}
              rows={3}
              placeholder={isAssistenza
                ? 'Descrizione del problema o intervento richiesto...'
                : 'Descrizione del lavoro da eseguire...'}
              className={inp(!!errors.descrizione) + ' resize-none'}
            />
            {errors.descrizione && <p className="text-xs text-red-500 mt-1">{errors.descrizione.message}</p>}
          </div>
        </section>

        {/* ── Cliente ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dati cliente</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome cliente *</label>
              <input {...register('clienteNome')} placeholder="Mario Rossi" className={inp(!!errors.clienteNome)} />
              {errors.clienteNome && <p className="text-xs text-red-500 mt-1">{errors.clienteNome.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo *</label>
              <input {...register('clienteIndirizzo')} placeholder="Via Roma 1" className={inp(!!errors.clienteIndirizzo)} />
              {errors.clienteIndirizzo && <p className="text-xs text-red-500 mt-1">{errors.clienteIndirizzo.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CAP *</label>
                <input {...register('clienteCap')} placeholder="20100" className={inp(!!errors.clienteCap)} />
                {errors.clienteCap && <p className="text-xs text-red-500 mt-1">{errors.clienteCap.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Città *</label>
                <input {...register('clienteCitta')} placeholder="Milano" className={inp(!!errors.clienteCitta)} />
                {errors.clienteCitta && <p className="text-xs text-red-500 mt-1">{errors.clienteCitta.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prov. *</label>
                <input {...register('clienteProvincia')} placeholder="MI" maxLength={2} className={inp(!!errors.clienteProvincia)} />
                {errors.clienteProvincia && <p className="text-xs text-red-500 mt-1">{errors.clienteProvincia.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <input {...register('clienteTelefono')} placeholder="+39 02 1234567" className={inp(false)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...register('clienteEmail')} type="email" placeholder="cliente@email.it" className={inp(!!errors.clienteEmail)} />
                {errors.clienteEmail && <p className="text-xs text-red-500 mt-1">{errors.clienteEmail.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note cliente</label>
              <textarea {...register('clienteNote')} rows={2} placeholder="Citofono, piano, istruzioni di accesso..." className={inp(false) + ' resize-none'} />
            </div>
          </div>
        </section>

        {/* ── Pianificazione ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Pianificazione</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data inizio</label>
              <input {...register('dataInizio')} type="date" className={inp(false)} />
            </div>
            {!isAssistenza && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data fine</label>
                <input {...register('dataFine')} type="date" min={dataInizio} className={inp(false)} />
              </div>
            )}
          </div>

          {/* Fascia oraria: turno per assistenze, libera per lavori */}
          {isAssistenza ? (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Turno *</label>
              <div className="grid grid-cols-2 gap-3">
                {(['Mattina', 'Pomeriggio'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue('turno', t)}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                      turnoWatch === t
                        ? t === 'Mattina'
                          ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                          : 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {t === 'Mattina' ? '🌅 Mattina' : '🌇 Pomeriggio'}
                    <p className="text-xs font-normal mt-0.5 text-gray-400">
                      {TURNO_FASCE[t].dalle} – {TURNO_FASCE[t].alle}
                    </p>
                  </button>
                ))}
              </div>
              {errors.turno && <p className="text-xs text-red-500 mt-1">Seleziona un turno</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orario inizio</label>
                <input {...register('fasciaDalle')} type="time" className={inp(false)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orario fine</label>
                <input {...register('fasciaAlle')} type="time" className={inp(false)} />
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Durata stimata (ore)</label>
            <input {...register('durataStimataOre')} type="number" min={0.5} step={0.5}
              placeholder={isAssistenza ? 'es. 2' : 'es. 8'} className={inp(false) + ' sm:w-48'} />
          </div>
        </section>

        {/* ── Squadra ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Squadra &amp; note</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assegna squadra</label>
              <select {...register('squadraId')} className={inp(false) + ' bg-white'}>
                <option value="">Nessuna squadra</option>
                {squadre?.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note per la squadra</label>
              <textarea {...register('notePerSquadra')} rows={3}
                placeholder="Istruzioni operative, materiali da portare, accesso..."
                className={inp(false) + ' resize-none'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note interne</label>
              <textarea {...register('noteInterne')} rows={2}
                placeholder="Note riservate (non visibili alla squadra)..."
                className={inp(false) + ' resize-none'} />
            </div>
          </div>
        </section>

        {/* ── Azioni ── */}
        <div className="flex gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate('/lavori')}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? 'Creazione...' : `Crea ${isAssistenza ? 'assistenza' : 'lavoro'}`}
          </button>
        </div>
      </form>
    </div>
  );
}
