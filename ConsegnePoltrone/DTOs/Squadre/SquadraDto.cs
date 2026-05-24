namespace ConsegnePoltrone.DTOs.Squadre;

public class SquadraDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descrizione { get; set; }
    public string Colore { get; set; } = "#3B82F6";
    public string? Specializzazioni { get; set; }
    public bool IsActive { get; set; }
    public int? CaposquadraId { get; set; }
    public string? CaposquadraNome { get; set; }
    public List<MembroDto> Membri { get; set; } = [];
    public int LavoriAttivi { get; set; }
}

public class SquadraListDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Colore { get; set; } = "#3B82F6";
    public string? Specializzazioni { get; set; }
    public bool IsActive { get; set; }
    public string? CaposquadraNome { get; set; }
    public int NumMembri { get; set; }
    public int LavoriAttivi { get; set; }
}

public class MembroDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Cognome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public bool IsCaposquadra { get; set; }
}

public class CreateSquadraRequest
{
    public string Nome { get; set; } = string.Empty;
    public string? Descrizione { get; set; }
    public string Colore { get; set; } = "#3B82F6";
    public string? Specializzazioni { get; set; }
    public int? CaposquadraId { get; set; }
    public List<int> MembroIds { get; set; } = [];
}

public class UpdateSquadraRequest
{
    public string? Nome { get; set; }
    public string? Descrizione { get; set; }
    public string? Colore { get; set; }
    public string? Specializzazioni { get; set; }
    public int? CaposquadraId { get; set; }
    public List<int>? MembroIds { get; set; }
    public bool? IsActive { get; set; }
}
