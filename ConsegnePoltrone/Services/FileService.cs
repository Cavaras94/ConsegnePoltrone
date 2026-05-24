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
}
