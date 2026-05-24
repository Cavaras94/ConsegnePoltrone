import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Role } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;                         // utente "effettivo" (impersonato o reale)
  originalUser: User | null;                 // utente reale admin quando si sta impersonando
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  isAdmin: boolean;
  isTrasportatore: boolean;
  isManager: boolean;
  isCaposquadra: boolean;
  startImpersonation: (targetUser: User) => void;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Impersonation state
  const [impersonating, setImpersonating] = useState<User | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) { setIsLoading(false); return; }
      try {
        const me = await authService.getMe();
        setUser(me);
        localStorage.setItem('user', JSON.stringify(me));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    verifyToken();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    const userData: User = {
      id: response.userId, email: response.email,
      nome: response.nome, cognome: response.cognome, role: response.role,
    };
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(response.token);
    setUser(userData);
    setImpersonating(null); // reset any active impersonation
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setImpersonating(null);
  };

  const startImpersonation = (targetUser: User) => setImpersonating(targetUser);
  const stopImpersonation  = () => setImpersonating(null);

  // The "active" user for all UI decisions
  const effectiveUser = impersonating ?? user;

  const hasRole = (...roles: Role[]) => effectiveUser ? roles.includes(effectiveUser.role) : false;

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        originalUser: impersonating ? user : null,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isImpersonating: !!impersonating,
        login,
        logout,
        hasRole,
        isAdmin:         effectiveUser?.role === 'Admin',
        isTrasportatore: effectiveUser?.role === 'Trasportatore',
        isManager:       effectiveUser?.role === 'Manager',
        isCaposquadra:   effectiveUser?.role === 'Caposquadra',
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider');
  return ctx;
}
