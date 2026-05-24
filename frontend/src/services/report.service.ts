import { api } from './api';
import type { ConsegneMensiliDto, StatisticheDto, TrasportatoreStatsDto } from '../types';

export const reportService = {
  async getStatistiche(): Promise<StatisticheDto> {
    const { data } = await api.get<StatisticheDto>('/report/statistiche');
    return data;
  },

  async getMensile(mesi = 6): Promise<ConsegneMensiliDto[]> {
    const { data } = await api.get<ConsegneMensiliDto[]>(`/report/mensile?mesi=${mesi}`);
    return data;
  },

  async getStatsTrasportatori(): Promise<TrasportatoreStatsDto[]> {
    const { data } = await api.get<TrasportatoreStatsDto[]>('/report/trasportatori');
    return data;
  },
};
