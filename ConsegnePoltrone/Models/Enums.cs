namespace ConsegnePoltrone.Models;

// ── Consegne ───────────────────────────────────────────

public enum StatoConsegna
{
    DaPianificare = 0,
    Pianificata = 1,
    InTransito = 2,
    Consegnata = 3,
    NonConsegnata = 4,
    Annullata = 5
}

public enum EsitoConsegna
{
    Consegnata = 0,
    ClienteAssente = 1,
    Rifiutata = 2,
    Danneggiata = 3,
    Altro = 4
}

public enum TipoDocumento
{
    BollaDaFirmare = 0,
    BollaFirmata = 1,
    Foto = 2,
    Altro = 3
}

// ── Lavori installazione ───────────────────────────────

public enum TipoLavoro
{
    Bagno = 0,
    VascaInDoccia = 1,
    Clima = 2,
    Cucina = 3,
    Pavimenti = 4,
    Elettrico = 5,
    Idraulica = 6,
    Altro = 7
}

public enum StatoLavoro
{
    DaPianificare = 0,
    Pianificato = 1,
    InCorso = 2,
    Completato = 3,
    Sospeso = 4,
    Annullato = 5
}

public enum PrioritaLavoro
{
    Bassa = 0,
    Media = 1,
    Alta = 2,
    Urgente = 3
}

public enum EsitoLavoro
{
    Completato = 0,
    ParzialmenteCompletato = 1,
    ProblemiRiscontrati = 2,
    ClienteAssente = 3,
    Annullato = 4
}

public enum TipoDocumentoLavoro
{
    Preventivo = 0,
    ContrattoFirmato = 1,
    SchedaTecnica = 2,
    FotoPrima = 3,
    FotoDopo = 4,
    RapportinoFirmato = 5,
    Altro = 6
}
