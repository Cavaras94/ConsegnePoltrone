import { api } from './api';
import type { CalendarioEvent, Lavoro, LavoroList } from '../types';

export interface LavoriFilters {
  stato?: string;
  tipo?: string;
  cerca?: string;
  squadraId?: number;
  dal?: string;
  al?: string;
  pagina?: number;
  perPagina?: number;
}

export const lavoriService = {
  async getLavori(filters: LavoriFilters = {}): Promise<{ data: LavoroList[]; total: number }> {
    const params = new URLSearchParams();
    if (filters.stato) params.set('stato', filters.stato);
    if (filters.tipo) params.set('tipo', filters.tipo);
    if (filters.cerca) params.set('cerca', filters.cerca);
    if (filters.squadraId) params.set('squadraId', String(filters.squadraId));
    if (filters.dal) params.set('dal', filters.dal);
    if (filters.al) params.set('al', filters.al);
    params.set('pagina', String(filters.pagina ?? 1));
    params.set('perPagina', String(filters.perPagina ?? 20));

    const { data, headers } = await api.get<LavoroList[]>(`/lavori?${params}`);
    return { data, total: parseInt(headers['x-total-count'] ?? '0') };
  },

  async getCalendario(dal?: string, al?: string, squadraId?: number): Promise<CalendarioEvent[]> {
    const params = new URLSearchParams();
    if (dal) params.set('dal', dal);
    if (al) params.set('al', al);
    if (squadraId) params.set('squadraId', String(squadraId));
    const { data } = await api.get<CalendarioEvent[]>(`/lavori/calendario?${params}`);
    return data;
  },

  async getLavoro(id: number): Promise<Lavoro> {
    const { data } = await api.get<Lavoro>(`/lavori/${id}`);
    return data;
  },

  async creaLavoro(request: Partial<Lavoro> & { tipo: string; descrizione: string; clienteNome: string }): Promise<Lavoro> {
    const { data } = await api.post<Lavoro>('/lavori', request);
    return data;
  },

  async aggiornaLavoro(id: number, request: unknown): Promise<Lavoro> {
    const { data } = await api.put<Lavoro>(`/lavori/${id}`, request);
    return data;
  },

  async aggiornaStato(id: number, stato: string, notePerSquadra?: string): Promise<Lavoro> {
    const { data } = await api.patch<Lavoro>(`/lavori/${id}/stato`, { stato, notePerSquadra });
    return data;
  },

  async aggiornaEsito(id: number, esito: string, noteEsito?: string, dataCompletamento?: string): Promise<Lavoro> {
    const { data } = await api.patch<Lavoro>(`/lavori/${id}/esito`, { esito, noteEsito, dataCompletamento });
    return data;
  },

  async uploadDocumento(id: number, file: File, tipo: string, descrizione?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    if (descrizione) formData.append('descrizione', descrizione);
    const { data } = await api.post(`/lavori/${id}/documenti`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getBlobDocumento(lavoroId: number, docId: number): Promise<Blob> {
    const response = await api.get(`/lavori/${lavoroId}/documenti/${docId}/download`, { responseType: 'blob' });
    return response.data;
  },

  async downloadDocumento(lavoroId: number, docId: number, nomeFile: string): Promise<void> {
    const response = await api.get(`/lavori/${lavoroId}/documenti/${docId}/download`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeFile;
    a.click();
    URL.revokeObjectURL(url);
  },

  async eliminaDocumento(lavoroId: number, docId: number): Promise<void> {
    await api.delete(`/lavori/${lavoroId}/documenti/${docId}`);
  },

  async eliminaLavoro(id: number): Promise<void> {
    await api.delete(`/lavori/${id}`);
  },
};
