import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const schema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password obbligatoria'),
});
type LoginForm = z.infer<typeof schema>;

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<LoginForm>({ resolver: zodResolver(schema) as any });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Credenziali non valide');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Truck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Consegne Poltrone</h1>
          <p className="text-gray-500 text-sm mt-1">Gestione consegne e trasporti</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Accedi al tuo account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="nome@azienda.it"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors outline-none
                  ${errors.email
                    ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm transition-colors outline-none
                    ${errors.password
                      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700
                disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition-colors mt-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          {/* Hint credenziali demo — solo in sviluppo */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Account demo</p>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { email: 'admin@test.it',         ruolo: 'Admin' },
                  { email: 'manager@test.it',       ruolo: 'Manager' },
                  { email: 'trasportatore@test.it', ruolo: 'Trasportatore' },
                  { email: 'caposquadra@test.it',   ruolo: 'Caposquadra' },
                ].map(u => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => { setValue('email', u.email); setValue('password', 'password'); }}
                    className="flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 text-xs"
                  >
                    <span className="font-mono text-gray-600">{u.email}</span>
                    <span className="text-gray-400">{u.ruolo}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Password: <span className="font-mono">password</span> — clicca per compilare</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
