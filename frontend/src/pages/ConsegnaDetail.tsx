import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Phone, Mail, Package, Euro,
  Calendar, FileText, Upload, Download, Trash2,
  CheckCircle, AlertCircle, Loader2, Info, Eye, Navigation,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { consegneService } from '../services/consegne.service';
import { documentiService } from '../services/documenti.service';
import { StatoBadge, EsitoBadge } from '../components/ui/StatoBadge';
import DocumentPreview from '../components/ui/DocumentPreview';
import { useToast } from '../components/ui/Toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { EsitoConsegna, StatoConsegna, TipoDocumento, Documento, ArticoloConsegna } from '../types';
import { useDropzone } from 'react-dropzone';

const ESITI: EsitoConsegna[] = ['Consegnata', 'ClienteAssente', 'Rifiutata', 'Danneggiata', 'Altro'];
const ESITO_LABELS: Record<EsitoConsegna, string> = {
  Consegnata: 'Consegnata ✓', ClienteAssente: 'Cliente assente',
  Rifiutata: 'Rifiutata', Danneggiata: 'Danneggiata', Altro: 'Altro',
};

const TIPI_DOC: TipoDocumento[] = ['BollaDaFirmare', 'BollaFirmata', 'Foto', 'Altro'];
const TIPO_LABELS: Record<TipoDocumento, string> = {
  BollaDaFirmare: 'Bolla da firmare', BollaFirmata: 'Bolla firmata',
  Foto: 'Foto', Altro: 'Altro documento',
};

