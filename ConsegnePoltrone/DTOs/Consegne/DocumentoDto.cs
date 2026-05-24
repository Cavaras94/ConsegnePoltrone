namespace ConsegnePoltrone.DTOs.Consegne;

public class DocumentoDto
{
    public int Id { get; set; }
    public int ConsegnaId { get; set; }
    public string NomeFileOriginale { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long DimensioneBytes { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public DateTime DataUpload { get; set; }
    public string UploadedByNome { get; set; } = string.Empty;
    public string? Descrizione { get; set; }
}
