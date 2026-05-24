import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCheck, Loader2, X } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Role } from '../types';

const ROLE_LABELS: Record<Role, string> = {
  Admin: 'Admin',
  Manager: 'Manager',
  Trasportatore: 'Trasportatore',
  Caposquadra: 'Caposquadra',
};

const ROLE_COLORS: Record<Role, string> = {
  Admin: 'bg-purple-100 text-purple-700',
  Manager: 'bg-blue-100 text-blue-700',
  Trasportatore: 'bg-green-100 text-green-700',
  Caposquadra: 'bg-orange-100 text-orange-700',
};

const schema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Minimo 8 caratteri'),
  nome: z.string().min(1, 'Obbligatorio'),
  cognome: z.string().min(1, 'Obbligatorio'),
  role: z.enum(['Admin', 'Manager', 'Trasportatore', 'Caposquadra']),
  telefono: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Utenti() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: utenti, isLoading } = useQuery({
    queryKey: ['utenti'],
    queryFn: authService.getUtenti,
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: authService.creaUtente,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['utenti'] });
      setShowModal(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: { role: 'Trasportatore' },
  });

  const handleClose = () => { setShowModal(false); reset(); };
  const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione utenti</h1>
          <p className="text-sm text-gray-500 mt-0.5">{utenti?.length ?? 0} utenti attivi</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus size={16} />
          Nuovo utente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-400" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Utente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Ruolo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Telefono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {utenti?.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-700">
                          {u.nome[0]}{u.cognome[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.nome} {u.cognome}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                      <UserCheck size={11} />
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">{u.telefono ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Nuovo utente</h2>
              <button onClick={handleClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            {errMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-sm text-red-600">{errMsg}</div>
            )}

            <form onSubmit={handleSubmit(d => mutate(d as FormData))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input {...register('nome')} className={inp(!!errors.nome)} placeholder="Mario" />
                  {errors.nome && <p className="mt-1 text-xs text-red-500">{errors.nome.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                  <input {...register('cognome')} className={inp(!!errors.cognome)} placeholder="Rossi" />
                  {errors.cognome && <p className="mt-1 text-xs text-red-500">{errors.cognome.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input {...register('email')} type="email" className={inp(!!errors.email)} placeholder="mario@azienda.it" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input {...register('password')} type="password" className={inp(!!errors.password)} placeholder="Minimo 8 caratteri" />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo *</label>
                  <select {...register('role')} className={inp(false) + ' bg-white'}>
                    <option value="Trasportatore">Trasportatore</option>
                    <option value="Caposquadra">Caposquadra</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <input {...register('telefono')} className={inp(false)} placeholder="+39 02..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Annulla
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium">
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {isPending ? 'Creazione...' : 'Crea utente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function inp(hasError: boolean) {
  return `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
  }`;
}
