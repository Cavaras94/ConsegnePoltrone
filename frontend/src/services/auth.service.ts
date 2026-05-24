import { api } from './api';
import type { AuthResponse, User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  async getTrasportatori(): Promise<User[]> {
    const { data } = await api.get<User[]>('/auth/trasportatori');
    return data;
  },

  async getUtenti(): Promise<User[]> {
    const { data } = await api.get<User[]>('/auth/utenti');
    return data;
  },

  async creaUtente(utente: {
    email: string;
    password: string;
    nome: string;
    cognome: string;
    role: string;
    telefono?: string;
  }): Promise<User> {
    const { data } = await api.post<User>('/auth/utenti', utente);
    return data;
  },
};
