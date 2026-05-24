namespace ConsegnePoltrone.DTOs.Lavori;

public class LavoroDto
{
    public int Id { get; set; }
    public string NumeroLavoro { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Descrizione { get; set; } = string.Empty;
    public string Priorita { get; set; } = string.Empty;

    public string ClienteNome { get; set; } = string.Empty;
    public string ClienteIndirizzo { get; set; } = string.Empty;
    public string ClienteCitta { get; set; } = string.Empty;
    public string ClienteCap { get; set; } = string.Empty;
    public string ClienteProvincia { get; set; } = string.Empty;
    public string? ClienteTelefono { get; set; }
    public string? ClienteEmail { get; set; }
    public string? ClienteNote { get; set; }

    public DateTime? DataInizio { get; set; }
    public DateTime? DataFine { get; set; }
    public string? FasciaDalle { get; set; }
    public string? FasciaAlle { get; set; }
    public int? DurataStimataOre { get; set; }

    public string Stato { get; set; } = string.Empty;
    public string? Esito { get; set; }
    public DateTime? DataCompletamento { get; set; }
    public string? NoteEsito { get; set; }
    public string? NoteInterne { get; set; }
    public string? NotePerSquadra { get; set; }
    public decimal? ImportoLavoro { get; set; }

    public int? SquadraId { get; set; }
    public string? SquadraNome { get; set; }
    public string? SquadraColore { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<DocumentoLavoroDto> Documenti { get; set; } = [];
}

public class LavoroListDto
{
    public int Id { get; set; }
    public string NumeroLavoro { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Descrizione { get; set; } = string.Empty;
    public string Priorita { get; set; } = string.Empty;
    public string ClienteNome { get; set; } = string.Empty;
    public string ClienteCitta { get; set; } = string.Empty;
    public DateTime? DataInizio { get; set; }
    public DateTime? DataFine { get; set; }
    public string Stato { get; set; } = string.Empty;
    public string? Esito { get; set; }
    public int? SquadraId { get; set; }
    public string? SquadraNome { get; set; }
    public string? SquadraColore { get; set; }
    public int DocumentiCount { get; set; }
}

/// <summary>Formato compatto per il calendario FullCalendar</summary>
public class LavoroCalendarioDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Start { get; set; } = string.Empty;   // ISO 8601
    public string? End { get; set; }                    // ISO 8601 (exclusive per FullCalendar)
    public string? Color { get; set; }
    public string? TextColor { get; set; }
    public LavoroCalendarioExtended ExtendedProps { get; set; } = new();
}

public class LavoroCalendarioExtended
{
    public string Tipo { get; set; } = string.Empty;
    public string Stato { get; set; } = string.Empty;
    public string Priorita { get; set; } = string.Empty;
    public string ClienteNome { get; set; } = string.Empty;
    public string ClienteCitta { get; set; } = string.Empty;
    public string? SquadraNome { get; set; }
}

public class DocumentoLavoroDto
{
    public int Id { get; set; }
    public int LavoroId { get; set; }
    public string NomeFileOriginale { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long DimensioneBytes { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public DateTime DataUpload { get; set; }
    public string UploadedByNome { get; set; } = string.Empty;
    public string? Descrizione { get; set; }
}

public class CreateLavoroRequest
{
    public string NumeroLavoro { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Altro";
    public string Descrizione { get; set; } = string.Empty;
    public string Priorita { get; set; } = "Media";
    public string ClienteNome { get; set; } = string.Empty;
    public string ClienteIndirizzo { get; set; } = string.Empty;
    public string ClienteCitta { get; set; } = string.Empty;
    public string ClienteCap { get; set; } = string.Empty;
    public string ClienteProvincia { get; set; } = string.Empty;
    public string? ClienteTelefono { get; set; }
    public string? ClienteEmail { get; set; }
    public string? ClienteNote { get; set; }
    public DateTime? DataInizio { get; set; }
    public DateTime? DataFine { get; set; }
    public string? FasciaDalle { get; set; }
    public string? FasciaAlle { get; set; }
    public int? DurataStimataOre { get; set; }
    public string? NoteInterne { get; set; }
    public string? NotePerSquadra { get; set; }
    public decimal? ImportoLavoro { get; set; }
    public int? SquadraId { get; set; }
}

public class AggiornaStatoLavoroRequest
{
    public string Stato { get; set; } = string.Empty;
    public string? NotePerSquadra { get; set; }
}

public class AggiornaEsitoLavoroRequest
{
    public string Esito { get; set; } = string.Empty;
    public string? NoteEsito { get; set; }
    public DateTime? DataCompletamento { get; set; }
}
