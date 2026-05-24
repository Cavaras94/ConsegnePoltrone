namespace ConsegnePoltrone.Models;

public class Consegna
{
    public int Id { get; set; }
    public string NumeroOrdine { get; set; } = string.Empty;
    public DateTime DataOrdine { get; set; } = DateTime.UtcNow;

    // Dati Cliente
    public string ClienteNome { get; set; } = string.Empty;
    public string ClienteIndirizzo { get; set; } = string.Empty;
    public string ClienteCitta { get; set; } = string.Empty;
    public string ClienteCap { get; set; } = string.Empty;
    public string ClienteProvincia { get; set; } = string.Empty;
    public string? ClienteTelefono { get; set; }
    public string? ClienteEmail { get; set; }
    public string? ClienteNote { get; set; }

    // Dati Prodotto
    public string ProdottoDescrizione { get; set; } = string.Empty;
    public string? ProdottoCodice { get; set; }
    public int Quantita { get; set; } = 1;
    public string? ProdottoNote { get; set; }

    // Dati Pagamento
    public decimal ImportoDaPagare { get; set; }
    public bool PagamentoRicevuto { get; set; } = false;
    public string? ModalitaPagamento { get; set; }

    // Stato Consegna
    public StatoConsegna Stato { get; set; } = StatoConsegna.DaPianificare;
    public DateTime? DataPrevistaConsegna { get; set; }
    public DateTime? FasciaDalle { get; set; }
    public DateTime? FasciaAlle { get; set; }
    public DateTime? DataEffettivaConsegna { get; set; }
    public EsitoConsegna? Esito { get; set; }
    public string? NoteConsegna { get; set; }
    public string? NoteInterne { get; set; }

    // Relazioni
    public int? TrasportatoreId { get; set; }
    public User? Trasportatore { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Documento> Documenti { get; set; } = new List<Documento>();
}
