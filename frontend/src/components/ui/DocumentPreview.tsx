import { useEffect, useState } from 'react';
import { X, Download, Loader2, FileText, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  nome: string;
  contentType: string;
  fetchBlob: () => Promise<Blob>;
  onClose: () => void;
  onDownload: () => void;
}

export default function DocumentPreview({ nome, contentType, fetchBlob, onClose, onDownload }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  // effectiveType reflects the blob's actual MIME (may differ in dev/mock mode)
  const [effectiveType, setEffectiveType] = useState(contentType);

  const isImage = effectiveType.startsWith('image/');
  // Show in iframe for PDFs or HTML (mock dev fallback)
  const isPdf   = effectiveType === 'application/pdf' || contentType === 'application/pdf';

  useEffect(() => {
    let created: string | null = null;
    fetchBlob()
      .then(blob => {
        // Prefer the blob's own MIME; fall back to the declared contentType
        const resolvedType = (blob.type && blob.type !== 'application/octet-stream')
          ? blob.type
          : contentType;
        setEffectiveType(resolvedType);
        const typed = new Blob([blob], { type: resolvedType });
        created = URL.createObjectURL(typed);
        setBlobUrl(created);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    return () => { if (created) URL.revokeObjectURL(created); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const ext = nome.split('.').pop()?.toLowerCase() ?? '';
  const icon = isImage ? '🖼️' : isPdf ? '📄' : ext === 'docx' || ext === 'doc' ? '📝' : '📎';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <span className="text-lg">{icon}</span>
          <span className="flex-1 text-sm font-medium text-gray-800 truncate min-w-0">{nome}</span>

          {/* Zoom controls for images */}
          {isImage && !loading && !error && (
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-1">
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                title="Riduci"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                title="Ingrandisci"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          )}

          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 flex-shrink-0"
          >
            <Download size={13} />
            Scarica
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-gray-100 rounded-b-2xl flex items-center justify-center min-h-[300px]">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
              <Loader2 size={28} className="animate-spin text-blue-400" />
              <p className="text-sm">Caricamento anteprima...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
              <AlertCircle size={28} className="text-red-300" />
              <p className="text-sm text-gray-500">Impossibile caricare l'anteprima</p>
              <button onClick={onDownload} className="text-xs text-blue-600 hover:underline font-medium">
                Scarica il file per aprirlo
              </button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <>
              {isImage && (
                <div className="overflow-auto w-full h-full flex items-center justify-center p-4">
                  <img
                    src={blobUrl}
                    alt={nome}
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s' }}
                    className="max-w-full rounded shadow-lg"
                    onError={() => setError(true)}
                  />
                </div>
              )}

              {isPdf && (
                <iframe
                  src={blobUrl}
                  title={nome}
                  className="w-full rounded-b-2xl border-0"
                  style={{ height: 'calc(90vh - 64px)' }}
                />
              )}

              {!isImage && !isPdf && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <FileText size={40} className="text-gray-300" />
                  <p className="text-sm text-gray-500 font-medium">Anteprima non disponibile</p>
                  <p className="text-xs text-gray-400">Questo tipo di file non può essere mostrato in anteprima</p>
                  <button
                    onClick={onDownload}
                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                  >
                    <Download size={14} className="inline mr-1.5" />
                    Scarica il file
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
