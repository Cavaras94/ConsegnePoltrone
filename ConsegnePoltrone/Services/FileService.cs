namespace ConsegnePoltrone.Services;

public class FileService(IConfiguration configuration, IWebHostEnvironment env)
{
    private readonly string _uploadPath = configuration["FileStorage:UploadPath"]
        ?? Path.Combine(env.ContentRootPath, "uploads");

    /// <summary>
    /// Salva il file nella landing area locale e restituisce il <b>path assoluto</b>.
    /// Il path assoluto è la source of truth memorizzata su <c>PathFile</c>:
    /// quando il servizio di archiviazione sposta il file su S3, riscrive
    /// semplicemente questa stringa con il nuovo path assoluto (raggiungibile via SMB).
    /// </summary>
    public async Task<(string nomeFileSalvato, string pathAssoluto, string contentType, long dimensione)>
        SalvaFileAsync(IFormFile file, string categoria, int entityId)
    {
        var cartella = Path.GetFullPath(Path.Combine(_uploadPath, categoria, entityId.ToString()));
        Directory.CreateDirectory(cartella);

        var nomeFileSalvato = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var pathAssoluto = Path.Combine(cartella, nomeFileSalvato);

        using var stream = new FileStream(pathAssoluto, FileMode.Create);
        await file.CopyToAsync(stream);

        return (nomeFileSalvato, pathAssoluto, file.ContentType, file.Length);
    }

    /// <summary>
    /// Risolve il path memorizzato. I nuovi documenti usano path assoluti
    /// (restituiti così come sono); eventuali path relativi legacy vengono
    /// risolti rispetto alla landing area locale (retro-compatibilità).
    /// </summary>
    public string ResolvePath(string pathFile)
        => Path.IsPathRooted(pathFile) ? pathFile : Path.Combine(_uploadPath, pathFile);

    public bool FileEsiste(string pathFile) => File.Exists(ResolvePath(pathFile));

    /// <summary>Apre lo stream in lettura per il download in streaming (no buffer in RAM).</summary>
    public Stream OpenRead(string pathFile)
        => new FileStream(ResolvePath(pathFile), FileMode.Open, FileAccess.Read, FileShare.Read);

    public void EliminaFile(string pathFile)
    {
        var path = ResolvePath(pathFile);
        if (File.Exists(path)) File.Delete(path);
    }

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
