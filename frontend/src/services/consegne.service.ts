import { api } from './api';
import type { Consegna, ConsegnaList, CreateConsegnaForm, PaginatedResult } from '../types';

export interface ConsegneFilters {
  stato?: string;
  cerca?: string;
  dal?: string;
  al?: string;
  trasportatoreId?: number;
  pagina?: number;
  perPagina?: number;
}

export const consegneService = {
  async getConsegne(filters: ConsegneFilters = {}): Promise<PaginatedResult<ConsegnaList>> {
    const params = new URLSearchParams();
    if (filters.stato) params.set('stato', filters.stato);
    if (filters.cerca) params.set('cerca', filters.cerca);
    if (filters.dal) params.set('dal', filters.dal);
    if (filters.al) params.set('al', filters.al);
    if (filters.trasportatoreId) params.set('trasportatoreId', String(filters.trasportatoreId));
    params.set('pagina', String(filters.pagina ?? 1));
    params.set('perPagina', String(filters.perPagina ?? 20));

    const { data, headers } = await api.get<ConsegnaList[]>(`/consegne?${params}`);
    return {
      data,
      total: parseInt(headers['x-total-count'] ?? '0'),
      page: parseInt(headers['x-page'] ?? '1'),
      perPage: parseInt(headers['x-per-page'] ?? '20'),
    };
  },

  async getConsegna(id: number): Promise<Consegna> {
    const { data } = await api.get<Consegna>(`/consegne/${id}`);
    return data;
  },

  async creaConsegna(request: CreateConsegnaForm): Promise<Consegna> {
    const { data } = await api.post<Consegna>('/consegne', request);
    return data;
  },

  async aggiornaConsegna(id: number, request: Partial<CreateConsegnaForm>): Promise<Consegna> {
    const { data } = await api.put<Consegna>(`/consegne/${id}`, request);
    return data;
  },

  async pianificaConsegna(
    id: number,
    dataPrevistaConsegna: string,
    fasciaDalle?: string,
    fasciaAlle?: string
  ): Promise<Consegna> {
    const { data } = await api.patch<Consegna>(`/consegne/${id}/pianifica`, {
      dataPrevistaConsegna,
      fasciaDalle,
      fasciaAlle,
    });
    return data;
  },

  async aggiornaEsito(
    id: number,
    esito: string,
    dataEffettivaConsegna: string,
    noteConsegna?: string,
    pagamentoRicevuto?: boolean
  ): Promise<Consegna> {
    const { data } = await api.patch<Consegna>(`/consegne/${id}/esito`, {
      esito,
      dataEffettivaConsegna,
      noteConsegna,
      pagamentoRicevuto,
    });
    return data;
  },

  async eliminaConsegna(id: number): Promise<void> {
    await api.delete(`/consegne/${id}`);
  },
};