export default function ConsegnaDetail() {
  const { id } = useParams<{ id: string }>();
  const consegnaId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin, isTrasportatore, isManager } = useAuth();

  const [showPianifica, setShowPianifica] = useState(false);
  const [showEsito, setShowEsito] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);

  const { data: consegna, isLoading } = useQuery({
    queryKey: ['consegna', consegnaId],
    queryFn: () => consegneService.getConsegna(consegnaId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['consegna', consegnaId] });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={32} className="animate-spin text-blue-400" />
    </div>
  );

  if (!consegna) return <div className="p-6 text-gray-500">Consegna non trovata</div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Consegna #{consegna.numeroOrdine}</h1>
            <StatoBadge stato={consegna.stato as StatoConsegna} />
            {consegna.esito && <EsitoBadge esito={consegna.esito as EsitoConsegna} />}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Ordine del {format(new Date(consegna.dataOrdine), 'd MMMM yyyy', { locale: it })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna sinistra */}
        <div className="lg:col-span-2 space-y-5">
          {/* Cliente */}
          <Section title="Dati cliente" icon={<MapPin size={16} className="text-blue-500" />}>
            <InfoRow label="Nome" value={consegna.clienteNome} />
            <InfoRow label="Indirizzo" value={
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${consegna.clienteIndirizzo}, ${consegna.clienteCap} ${consegna.clienteCitta}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 underline-offset-2 hover:underline"
              >
                <Navigation size={12} className="flex-shrink-0" />
                {consegna.clienteIndirizzo}, {consegna.clienteCap} {consegna.clienteCitta} ({consegna.clienteProvincia})
              </a>
            } />
            {consegna.clienteTelefono && (
              <InfoRow label="Telefono" value={
                <a href={`tel:${consegna.clienteTelefono}`} className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold">
                  <Phone size={12} />{consegna.clienteTelefono}
                </a>
              } />
            )}
            {consegna.clienteEmail && (
              <InfoRow label="Email" value={
                <a href={`mailto:${consegna.clienteEmail}`} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Mail size={12} />{consegna.clienteEmail}
                </a>
              } />
            )}
            {consegna.clienteNote && <InfoRow label="Note cliente" value={consegna.clienteNote} />}
          </Section>

          {/* Articoli */}
          <Section
            title={`Articoli (${consegna.articoli?.length ?? 0})`}
            icon={<Package size={16} className="text-green-500" />}
          >
            {!consegna.articoli || consegna.articoli.length === 0 ? (
              <p className="text-sm text-gray-400 py-1">Nessun articolo</p>
            ) : (
              <div className="divide-y divide-gray-100 -mx-1">
                {consegna.articoli.map((art: ArticoloConsegna, idx: number) => (
                  <div key={art.id} className="flex items-start gap-3 px-1 py-2.5">
                    <span className="text-xs text-gray-400 w-5 flex-shrink-0 pt-0.5 font-mono">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium leading-snug">{art.descrizione}</p>
                      {art.codice && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{art.codice}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-600 flex-shrink-0 mt-0.5 bg-gray-100 px-2 py-0.5 rounded-full">
                      ×{art.quantita}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Documenti */}
          <Section
            title={`Documenti (${consegna.documenti.length})`}
            icon={<FileText size={16} className="text-purple-500" />}
            action={
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Upload size={13} /> Carica
              </button>
            }
          >
            {consegna.documenti.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Nessun documento caricato</p>
            ) : (
              <div className="space-y-2">
                {consegna.documenti.map((doc) => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    tipoLabel={TIPO_LABELS[doc.tipo as TipoDocumento]}
                    onPreview={() => setPreviewDoc(doc)}
                    onDownload={() => documentiService.download(doc.id, doc.nomeFileOriginale)}
                    onDelete={isAdmin ? () => invalidate() : undefined}
                    consegnaId={consegnaId}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Colonna destra */}
        <div className="space-y-5">
          {/* Da ritirare dal cliente — visibile a tutti */}
          <Section title="Da ritirare dal cliente" icon={<Euro size={16} className="text-yellow-500" />}>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">€ {consegna.importoDaPagare.toFixed(2)}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                consegna.pagamentoRicevuto
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {consegna.pagamentoRicevuto ? '✓ Ritirato' : 'Da ritirare'}
              </span>
            </div>
            {consegna.modalitaPagamento && (
              <p className="text-sm text-gray-500 mt-1">{consegna.modalitaPagamento}</p>
            )}
          </Section>

          {/* Consegna info */}
          <Section title="Consegna" icon={<Calendar size={16} className="text-blue-500" />}>
            <InfoRow label="Trasportatore" value={consegna.trasportatoreNome ?? 'Non assegnato'} />
            <InfoRow
              label="Data prevista"
              value={consegna.dataPrevistaConsegna
                ? format(new Date(consegna.dataPrevistaConsegna), 'dd/MM/yyyy')
                : '—'}
            />
            {consegna.dataEffettivaConsegna && (
              <InfoRow label="Data effettiva"
                value={format(new Date(consegna.dataEffettivaConsegna), 'dd/MM/yyyy')} />
            )}
            {consegna.fasciaDalle && consegna.fasciaAlle && (
              <InfoRow label="Fascia oraria" value={`${consegna.fasciaDalle} – ${consegna.fasciaAlle}`} />
            )}
            {consegna.noteConsegna && <InfoRow label="Note consegna" value={consegna.noteConsegna} />}
          </Section>

          {/* Azioni — solo trasportatore */}
          {isTrasportatore && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Azioni</p>

              {consegna.stato !== 'Consegnata' && consegna.stato !== 'Annullata' && (
                <button
                  onClick={() => setShowPianifica(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Calendar size={15} />
                  {consegna.dataPrevistaConsegna ? 'Aggiorna data prevista' : 'Imposta data di consegna'}
                </button>
              )}

              {(consegna.stato === 'InTransito' || consegna.stato === 'Pianificata') && (
                <button
                  onClick={() => setShowEsito(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <CheckCircle size={15} />
                  Inserisci esito consegna
                </button>
              )}
            </div>
          )}

          {/* Note interne (solo admin/manager) */}
          {(isAdmin || isManager) && consegna.noteInterne && (
            <Section title="Note interne" icon={<Info size={16} className="text-gray-400" />}>
              <p className="text-sm text-gray-600">{consegna.noteInterne}</p>
            </Section>
          )}
        </div>
      </div>

      {/* Modali */}
      {showPianifica && (
        <PianificaModal
          consegnaId={consegnaId}
          currentDate={consegna.dataPrevistaConsegna}
          onClose={() => setShowPianifica(false)}
          onSuccess={() => { setShowPianifica(false); invalidate(); }}
        />
      )}
      {showEsito && (
        <EsitoModal
          consegnaId={consegnaId}
          onClose={() => setShowEsito(false)}
          onSuccess={() => { setShowEsito(false); invalidate(); }}
        />
      )}
      {showUpload && (
        <UploadModal
          consegnaId={consegnaId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); invalidate(); }}
        />
      )}

      {/* Anteprima documento */}
      {previewDoc && (
        <DocumentPreview
          nome={previewDoc.nomeFileOriginale}
          contentType={previewDoc.contentType}
          fetchBlob={() => documentiService.getBlob(previewDoc.id)}
          onDownload={() => documentiService.download(previewDoc.id, previewDoc.nomeFileOriginale)}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

// ── DocRow ──────────────────────────────────────────────────────────────────
function DocRow({
  doc, tipoLabel, onPreview, onDownload, onDelete, consegnaId,
}: {
  doc: Documento;
  tipoLabel: string;
  onPreview: () => void;
  onDownload: () => void;
  onDelete?: () => void;
  consegnaId: number;
}) {
  const isImage = doc.contentType.startsWith('image/');
  const icon = isImage ? '🖼️' : '📄';

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{doc.nomeFileOriginale}</p>
        <p className="text-xs text-gray-400 truncate">
          {tipoLabel} • {format(new Date(doc.dataUpload), 'dd/MM/yyyy')} • {doc.uploadedByNome}
        </p>
      </div>
      {/* Always visible on mobile, hover-reveal on desktop */}
      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={onPreview} title="Anteprima"
          className="p-2 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 active:bg-blue-100">
          <Eye size={15} />
        </button>
        <button onClick={onDownload} title="Scarica"
          className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 active:bg-gray-200">
          <Download size={15} />
        </button>
        {onDelete && (
          <DeleteDocumentoBtn consegnaId={consegnaId} documentoId={doc.id} onSuccess={onDelete} />
        )}
      </div>
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────
function Section({ title, icon, children, action }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">{icon}<h3 className="font-semibold text-gray-900 text-sm">{title}</h3></div>
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

function DeleteDocumentoBtn({ consegnaId, documentoId, onSuccess }: {
  consegnaId: number; documentoId: number; onSuccess: () => void;
}) {
  const toast = useToast();
  const { mutate, isPending } = useMutation({
    mutationFn: () => documentiService.eliminaDocumento(consegnaId, documentoId),
    onSuccess: () => { toast.success('Documento eliminato'); onSuccess(); },
    onError: () => toast.error('Errore durante l\'eliminazione'),
  });
  return (
    <button onClick={() => confirm('Eliminare questo documento?') && mutate()} disabled={isPending}
      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
      {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}

function PianificaModal({ consegnaId, currentDate, onClose, onSuccess }: {
  consegnaId: number; currentDate?: string; onClose: () => void; onSuccess: () => void;
}) {
  const [data, setData] = useState(currentDate?.split('T')[0] ?? '');
  const [ore, setOre] = useState('');
  const [errore, setErrore] = useState('');
  const toast = useToast();
  const { mutate, isPending } = useMutation({
    mutationFn: () => consegneService.pianificaConsegna(consegnaId, data + 'T00:00:00Z', ore ? data + 'T' + ore + ':00Z' : undefined),
    onSuccess: () => { toast.success('Data di consegna salvata'); onSuccess(); },
    onError: () => setErrore('Errore nel salvataggio'),
  });
  return (
    <Modal title="Imposta data di consegna" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Data prevista *</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Orario fascia (opzionale)</label>
          <input type="time" value={ore} onChange={e => setOre(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        {errore && <p className="text-sm text-red-500">{errore}</p>}
        <ModalActions onClose={onClose} onConfirm={() => mutate()} isPending={isPending} confirmLabel="Salva" />
      </div>
    </Modal>
  );
}

function EsitoModal({ consegnaId, onClose, onSuccess }: {
  consegnaId: number; onClose: () => void; onSuccess: () => void;
}) {
  const [esito, setEsito] = useState<EsitoConsegna>('Consegnata');
  const [note, setNote] = useState('');
  const [pagato, setPagato] = useState(false);
  const [errore, setErrore] = useState('');
  const toast = useToast();
  const { mutate, isPending } = useMutation({
    mutationFn: () => consegneService.aggiornaEsito(consegnaId, esito, new Date().toISOString(), note || undefined, pagato),
    onSuccess: () => { toast.success('Esito registrato'); onSuccess(); },
    onError: () => setErrore('Errore nel salvataggio'),
  });
  return (
    <Modal title="Inserisci esito consegna" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Esito *</label>
          <div className="grid grid-cols-2 gap-2">
            {ESITI.map(e => (
              <button key={e} type="button" onClick={() => setEsito(e)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                  esito === e
                    ? e === 'Consegnata' ? 'bg-green-50 border-green-300 text-green-700 font-medium' : 'bg-red-50 border-red-300 text-red-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {ESITO_LABELS[e]}
              </button>
            ))}
          </div>
        </div>
        {esito === 'Consegnata' && (
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={pagato} onChange={e => setPagato(e.target.checked)}
              className="w-4 h-4 accent-green-600" />
            <span className="text-sm text-gray-700">Importo ritirato dal cliente</span>
          </label>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (opzionale)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            placeholder="Eventuali note sulla consegna..." />
        </div>
        {errore && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle size={13} />{errore}</p>}
        <ModalActions onClose={onClose} onConfirm={() => mutate()} isPending={isPending} confirmLabel="Salva esito" />
      </div>
    </Modal>
  );
}

function UploadModal({ consegnaId, onClose, onSuccess }: {
  consegnaId: number; onClose: () => void; onSuccess: () => void;
}) {
  const [tipo, setTipo] = useState<TipoDocumento>('BollaFirmata');
  const [descrizione, setDescrizione] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errore, setErrore] = useState('');
  const toast = useToast();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: { 'application/pdf': [], 'image/*': [] },
    onDrop: (accepted) => { if (accepted[0]) setFile(accepted[0]); },
  });
  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Seleziona un file');
      return documentiService.uploadDocumento(consegnaId, file, tipo, descrizione || undefined);
    },
    onSuccess: () => { toast.success('Documento caricato'); onSuccess(); },
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
          <select value={tipo} onChange={e => setTipo(e.target.value as TipoDocumento)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
            {TIPI_DOC.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
          </select>
        </div>
        <div {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}>
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
              <p className="text-sm text-gray-500">Trascina qui il file o <span className="text-blue-600">sfoglia</span></p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG — max 20 MB</p>
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
        <ModalActions onClose={onClose} onConfirm={() => mutate()} isPending={isPending} confirmLabel="Carica" disabled={!file} />
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl sm:rounded-t-2xl px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onClose, onConfirm, isPending, confirmLabel, disabled = false }: {
  onClose: () => void; onConfirm: () => void; isPending: boolean; confirmLabel: string; disabled?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
        Annulla
      </button>
      <button onClick={onConfirm} disabled={isPending || disabled}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {isPending ? 'Salvataggio...' : confirmLabel}
      </button>
    </div>
  );
}
