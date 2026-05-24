using ConsegnePoltrone.Constants;

namespace ConsegnePoltrone.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = Roles.Trasportatore;
    public string Nome { get; set; } = string.Empty;
    public string Cognome { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Squadra (se ruolo = Caposquadra)
    public int? SquadraId { get; set; }
    public Squadra? Squadra { get; set; }

    public ICollection<Consegna> ConsegneAssegnate { get; set; } = new List<Consegna>();
    public ICollection<Documento> DocumentiCaricati { get; set; } = new List<Documento>();
    public ICollection<DocumentoLavoro> DocumentiLavoroCaricati { get; set; } = new List<DocumentoLavoro>();
}
