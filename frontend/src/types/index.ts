export type Role = 'Admin' | 'Trasportatore' | 'Manager' | 'Caposquadra';

export type StatoConsegna =
  | 'DaPianificare'
  | 'Pianificata'
  | 'InTransito'
  | 'Consegnata'
  | 'NonConsegnata'
  | 'Annullata';

export type EsitoConsegna =
  | 'Consegnata'
  | 'ClienteAssente'
  | 'Rifiutata'
  | 'Danneggiata'
  | 'Altro';

export type TipoDocumento =
  | 'BollaDaFirmare'
  | 'BollaFirmata'
  | 'Foto'
  | 'Altro';

export interface User {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  role: Role;
  telefono?: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  nome: string;
  cognome: string;
  role: Role;
  userId: number;
  expiresAt: string;
}

export interface Documento {
  id: number;
  consegnaId: number;
  nomeFileOriginale: string;
  contentType: string;
  dimensioneBytes: number;
  tipo: TipoDocumento;
  dataUpload: string;
  uploadedByNome: string;
  descrizione?: string;
}

export interface ArticoloConsegna {
  id: number;
  codice?: string;
  descrizione: string;
  quantita: number;
}

export interface ConsegnaList {
  id: number;
  numeroOrdine: string;
  dataOrdine: string;
  clienteNome: string;
  clienteCitta: string;
  articoliSommario: string;  // Descrizione primo articolo o "N articoli"
  articoliCount: number;
  importoDaPagare: number;
  pagamentoRicevuto: boolean;
  modalitaPagamento?: string;
  fasciaDalle?: string;
  fasciaAlle?: string;
  stato: StatoConsegna;
  dataPrevistaConsegna?: string;
  esito?: EsitoConsegna;
  trasportatoreNome?: string;
  documentiCount: number;
}

export interface Consegna extends ConsegnaList {
  clienteIndirizzo: string;
  clienteCap: string;
  clienteProvincia: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  clienteNote?: string;
  articoli: ArticoloConsegna[];
  dataEffettivaConsegna?: string;
  noteConsegna?: string;
  noteInterne?: string;
  trasportatoreId?: number;
  createdAt: string;
  updatedAt?: string;
  documenti: Documento[];
}

export interface CreateConsegnaForm {
  numeroOrdine: string;
  dataOrdine: string;
  clienteNome: string;
  clienteIndirizzo: string;
  clienteCitta: string;
  clienteCap: string;
  clienteProvincia: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  clienteNote?: string;
  articoli: { codice?: string; descrizione: string; quantita: number }[];
  importoDaPagare: number;
  modalitaPagamento?: string;
  trasportatoreId?: number;
  noteInterne?: string;
}

export interface StatisticheDto {
  totaleConsegne: number;
  daPianificare: number;
  pianificate: number;
  inTransito: number;
  consegnate: number;
  nonConsegnate: number;
  annullate: number;
  totaleImporti: number;
  importiRiscossi: number;
  importiDaRiscuotere: number;
  consegneMese: number;
  consegneOggi: number;
}

export interface ConsegneMensiliDto {
  anno: number;
  mese: number;
  nomeMese: string;
  totale: number;
  consegnate: number;
  nonConsegnate: number;
}

export interface TrasportatoreStatsDto {
  trasportatoreId: number;
  nome: string;
  totale: number;
  consegnate: number;
  nonConsegnate: number;
  percentualeSuccesso: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

// ── Squadre & Lavori ─────────────────────────────────

export type TipoLavoro =
  | 'Bagno' | 'VascaInDoccia' | 'Clima' | 'Cucina'
  | 'Pavimenti' | 'Elettrico' | 'Idraulica' | 'Altro';

export type StatoLavoro =
  | 'DaPianificare' | 'Pianificato' | 'InCorso'
  | 'Completato' | 'Sospeso' | 'Annullato';

export type PrioritaLavoro = 'Bassa' | 'Media' | 'Alta' | 'Urgente';

export type EsitoLavoro =
  | 'Completato' | 'ParzialmenteCompletato'
  | 'ProblemiRiscontrati' | 'ClienteAssente' | 'Annullato';

export type CategoriaLavoro = 'Lavoro' | 'Assistenza';
export type TurnoAssistenza = 'Mattina' | 'Pomeriggio';

export type TipoDocumentoLavoro =
  | 'Preventivo' | 'ContrattoFirmato' | 'SchedaTecnica'
  | 'FotoPrima' | 'FotoDopo' | 'RapportinoFirmato' | 'Altro';

export interface Squadra {
  id: number;
  nome: string;
  descrizione?: string;
  colore: string;
  specializzazioni?: string;
  isActive: boolean;
  caposquadraId?: number;
  caposquadraNome?: string;
  membri: MembroSquadra[];
  lavoriAttivi: number;
}

export interface SquadraList {
  id: number;
  nome: string;
  colore: string;
  specializzazioni?: string;
  isActive: boolean;
  caposquadraNome?: string;
  numMembri: number;
  lavoriAttivi: number;
}

export interface MembroSquadra {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  isCaposquadra: boolean;
}

export interface DocumentoLavoro {
  id: number;
  lavoroId: number;
  nomeFileOriginale: string;
  contentType: string;
  dimensioneBytes: number;
  tipo: TipoDocumentoLavoro;
  dataUpload: string;
  uploadedByNome: string;
  descrizione?: string;
}

export interface LavoroList {
  id: number;
  numeroLavoro: string;
  tipo: TipoLavoro;
  descrizione: string;
  priorita: PrioritaLavoro;
  categoria: CategoriaLavoro;
  clienteNome: string;
  clienteCitta: string;
  dataInizio?: string;
  dataFine?: string;
  fasciaDalle?: string;
  fasciaAlle?: string;
  turno?: TurnoAssistenza;
  stato: StatoLavoro;
  esito?: EsitoLavoro;
  squadraId?: number;
  squadraNome?: string;
  squadraColore?: string;
  documentiCount: number;
}

export interface Lavoro extends LavoroList {
  clienteIndirizzo: string;
  clienteCap: string;
  clienteProvincia: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  clienteNote?: string;
  durataStimataOre?: number;
  dataCompletamento?: string;
  noteEsito?: string;
  noteInterne?: string;
  notePerSquadra?: string;
  importoLavoro?: number;
  createdAt: string;
  updatedAt?: string;
  documenti: DocumentoLavoro[];
}

export interface CalendarioEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color?: string;
  textColor?: string;
  extendedProps: {
    tipo: string;
    stato: string;
    priorita: string;
    clienteNome: string;
    clienteCitta: string;
    squadraNome?: string;
  };
}
