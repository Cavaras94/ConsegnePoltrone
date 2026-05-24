import { api } from './api';
import type { Squadra, SquadraList } from '../types';

export const squadreService = {
  async getSquadre(soloAttive = false): Promise<SquadraList[]> {
    const { data } = await api.get<SquadraList[]>(`/squadre?soloAttive=${soloAttive}`);
    return data;
  },

  async getSquadra(id: number): Promise<Squadra> {
    const { data } = await api.get<Squadra>(`/squadre/${id}`);
    return data;
  },

  async creaSquadra(request: {
    nome: string; descrizione?: string; colore: string;
    specializzazioni?: string; caposquadraId?: number; membroIds: number[];
  }): Promise<Squadra> {
    const { data } = await api.post<Squadra>('/squadre', request);
    return data;
  },

  async aggiornaSquadra(id: number, request: Partial<{
    nome: string; descrizione: string; colore: string;
    specializzazioni: string; caposquadraId: number;
    membroIds: number[]; isActive: boolean;
  }>): Promise<Squadra> {
    const { data } = await api.put<Squadra>(`/squadre/${id}`, request);
    return data;
  },

  async getUtentiDisponibili(): Promise<{ id: number; nome: string; cognome: string; email: string; role: string }[]> {
    const { data } = await api.get('/squadre/utenti-disponibili');
    return data;
  },
};
