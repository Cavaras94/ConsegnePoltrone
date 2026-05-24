namespace ConsegnePoltrone.Services;

public class FileService(IConfiguration configuration, IWebHostEnvironment env)
{
    private readonly string _uploadPath = configuration["FileStorage:UploadPath"]
        ?? Path.Combine(env.ContentRootPath, "uploads");

    public async Task<(string nomeFileSalvato, string pathFile, string contentType, long dimensione)>
        SalvaFileAsync(IFormFile file, int consegnaId)
    {
        var cartella = Path.Combine(_uploadPath, "consegne", consegnaId.ToString());
        Directory.CreateDirectory(cartella);

        var estensione = Path.GetExtension(file.FileName);
        var nomeFileSalvato = $"{Guid.NewGuid()}{estensione}";
        var pathCompleto = Path.Combine(cartella, nomeFileSalvato);
        var pathRelativo = Path.Combine("consegne", consegnaId.ToString(), nomeFileSalvato);

        using var stream = new FileStream(pathCompleto, FileMode.Create);
        await file.CopyToAsync(stream);

        return (nomeFileSalvato, pathRelativo, file.ContentType, file.Length);
    }

    public string GetPathCompleto(string pathRelativo)
        => Path.Combine(_uploadPath, pathRelativo);

    public void EliminaFile(string pathRelativo)
    {
        var pathCompleto = GetPathCompleto(pathRelativo);
        if (File.Exists(pathCompleto))
            File.Delete(pathCompleto);
    }

    public bool FileEsiste(string pathRelativo)
        => File.Exists(GetPathCompleto(pathRelativo));

    /// <summary>
    /// Valida la firma binaria (magic bytes) del file caricato,
    /// indipendentemente da quanto dichiara il Content-Type del client.
    /// Formati riconosciuti: PDF, JPEG, PNG, WebP.
    /// </summary>
    public static bool IsFileSignatureValid(IFormFile file)
    {
        var header = new byte[12];
        using var stream = file.OpenReadStream();
        var read = stream.Read(header, 0, header.Length);
        if (read < 4) return false;

        // PDF: %PDF  → 25 50 44 46
        if (header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46)
            return true;

        // JPEG: FF D8 FF
        if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return true;

        // PNG: 89 50 4E 47  (‰PNG)
        if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47)
            return true;

        // WebP: RIFF????WEBP  (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
        if (read >= 12
            && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
            && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50)
            return true;

        return false;
    }
}
