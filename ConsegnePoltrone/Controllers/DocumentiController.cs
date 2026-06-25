using ConsegnePoltrone.Constants;
using ConsegnePoltrone.Data;
using ConsegnePoltrone.DTOs.Consegne;
using ConsegnePoltrone.Models;
using ConsegnePoltrone.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConsegnePoltrone.Controllers;

[ApiController]
[Route("api/consegne/{consegnaId}/documenti")]
[Authorize]
public class DocumentiController(ApplicationDbContext db, FileService fileService) : ControllerBase
{
    private int CurrentUserId => int.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
        ?? "0");

    private string CurrentRole => User.FindFirstValue(ClaimTypes.Role) ?? "";

    // GET /api/consegne/{consegnaId}/documenti
    [HttpGet]
    public async Task<ActionResult<List<DocumentoDto>>> GetDocumenti(int consegnaId)
    {
        var consegna = await db.Consegne.FindAsync(consegnaId);
        if (consegna == null) return NotFound();

        if (CurrentRole == Roles.Trasportatore && consegna.TrasportatoreId != CurrentUserId)
            return Forbid();

        var documenti = await db.Documenti
            .Include(d => d.UploadedBy)
            .Where(d => d.ConsegnaId == consegnaId)
            .Select(d => new DocumentoDto
            {
                Id = d.Id,
                ConsegnaId = d.ConsegnaId,
                NomeFileOriginale = d.NomeFileOriginale,
                ContentType = d.ContentType,
                DimensioneBytes = d.DimensioneBytes,
                Tipo = d.Tipo.ToString(),
                DataUpload = d.DataUpload,
                UploadedByNome = $"{d.UploadedBy.Nome} {d.UploadedBy.Cognome}",
                Descrizione = d.Descrizione,
                Url = $"/documenti/{d.Id}/download"
            })
            .ToListAsync();

        return Ok(documenti);
    }

    // POST /api/consegne/{consegnaId}/documenti — Upload file
    [HttpPost]
    public async Task<ActionResult<DocumentoDto>> UploadDocumento(
        int consegnaId,
        IFormFile file,
        [FromForm] string tipo = "Altro",
        [FromForm] string? descrizione = null)
    {
        var consegna = await db.Consegne.FindAsync(consegnaId);
        if (consegna == null) return NotFound();

        if (CurrentRole == Roles.Trasportatore && consegna.TrasportatoreId != CurrentUserId)
            return Forbid();

        // Validazione tipo file — prima il Content-Type dichiarato, poi i magic bytes reali
        var tipiConsentiti = new[] { "application/pdf", "image/jpeg", "image/png", "image/webp" };
        if (!tipiConsentiti.Contains(file.ContentType.ToLower()))
            return BadRequest(new { message = "Tipo file non consentito. Sono accettati: PDF, JPEG, PNG" });

        if (!FileService.IsFileSignatureValid(file))
            return BadRequest(new { message = "Il contenuto del file non corrisponde al tipo dichiarato." });

        if (file.Length > 20 * 1024 * 1024) // 20 MB max
            return BadRequest(new { message = "File troppo grande. Massimo 20 MB" });

        if (!Enum.TryParse<TipoDocumento>(tipo, out var tipoDoc))
            tipoDoc = TipoDocumento.Altro;

        var (nomeFileSalvato, pathFile, contentType, dimensione) =
            await fileService.SalvaFileAsync(file, "consegne", consegnaId);

        var documento = new Documento
        {
            ConsegnaId = consegnaId,
            NomeFileOriginale = file.FileName,
            NomeFileSalvato = nomeFileSalvato,
            PathFile = pathFile,
            ContentType = contentType,
            DimensioneBytes = dimensione,
            Tipo = tipoDoc,
            UploadedById = CurrentUserId,
            Descrizione = descrizione
        };

        db.Documenti.Add(documento);
        await db.SaveChangesAsync();

        await db.Entry(documento).Reference(d => d.UploadedBy).LoadAsync();

        return CreatedAtAction(nameof(GetDocumenti), new { consegnaId },
            new DocumentoDto
            {
                Id = documento.Id,
                ConsegnaId = documento.ConsegnaId,
                NomeFileOriginale = documento.NomeFileOriginale,
                ContentType = documento.ContentType,
                DimensioneBytes = documento.DimensioneBytes,
                Tipo = documento.Tipo.ToString(),
                DataUpload = documento.DataUpload,
                UploadedByNome = $"{documento.UploadedBy.Nome} {documento.UploadedBy.Cognome}",
                Descrizione = documento.Descrizione,
                Url = $"/documenti/{documento.Id}/download"
            });
    }

    // DELETE /api/consegne/{consegnaId}/documenti/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> EliminaDocumento(int consegnaId, int id)
    {
        var documento = await db.Documenti
            .FirstOrDefaultAsync(d => d.Id == id && d.ConsegnaId == consegnaId);

        if (documento == null) return NotFound();

        fileService.EliminaFile(documento.PathFile);
        db.Documenti.Remove(documento);
        await db.SaveChangesAsync();

        return NoContent();
    }
}

// Controller separato per il download
[ApiController]
[Route("api/documenti")]
[Authorize]
public class DocumentiDownloadController(ApplicationDbContext db, FileService fileService) : ControllerBase
{
    private int CurrentUserId => int.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
        ?? "0");

    private string CurrentRole => User.FindFirstValue(ClaimTypes.Role) ?? "";

    // GET /api/documenti/{id}/download
    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var documento = await db.Documenti
            .Include(d => d.Consegna)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (documento == null) return NotFound();

        if (CurrentRole == Roles.Trasportatore && documento.Consegna.TrasportatoreId != CurrentUserId)
            return Forbid();

        if (!fileService.FileEsiste(documento.PathFile))
            return NotFound(new { message = "File non trovato sul server" });

        var stream = fileService.OpenRead(documento.PathFile);
        return File(stream, documento.ContentType, documento.NomeFileOriginale, enableRangeProcessing: true);
    }
}
