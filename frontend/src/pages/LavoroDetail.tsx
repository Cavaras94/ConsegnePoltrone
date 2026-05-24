import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Phone, Mail, Calendar, FileText,
  Upload, Download, Trash2, CheckCircle, Loader2, AlertCircle, Info, Wrench, Eye
} from 'lucide-react';
import DocumentPreview from '../components/ui/DocumentPreview';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import { lavoriService } from '../services/lavori.service';
import { StatoLavoroBadge, TIPO_LABELS, CategoriaBadge } from '../components/ui/LavoroBadges';
import type { StatoLavoro, TipoLavoro, TipoDocumentoLavoro, EsitoLavoro } from '../types';

const STATI_LAVORO: StatoLavoro[] = ['DaPianificare', 'Pianificato', 'InCorso', 'Completato', 'Sospeso', 'Annullato'];
const STATI_LABELS: Record<StatoLavoro, string> = {
  DaPianificare: 'Da pianificare', Pianificato: 'Pianificato', InCorso: 'In corso',
  Completato: 'Completato ✓', Sospeso: 'Sospeso', Annullato: 'Annullato',
};

const ESITI: EsitoLavoro[] = ['Completato', 'ParzialmenteCompletato', 'ProblemiRiscontrati', 'ClienteAssente', 'Annullato'];
const ESITI_LABELS: Record<EsitoLavoro, string> = {
  Completato: 'Completato ✓', ParzialmenteCompletato: 'Parzialmente completato',
  ProblemiRiscontrati: 'Problemi riscontrati', ClienteAssente: 'Cliente assente', Annullato: 'Annullato',
};

const TIPI_DOC: TipoDocumentoLavoro[] = ['Preventivo', 'ContrattoFirmato', 'SchedaTecnica', 'FotoPrima', 'FotoDopo', 'RapportinoFirmato', 'Altro'];
const TIPI_DOC_LABELS: Record<TipoDocumentoLavoro, string> = {
  Preventivo: '📄 Preventivo', ContrattoFirmato: '✍️ Contratto firmato',
  SchedaTecnica: '📋 Scheda tecnica', FotoPrima: '📷 Foto prima',
  FotoDopo: '📸 Foto dopo', RapportinoFirmato: '📝 Rapportino firmato', Altro: '📎 Altro',
};

