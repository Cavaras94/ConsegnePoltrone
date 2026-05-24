namespace ConsegnePoltrone.Models;

public class DocumentoLavoro
{
    public int Id { get; set; }
    public int LavoroId { get; set; }
    public Lavoro Lavoro { get; set; } = null!;
    public string NomeFileOriginale { get; set; } = string.Empty;
    public string NomeFileSalvato { get; set; } = string.Empty;
    public string PathFile { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long DimensioneBytes { get; set; }
    public TipoDocumentoLavoro Tipo { get; set; }
    public DateTime DataUpload { get; set; } = DateTime.UtcNow;
    public int UploadedById { get; set; }
    public User UploadedBy { get; set; } = null!;
    public string? Descrizione { get; set; }
}
