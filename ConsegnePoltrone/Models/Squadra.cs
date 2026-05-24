namespace ConsegnePoltrone.Models;

public class Squadra
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descrizione { get; set; }

    /// <summary>Colore hex usato nel calendario (es. "#3B82F6")</summary>
    public string Colore { get; set; } = "#3B82F6";

    /// <summary>Tipi di lavoro specializzazione (CSV, es. "Bagno,Clima")</summary>
    public string? Specializzazioni { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Il caposquadra ha accesso alla dashboard con ruolo Caposquadra
    public int? CaposquadraId { get; set; }
    public User? Caposquadra { get; set; }

    public ICollection<User> Membri { get; set; } = new List<User>();
    public ICollection<Lavoro> Lavori { get; set; } = new List<Lavoro>();
}
