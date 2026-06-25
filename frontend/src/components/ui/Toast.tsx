import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastTipo = 'success' | 'error' | 'info';
interface ToastItem { id: number; tipo: ToastTipo; messaggio: string }

interface ToastCtx {
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast deve essere usato dentro <ToastProvider>');
  return ctx;
}

const STYLES: Record<ToastTipo, { icon: typeof CheckCircle; cls: string; iconCls: string }> = {
  success: { icon: CheckCircle, cls: 'border-green-200 bg-green-50',  iconCls: 'text-green-600' },
  error:   { icon: AlertCircle, cls: 'border-red-200 bg-red-50',      iconCls: 'text-red-600' },
  info:    { icon: Info,        cls: 'border-blue-200 bg-blue-50',    iconCls: 'text-blue-600' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const push = useCallback((tipo: ToastTipo, messaggio: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, tipo, messaggio }]);
  }, []);

  const api: ToastCtx = {
    success: m => push('success', m),
    error:   m => push('error', m),
    info:    m => push('info', m),
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm" role="region" aria-label="Notifiche">
        {toasts.map(t => (
          <ToastRow key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastRow({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const { icon: Icon, cls, iconCls } = STYLES[item.tipo];

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 p-3 pr-2 rounded-xl border shadow-sm animate-[slideIn_0.2s_ease-out] ${cls}`}
    >
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${iconCls}`} />
      <p className="flex-1 text-sm text-gray-800">{item.messaggio}</p>
      <button onClick={onClose} aria-label="Chiudi notifica" className="p-0.5 rounded text-gray-400 hover:text-gray-600">
        <X size={15} />
      </button>
    </div>
  );
}
