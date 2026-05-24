import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { consegneService } from '../services/consegne.service';
import { authService } from '../services/auth.service';

const articoloSchema = z.object({
  codice:     z.string().optional(),
  descrizione: z.string().min(1, 'Descrizione obbligatoria'),
  quantita:   z.coerce.number().min(1),
});

const schema = z.object({
  numeroOrdine: z.string().min(1, 'Obbligatorio'),
  dataOrdine: z.string().min(1, 'Obbligatorio'),
  clienteNome: z.string().min(1, 'Obbligatorio'),
  clienteIndirizzo: z.string().min(1, 'Obbligatorio'),
  clienteCitta: z.string().min(1, 'Obbligatorio'),
  clienteCap: z.string().min(5, 'CAP non valido').max(5),
  clienteProvincia: z.string().min(2).max(2),
  clienteTelefono: z.string().optional(),
  clienteEmail: z.string().email('Email non valida').optional().or(z.literal('')),
  clienteNote: z.string().optional(),
  articoli: z.array(articoloSchema).min(1, 'Aggiungi almeno un articolo'),
  importoDaPagare: z.coerce.number().min(0),
  modalitaPagamento: z.string().optional(),
  trasportatoreId: z.coerce.number().optional(),
  noteInterne: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NuovaConsegna() {
  const navigate = useNavigate();

  const { data: trasportatori } = useQuery({
    queryKey: ['trasportatori'],
    queryFn: authService.getTrasportatori,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({ resolver: zodResolver(schema) as any, defaultValues: {
      dataOrdine: new Date().toISOString().split('T')[0],
      articoli: [{ codice: '', descrizione: '', quantita: 1 }],
      importoDaPagare: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'articoli' });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: FormData) => consegneService.creaConsegna({
      ...data,
      dataOrdine: data.dataOrdine + 'T00:00:00Z',
      clienteEmail: data.clienteEmail || undefined,
      trasportatoreId: data.trasportatoreId || undefined,
      articoli: data.articoli.map(a => ({
        codice: a.codice || undefined,
        descrizione: a.descrizione,
        quantita: Number(a.quantita),
      })),
    }),
    onSuccess: (consegna) => navigate(`/consegne/${consegna.id}`),
  });

  const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Nuova consegna</h1>
      </div>

      {errMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{errMsg}</div>
      )}

      <form onSubmit={handleSubmit((d) => mutate(d as FormData))} className="space-y-6">
        {/* Ordine */}
        <FormSection title="Dati ordine">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Numero ordine *" error={errors.numeroOrdine?.message}>
              <input {...register('numeroOrdine')} className={inputClass(!!errors.numeroOrdine)} placeholder="ORD-2024-001" />
            </Field>
            <Field label="Data ordine *" error={errors.dataOrdine?.message}>
              <input {...register('dataOrdine')} type="date" className={inputClass(!!errors.dataOrdine)} />
            </Field>
          </div>
        </FormSection>

        {/* Cliente */}
        <FormSection title="Dati cliente">
          <Field label="Nome cliente *" error={errors.clienteNome?.message}>
            <input {...register('clienteNome')} className={inputClass(!!errors.clienteNome)} placeholder="Mario Rossi" />
          </Field>
          <Field label="Indirizzo *" error={errors.clienteIndirizzo?.message}>
            <input {...register('clienteIndirizzo')} className={inputClass(!!errors.clienteIndirizzo)} placeholder="Via Roma 1" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="CAP *" error={errors.clienteCap?.message}>
              <input {...register('clienteCap')} className={inputClass(!!errors.clienteCap)} placeholder="20100" maxLength={5} />
            </Field>
            <Field label="Città *" error={errors.clienteCitta?.message}>
              <input {...register('clienteCitta')} className={inputClass(!!errors.clienteCitta)} placeholder="Milano" />
            </Field>
            <Field label="Prov. *" error={errors.clienteProvincia?.message}>
              <input {...register('clienteProvincia')} className={inputClass(!!errors.clienteProvincia)} placeholder="MI" maxLength={2} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Telefono" error={errors.clienteTelefono?.message}>
              <input {...register('clienteTelefono')} className={inputClass(false)} placeholder="+39 02 1234567" />
            </Field>
            <Field label="Email" error={errors.clienteEmail?.message}>
              <input {...register('clienteEmail')} type="email" className={inputClass(!!errors.clienteEmail)} placeholder="cliente@email.it" />
            </Field>
          </div>
          <Field label="Note cliente">
            <textarea {...register('clienteNote')} rows={2} className={inputClass(false) + ' resize-none'} placeholder="Citofono, piano, orari..." />
          </Field>
        </FormSection>

        {/* Articoli */}
        <FormSection title="Articoli">
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-400 font-mono mt-3 w-5 flex-shrink-0">{idx + 1}</span>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_120px_60px] gap-2">
                  <div>
                    <input
                      {...register(`articoli.${idx}.descrizione`)}
                      placeholder="Descrizione articolo *"
                      className={inputClass(!!errors.articoli?.[idx]?.descrizione)}
                    />
                    {errors.articoli?.[idx]?.descrizione && (
                      <p className="mt-1 text-xs text-red-500">{errors.articoli[idx]?.descrizione?.message}</p>
                    )}
                  </div>
                  <input
                    {...register(`articoli.${idx}.codice`)}
                    placeholder="Codice (opz.)"
                    className={inputClass(false)}
                  />
                  <input
                    {...register(`articoli.${idx}.quantita`)}
                    type="number" min={1}
                    placeholder="Qtà"
                    className={inputClass(false)}
                  />
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="mt-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                    title="Rimuovi articolo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.articoli?.root?.message && (
            <p className="text-xs text-red-500">{errors.articoli.root.message}</p>
          )}
          <button
            type="button"
            onClick={() => append({ codice: '', descrizione: '', quantita: 1 })}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
          >
            <Plus size={14} /> Aggiungi articolo
          </button>
        </FormSection>

        {/* Pagamento */}
        <FormSection title="Pagamento">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Importo da ritirare (€) *" error={errors.importoDaPagare?.message}>
              <input {...register('importoDaPagare')} type="number" step="0.01" min={0} className={inputClass(!!errors.importoDaPagare)} />
            </Field>
            <Field label="Modalità pagamento">
              <select {...register('modalitaPagamento')} className={inputClass(false) + ' bg-white'}>
                <option value="">Seleziona...</option>
                <option value="Contanti">Contanti</option>
                <option value="POS">POS/Carta</option>
                <option value="Bonifico">Bonifico</option>
                <option value="Assegno">Assegno</option>
                <option value="Prepagato">Prepagato</option>
              </select>
            </Field>
          </div>
        </FormSection>

        {/* Trasportatore */}
        <FormSection title="Assegnazione">
          <Field label="Trasportatore">
            <select {...register('trasportatoreId')} className={inputClass(false) + ' bg-white'}>
              <option value="">Da assegnare</option>
              {trasportatori?.map(t => (
                <option key={t.id} value={t.id}>{t.nome} {t.cognome}</option>
              ))}
            </select>
          </Field>
          <Field label="Note interne">
            <textarea {...register('noteInterne')} rows={2} className={inputClass(false) + ' resize-none'} placeholder="Note visibili solo allo staff..." />
          </Field>
        </FormSection>

        <div className="flex gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isPending ? 'Creazione...' : 'Crea consegna'}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors outline-none ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
  }`;
}
