namespace ConsegnePoltrone.Models;

public class Documento
{
    public int Id { get; set; }
    public int ConsegnaId { get; set; }
    public Consegna Consegna { get; set; } = null!;
    public string NomeFileOriginale { get; set; } = string.Empty;
    public string NomeFileSalvato { get; set; } = string.Empty;
    public string PathFile { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long DimensioneBytes { get; set; }
    public TipoDocumento Tipo { get; set; }
    public DateTime DataUpload { get; set; } = DateTime.UtcNow;
    public int UploadedById { get; set; }
    public User UploadedBy { get; set; } = null!;
    public string? Descrizione { get; set; }
}
