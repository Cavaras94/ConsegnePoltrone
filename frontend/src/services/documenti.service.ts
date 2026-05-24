import { api, API_BASE_URL } from './api';
import type { Documento } from '../types';

export const documentiService = {
  async getDocumenti(consegnaId: number): Promise<Documento[]> {
    const { data } = await api.get<Documento[]>(`/consegne/${consegnaId}/documenti`);
    return data;
  },

  async uploadDocumento(
    consegnaId: number,
    file: File,
    tipo: string,
    descrizione?: string
  ): Promise<Documento> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    if (descrizione) formData.append('descrizione', descrizione);

    const { data } = await api.post<Documento>(
      `/consegne/${consegnaId}/documenti`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  async eliminaDocumento(_consegnaId: number, documentoId: number): Promise<void> {
    await api.delete(`/documenti/${documentoId}`);
  },

  async getBlob(documentoId: number): Promise<Blob> {
    const response = await api.get(`/documenti/${documentoId}/download`, { responseType: 'blob' });
    return response.data;
  },

  getDownloadUrl(documentoId: number): string {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/api/documenti/${documentoId}/download?token=${token}`;
  },

  async download(documentoId: number, nomeFile: string): Promise<void> {
    const response = await api.get(`/documenti/${documentoId}/download`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeFile;
    a.click();
    URL.revokeObjectURL(url);
  },
};