export default function LavoroDetail() {
  const { id } = useParams<{ id: string }>();
  const lavoroId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin, isManager, user } = useAuth();
  const isCaposquadra = user?.role === 'Caposquadra';

  const [showStato, setShowStato] = useState(false);
  const [showEsito, setShowEsito] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ id: number; nomeFileOriginale: string; contentType: string } | null>(null);

  const { data: lavoro, isLoading } = useQuery({
    queryKey: ['lavoro', lavoroId],
    queryFn: () => lavoriService.getLavoro(lavoroId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['lavoro', lavoroId] });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={32} className="animate-spin text-blue-400" />
    </div>
  );

  if (!lavoro) return <div className="p-6 text-gray-500">Lavoro non trovato</div>;

  const canEdit = isAdmin || isCaposquadra;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CategoriaBadge categoria={lavoro.categoria} />
            <h1 className="text-xl font-bold text-gray-900 w-full sm:w-auto">
              {TIPO_LABELS[lavoro.tipo as TipoLavoro]} — {lavoro.descrizione}
            </h1>
            <StatoLavoroBadge stato={lavoro.stato as StatoLavoro} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            #{lavoro.numeroLavoro} •{' '}
            {lavoro.squadraNome ? (
              <span className="font-medium" style={{ color: lavoro.squadraColore ?? '#3b82f6' }}>
                {lavoro.squadraNome}
              </span>
            ) : 'Squadra non assegnata'}
          </p>
        </div>
        {isAdmin && (
          <a href={`/lavori/${lavoroId}/modifica`}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Modifica
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna sinistra */}
        <div className="lg:col-span-2 space-y-5">
          {/* Cliente */}
          <Section title="Dati cliente" icon={<MapPin size={16} className="text-blue-500" />}>
            <InfoRow label="Nome" value={lavoro.clienteNome} />
            <InfoRow label="Indirizzo" value={`${lavoro.clienteIndirizzo}, ${lavoro.clienteCap} ${lavoro.clienteCitta} (${lavoro.clienteProvincia})`} />
            {lavoro.clienteTelefono && (
              <InfoRow label="Telefono" value={
                <a href={`tel:${lavoro.clienteTelefono}`} className="text-blue-600 flex items-center gap-1">
                  <Phone size={12} />{lavoro.clienteTelefono}
                </a>
              } />
            )}
            {lavoro.clienteEmail && (
              <InfoRow label="Email" value={
                <a href={`mailto:${lavoro.clienteEmail}`} className="text-blue-600 flex items-center gap-1">
                  <Mail size={12} />{lavoro.clienteEmail}
                </a>
              } />
            )}
            {lavoro.clienteNote && <InfoRow label="Note" value={lavoro.clienteNote} />}
          </Section>

          {/* Note per la squadra */}
          {lavoro.notePerSquadra && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info size={15} className="text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-800">Note dalla direzione</span>
              </div>
              <p className="text-sm text-yellow-700">{lavoro.notePerSquadra}</p>
            </div>
          )}

          {/* Documenti */}
          <Section
            title={`Documenti (${lavoro.documenti.length})`}
            icon={<FileText size={16} className="text-purple-500" />}
            action={
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Upload size={13} /> Carica
              </button>
            }
          >
            {lavoro.documenti.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Nessun documento</p>
            ) : (
              <div className="space-y-2">
                {lavoro.documenti.map((doc: { id: number; nomeFileOriginale: string; contentType: string; tipo: string; dataUpload: string; uploadedByNome: string }) => (
                  <div key={doc.id} className="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-lg flex-shrink-0">{TIPI_DOC_LABELS[doc.tipo as TipoDocumentoLavoro]?.split(' ')[0]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.nomeFileOriginale}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {TIPI_DOC_LABELS[doc.tipo as TipoDocumentoLavoro]?.slice(2)} •{' '}
                        {format(new Date(doc.dataUpload), 'dd/MM/yyyy')} •{' '}
                        {doc.uploadedByNome}
                      </p>
                    </div>
                    {/* Always visible on mobile, hover-reveal on desktop */}
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => setPreviewDoc({ id: doc.id, nomeFileOriginale: doc.nomeFileOriginale, contentType: doc.contentType })}
                        className="p-2 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 active:bg-blue-100"
                        title="Anteprima"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => lavoriService.downloadDocumento(lavoroId, doc.id, doc.nomeFileOriginale)}
                        className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 active:bg-gray-200"
                        title="Scarica"
                      >
                        <Download size={15} />
                      </button>
                      {isAdmin && (
                        <DeleteDocBtn lavoroId={lavoroId} docId={doc.id} onSuccess={invalidate} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Colonna destra */}
        <div className="space-y-5">
          {/* Pianificazione */}
          <Section title="Pianificazione" icon={<Calendar size={16} className="text-blue-500" />}>
            {lavoro.dataInizio ? (
              <>
                <InfoRow label="Inizio" value={format(new Date(lavoro.dataInizio), 'dd MMMM yyyy', { locale: it })} />
                {lavoro.dataFine && lavoro.dataFine !== lavoro.dataInizio && (
                  <InfoRow label="Fine" value={format(new Date(lavoro.dataFine), 'dd MMMM yyyy', { locale: it })} />
                )}
                {/* Turno per assistenze, fascia oraria per lavori */}
                {lavoro.categoria === 'Assistenza' && lavoro.turno ? (
                  <InfoRow label="Turno" value={
                    <span className={`inline-flex items-center gap-1 font-semibold ${
                      lavoro.turno === 'Mattina' ? 'text-yellow-600' : 'text-indigo-600'
                    }`}>
                      {lavoro.turno === 'Mattina' ? '🌅' : '🌇'} {lavoro.turno}
                      {(lavoro.fasciaDalle || lavoro.fasciaAlle) && (
                        <span className="text-gray-400 font-normal text-xs ml-1">
                          ({lavoro.fasciaDalle ?? ''} – {lavoro.fasciaAlle ?? ''})
                        </span>
                      )}
                    </span>
                  } />
                ) : (lavoro.fasciaDalle || lavoro.fasciaAlle) ? (
                  <InfoRow label="Orario" value={`${lavoro.fasciaDalle ?? ''} – ${lavoro.fasciaAlle ?? ''}`} />
                ) : null}
                {lavoro.durataStimataOre && (
                  <InfoRow label="Durata stimata" value={`${lavoro.durataStimataOre} ore`} />
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">Non ancora pianificato</p>
            )}
            {lavoro.dataCompletamento && (
              <InfoRow label="Completato il" value={format(new Date(lavoro.dataCompletamento), 'dd/MM/yyyy')} />
            )}
            {lavoro.esito && (
              <InfoRow label="Esito" value={ESITI_LABELS[lavoro.esito as EsitoLavoro]} />
            )}
            {lavoro.noteEsito && (
              <InfoRow label="Note esito" value={lavoro.noteEsito} />
            )}
          </Section>

          {/* Azioni */}
          {canEdit && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Azioni</p>

              <button onClick={() => setShowStato(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors">
                <Wrench size={15} />
                Aggiorna stato
              </button>

              {(lavoro.stato === 'InCorso' || lavoro.stato === 'Pianificato') && (
                <button onClick={() => setShowEsito(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors">
                  <CheckCircle size={15} />
                  Inserisci esito
                </button>
              )}
            </div>
          )}

          {/* Note interne Admin */}
          {(isAdmin || isManager) && lavoro.noteInterne && (
            <Section title="Note interne" icon={<Info size={16} className="text-gray-400" />}>
              <p className="text-sm text-gray-600">{lavoro.noteInterne}</p>
            </Section>
          )}
        </div>
      </div>

      {/* Modali */}
      {showStato && (
        <AggiornaStatoModal
          lavoroId={lavoroId}
          statoCorrente={lavoro.stato as StatoLavoro}
          onClose={() => setShowStato(false)}
          onSuccess={() => { setShowStato(false); invalidate(); }}
        />
      )}

      {showEsito && (
        <AggiornaEsitoModal
          lavoroId={lavoroId}
          onClose={() => setShowEsito(false)}
          onSuccess={() => { setShowEsito(false); invalidate(); }}
        />
      )}

      {showUpload && (
        <UploadDocModal
          lavoroId={lavoroId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); invalidate(); }}
        />
      )}

      {previewDoc && (
        <DocumentPreview
          nome={previewDoc.nomeFileOriginale}
          contentType={previewDoc.contentType}
          fetchBlob={() => lavoriService.getBlobDocumento(lavoroId, previewDoc.id)}
          onClose={() => setPreviewDoc(null)}
          onDownload={() => {
            lavoriService.downloadDocumento(lavoroId, previewDoc.id, previewDoc.nomeFileOriginale);
            setPreviewDoc(null);
          }}
        />
      )}
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────

function Section({ title, icon, children, action }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        </div>
        {action}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}

function DeleteDocBtn({ lavoroId, docId, onSuccess }: { lavoroId: number; docId: number; onSuccess: () => void }) {
  const { mutate, isPending } = useMutation({
    mutationFn: () => lavoriService.eliminaDocumento(lavoroId, docId),
    onSuccess,
  });
  return (
    <button onClick={() => confirm('Eliminare questo documento?') && mutate()} disabled={isPending}
      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
      {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onClose, onConfirm, isPending, label, disabled = false }: {
  onClose: () => void; onConfirm: () => void; isPending: boolean; label: string; disabled?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
        Annulla
      </button>
      <button onClick={onConfirm} disabled={isPending || disabled}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium">
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {isPending ? 'Salvataggio...' : label}
      </button>
    </div>
  );
}

function AggiornaStatoModal({ lavoroId, statoCorrente, onClose, onSuccess }: {
  lavoroId: number; statoCorrente: StatoLavoro; onClose: () => void; onSuccess: () => void;
}) {
  const [stato, setStato] = useState<StatoLavoro>(statoCorrente);
  const [note, setNote] = useState('');
  const { mutate, isPending } = useMutation({
    mutationFn: () => lavoriService.aggiornaStato(lavoroId, stato, note || undefined),
    onSuccess,
  });
  return (
    <Modal title="Aggiorna stato lavoro" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {STATI_LAVORO.map(s => (
            <button key={s} onClick={() => setStato(s)}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${stato === s ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {STATI_LABELS[s]}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (visibili alla squadra)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            placeholder="Comunicazione alla squadra..." />
        </div>
        <ModalActions onClose={onClose} onConfirm={() => mutate()} isPending={isPending} label="Salva stato" />
      </div>
    </Modal>
  );
}

function AggiornaEsitoModal({ lavoroId, onClose, onSuccess }: {
  lavoroId: number; onClose: () => void; onSuccess: () => void;
}) {
  const [esito, setEsito] = useState<EsitoLavoro>('Completato');
  const [note, setNote] = useState('');
  const [errore, setErrore] = useState('');
  const { mutate, isPending } = useMutation({
    mutationFn: () => lavoriService.aggiornaEsito(lavoroId, esito, note || undefined),
    onSuccess,
    onError: () => setErrore('Errore nel salvataggio'),
  });
  return (
    <Modal title="Inserisci esito lavoro" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {ESITI.map(e => (
            <button key={e} onClick={() => setEsito(e)}
              className={`px-3 py-2 rounded-lg text-sm border text-left transition-colors ${esito === e
                ? e === 'Completato' ? 'border-green-300 bg-green-50 text-green-700 font-medium' : 'border-orange-300 bg-orange-50 text-orange-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {ESITI_LABELS[e]}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Note esito</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            placeholder="Descrivi l'esito del lavoro..." />
        </div>
        {errore && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle size={13} />{errore}</p>}
        <ModalActions onClose={onClose} onConfirm={() => mutate()} isPending={isPending} label="Salva esito" />
      </div>
    </Modal>
  );
}

function UploadDocModal({ lavoroId, onClose, onSuccess }: {
  lavoroId: number; onClose: () => void; onSuccess: () => void;
}) {
  const [tipo, setTipo] = useState<TipoDocumentoLavoro>('Altro');
  const [descrizione, setDescrizione] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errore, setErrore] = useState('');
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: { 'application/pdf': [], 'image/*': [] },
    onDrop: accepted => { if (accepted[0]) setFile(accepted[0]); },
  });
  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Seleziona un file');
      return lavoriService.uploadDocumento(lavoroId, file, tipo, descrizione || undefined);
    },
    onSuccess,
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrore(msg || 'Errore nel caricamento');
    },
  });
  return (
    <Modal title="Carica documento" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo documento</label>
          <div className="grid grid-cols-2 gap-2">
            {TIPI_DOC.map(t => (
              <button key={t} onClick={() => setTipo(t)}
                className={`px-3 py-2 rounded-lg text-xs border text-left transition-colors ${tipo === t ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {TIPI_DOC_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <div {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
          <input {...getInputProps()} />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText size={24} className="text-blue-500" />
              <p className="text-sm font-medium text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-red-500 hover:text-red-600">Rimuovi</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={24} className="text-gray-300" />
              <p className="text-sm text-gray-500">Trascina il file o <span className="text-blue-600">sfoglia</span></p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG — max 25 MB</p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrizione (opzionale)</label>
          <input value={descrizione} onChange={e => setDescrizione(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Descrizione del documento..." />
        </div>
        {errore && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle size={13} />{errore}</p>}
        <ModalActions onClose={onClose} onConfirm={() => mutate()} isPending={isPending} label="Carica" disabled={!file} />
      </div>
    </Modal>
  );
}
