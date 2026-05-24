using ConsegnePoltrone.Models;

namespace ConsegnePoltrone.DTOs.Consegne;

public class ConsegnaDto
{
    public int Id { get; set; }
    public string NumeroOrdine { get; set; } = string.Empty;
    public DateTime DataOrdine { get; set; }

    // Cliente
    public string ClienteNome { get; set; } = string.Empty;
    public string ClienteIndirizzo { get; set; } = string.Empty;
    public string ClienteCitta { get; set; } = string.Empty;
    public string ClienteCap { get; set; } = string.Empty;
    public string ClienteProvincia { get; set; } = string.Empty;
    public string? ClienteTelefono { get; set; }
    public string? ClienteEmail { get; set; }
    public string? ClienteNote { get; set; }

    // Prodotto
    public string ProdottoDescrizione { get; set; } = string.Empty;
    public string? ProdottoCodice { get; set; }
    public int Quantita { get; set; }
    public string? ProdottoNote { get; set; }

    // Pagamento
    public decimal ImportoDaPagare { get; set; }
    public bool PagamentoRicevuto { get; set; }
    public string? ModalitaPagamento { get; set; }

    // Stato
    public string Stato { get; set; } = string.Empty;
    public DateTime? DataPrevistaConsegna { get; set; }
    public DateTime? FasciaDalle { get; set; }
    public DateTime? FasciaAlle { get; set; }
    public DateTime? DataEffettivaConsegna { get; set; }
    public string? Esito { get; set; }
    public string? NoteConsegna { get; set; }
    public string? NoteInterne { get; set; }

    // Trasportatore
    public int? TrasportatoreId { get; set; }
    public string? TrasportatoreNome { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<DocumentoDto> Documenti { get; set; } = [];
}

public class ConsegnaListDto
{
    public int Id { get; set; }
    public string NumeroOrdine { get; set; } = string.Empty;
    public DateTime DataOrdine { get; set; }
    public string ClienteNome { get; set; } = string.Empty;
    public string ClienteCitta { get; set; } = string.Empty;
    public string ProdottoDescrizione { get; set; } = string.Empty;
    public decimal ImportoDaPagare { get; set; }
    public bool PagamentoRicevuto { get; set; }
    public string Stato { get; set; } = string.Empty;
    public DateTime? DataPrevistaConsegna { get; set; }
    public string? Esito { get; set; }
    public string? TrasportatoreNome { get; set; }
    public int DocumentiCount { get; set; }
}

public class CreateConsegnaRequest
{
    public string NumeroOrdine { get; set; } = string.Empty;
    public DateTime DataOrdine { get; set; } = DateTime.UtcNow;
    public string ClienteNome { get; set; } = string.Empty;
    public string ClienteIndirizzo { get; set; } = string.Empty;
    public string ClienteCitta { get; set; } = string.Empty;
    public string ClienteCap { get; set; } = string.Empty;
    public string ClienteProvincia { get; set; } = string.Empty;
    public string? ClienteTelefono { get; set; }
    public string? ClienteEmail { get; set; }
    public string? ClienteNote { get; set; }
    public string ProdottoDescrizione { get; set; } = string.Empty;
    public string? ProdottoCodice { get; set; }
    public int Quantita { get; set; } = 1;
    public string? ProdottoNote { get; set; }
    public decimal ImportoDaPagare { get; set; }
    public string? ModalitaPagamento { get; set; }
    public int? TrasportatoreId { get; set; }
    public string? NoteInterne { get; set; }
}

public class UpdateConsegnaRequest
{
    public string? NumeroOrdine { get; set; }
    public string? ClienteNome { get; set; }
    public string? ClienteIndirizzo { get; set; }
    public string? ClienteCitta { get; set; }
    public string? ClienteCap { get; set; }
    public string? ClienteProvincia { get; set; }
    public string? ClienteTelefono { get; set; }
    public string? ClienteEmail { get; set; }
    public string? ClienteNote { get; set; }
    public string? ProdottoDescrizione { get; set; }
    public string? ProdottoCodice { get; set; }
    public int? Quantita { get; set; }
    public string? ProdottoNote { get; set; }
    public decimal? ImportoDaPagare { get; set; }
    public bool? PagamentoRicevuto { get; set; }
    public string? ModalitaPagamento { get; set; }
    public int? TrasportatoreId { get; set; }
    public string? NoteInterne { get; set; }
}

public class AggiornaPianificazioneRequest
{
    public DateTime DataPrevistaConsegna { get; set; }
    public DateTime? FasciaDalle { get; set; }
    public DateTime? FasciaAlle { get; set; }
}

public class AggiornaEsitoRequest
{
    public string Esito { get; set; } = string.Empty;
    public DateTime DataEffettivaConsegna { get; set; } = DateTime.UtcNow;
    public string? NoteConsegna { get; set; }
    public bool? PagamentoRicevuto { get; set; }
}
