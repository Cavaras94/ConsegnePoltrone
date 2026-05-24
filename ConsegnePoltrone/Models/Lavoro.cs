namespace ConsegnePoltrone.Models;

public class Lavoro
{
    public int Id { get; set; }
    public string NumeroLavoro { get; set; } = string.Empty;
    public TipoLavoro Tipo { get; set; }
    public string Descrizione { get; set; } = string.Empty;
    public PrioritaLavoro Priorita { get; set; } = PrioritaLavoro.Media;

    // Dati cliente
    public string ClienteNome { get; set; } = string.Empty;
    public string ClienteIndirizzo { get; set; } = string.Empty;
    public string ClienteCitta { get; set; } = string.Empty;
    public string ClienteCap { get; set; } = string.Empty;
    public string ClienteProvincia { get; set; } = string.Empty;
    public string? ClienteTelefono { get; set; }
    public string? ClienteEmail { get; set; }
    public string? ClienteNote { get; set; }

    // Pianificazione — supporta lavori multi-giorno
    public DateTime? DataInizio { get; set; }
    public DateTime? DataFine { get; set; }   // uguale a DataInizio se lavoro in giornata
    public string? FasciaDalle { get; set; }  // es. "08:00"
    public string? FasciaAlle { get; set; }   // es. "17:00"
    public int? DurataStimataOre { get; set; }

    // Stato e esito
    public StatoLavoro Stato { get; set; } = StatoLavoro.DaPianificare;
    public EsitoLavoro? Esito { get; set; }
    public DateTime? DataCompletamento { get; set; }
    public string? NoteEsito { get; set; }

    // Note
    public string? NoteInterne { get; set; }      // solo admin
    public string? NotePerSquadra { get; set; }   // visibili alla squadra

    // Valore economico (opzionale)
    public decimal? ImportoLavoro { get; set; }

    // Relazioni
    public int? SquadraId { get; set; }
    public Squadra? Squadra { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<DocumentoLavoro> Documenti { get; set; } = new List<DocumentoLavoro>();
}
