using ConsegnePoltrone.Constants;
using ConsegnePoltrone.Data;
using ConsegnePoltrone.DTOs.Lavori;
using ConsegnePoltrone.Models;
using ConsegnePoltrone.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConsegnePoltrone.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LavoriController(ApplicationDbContext db, FileService fileService) : ControllerBase
{
    private int CurrentUserId => int.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
        ?? "0");

    private string CurrentRole => User.FindFirstValue(ClaimTypes.Role) ?? "";

    private async Task<int?> GetCurrentSquadraId()
    {
        if (CurrentRole != Roles.Caposquadra) return null;
        var user = await db.Users.FindAsync(CurrentUserId);
        return user?.SquadraId;
    }

    // GET /api/lavori — Lista
    [HttpGet]
    public async Task<ActionResult<List<LavoroListDto>>> GetLavori(
        [FromQuery] string? stato,
        [FromQuery] string? tipo,
        [FromQuery] string? cerca,
        [FromQuery] int? squadraId,
        [FromQuery] DateTime? dal,
        [FromQuery] DateTime? al,
        [FromQuery] int pagina = 1,
        [FromQuery] int perPagina = 20)
    {
        var query = db.Lavori
            .Include(l => l.Squadra)
            .Include(l => l.Documenti)
            .AsQueryable();

        // Caposquadra vede solo i lavori della sua squadra
        if (CurrentRole == Roles.Caposquadra)
        {
            var squadraIdCorrente = await GetCurrentSquadraId();
            query = query.Where(l => l.SquadraId == squadraIdCorrente);
        }
        else if (squadraId.HasValue)
        {
            query = query.Where(l => l.SquadraId == squadraId);
        }

        if (!string.IsNullOrEmpty(stato) && Enum.TryParse<StatoLavoro>(stato, out var statoEnum))
            query = query.Where(l => l.Stato == statoEnum);

        if (!string.IsNullOrEmpty(tipo) && Enum.TryParse<TipoLavoro>(tipo, out var tipoEnum))
            query = query.Where(l => l.Tipo == tipoEnum);

        if (!string.IsNullOrEmpty(cerca))
            query = query.Where(l =>
                l.NumeroLavoro.Contains(cerca) ||
                l.Descrizione.Contains(cerca) ||
                l.ClienteNome.Contains(cerca) ||
                l.ClienteCitta.Contains(cerca));

        if (dal.HasValue) query = query.Where(l => l.DataInizio >= dal || l.DataFine >= dal);
        if (al.HasValue) query = query.Where(l => l.DataInizio <= al);

        var totale = await query.CountAsync();
        var lavori = await query
            .OrderBy(l => l.DataInizio ?? DateTime.MaxValue)
            .ThenByDescending(l => l.Priorita)
            .Skip((pagina - 1) * perPagina)
            .Take(perPagina)
            .Select(l => new LavoroListDto
            {
                Id = l.Id,
                NumeroLavoro = l.NumeroLavoro,
                Tipo = l.Tipo.ToString(),
                Descrizione = l.Descrizione,
                Priorita = l.Priorita.ToString(),
                ClienteNome = l.ClienteNome,
                ClienteCitta = l.ClienteCitta,
                DataInizio = l.DataInizio,
                DataFine = l.DataFine,
                Stato = l.Stato.ToString(),
                Esito = l.Esito.HasValue ? l.Esito.ToString() : null,
                SquadraId = l.SquadraId,
                SquadraNome = l.Squadra != null ? l.Squadra.Nome : null,
                SquadraColore = l.Squadra != null ? l.Squadra.Colore : null,
                DocumentiCount = l.Documenti.Count
            })
            .ToListAsync();

        Response.Headers.Append("X-Total-Count", totale.ToString());
        return Ok(lavori);
    }

    // GET /api/lavori/calendario — Formato FullCalendar
    [HttpGet("calendario")]
    public async Task<ActionResult<List<LavoroCalendarioDto>>> GetCalendario(
        [FromQuery] DateTime? dal,
        [FromQuery] DateTime? al,
        [FromQuery] int? squadraId)
    {
        var query = db.Lavori
            .Include(l => l.Squadra)
            .Where(l => l.DataInizio.HasValue)
            .AsQueryable();

        if (CurrentRole == Roles.Caposquadra)
        {
            var squadraIdCorrente = await GetCurrentSquadraId();
            query = query.Where(l => l.SquadraId == squadraIdCorrente);
        }
        else if (squadraId.HasValue)
        {
            query = query.Where(l => l.SquadraId == squadraId);
        }

        // Finestra temporale per performance
        var inizio = dal ?? DateTime.UtcNow.AddMonths(-1);
        var fine = al ?? DateTime.UtcNow.AddMonths(3);
        query = query.Where(l => l.DataInizio <= fine && (l.DataFine ?? l.DataInizio) >= inizio);

        var lavori = await query.ToListAsync();

        var eventi = lavori.Select(l =>
        {
            // FullCalendar end è ESCLUSIVO per eventi all-day: aggiungi 1 giorno
            var endDate = (l.DataFine ?? l.DataInizio)!.Value.Date.AddDays(1);

            return new LavoroCalendarioDto
            {
                Id = l.Id.ToString(),
                Title = $"{l.ClienteNome} — {l.Descrizione}",
                Start = l.DataInizio!.Value.ToString("yyyy-MM-dd"),
                End = endDate.ToString("yyyy-MM-dd"),
                Color = StatiToColore(l.Stato, l.Squadra?.Colore),
                TextColor = "#ffffff",
                ExtendedProps = new LavoroCalendarioExtended
                {
                    Tipo = l.Tipo.ToString(),
                    Stato = l.Stato.ToString(),
                    Priorita = l.Priorita.ToString(),
                    ClienteNome = l.ClienteNome,
                    ClienteCitta = l.ClienteCitta,
                    SquadraNome = l.Squadra?.Nome
                }
            };
        }).ToList();

        return Ok(eventi);
    }

    // GET /api/lavori/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<LavoroDto>> GetLavoro(int id)
    {
        var lavoro = await db.Lavori
            .Include(l => l.Squadra)
            .Include(l => l.Documenti).ThenInclude(d => d.UploadedBy)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lavoro == null) return NotFound();

        if (CurrentRole == Roles.Caposquadra)
        {
            var squadraId = await GetCurrentSquadraId();
            if (lavoro.SquadraId != squadraId) return Forbid();
        }

        return Ok(MapToDto(lavoro));
    }

    // POST /api/lavori — Admin
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<LavoroDto>> CreaLavoro([FromBody] CreateLavoroRequest request)
    {
        if (!Enum.TryParse<TipoLavoro>(request.Tipo, out var tipo)) tipo = TipoLavoro.Altro;
        if (!Enum.TryParse<PrioritaLavoro>(request.Priorita, out var priorita)) priorita = PrioritaLavoro.Media;

        var lavoro = new Lavoro
        {
            NumeroLavoro = request.NumeroLavoro,
            Tipo = tipo,
            Descrizione = request.Descrizione,
            Priorita = priorita,
            ClienteNome = request.ClienteNome,
            ClienteIndirizzo = request.ClienteIndirizzo,
            ClienteCitta = request.ClienteCitta,
            ClienteCap = request.ClienteCap,
            ClienteProvincia = request.ClienteProvincia,
            ClienteTelefono = request.ClienteTelefono,
            ClienteEmail = request.ClienteEmail,
            ClienteNote = request.ClienteNote,
            DataInizio = request.DataInizio,
            DataFine = request.DataFine ?? request.DataInizio,
            FasciaDalle = request.FasciaDalle,
            FasciaAlle = request.FasciaAlle,
            DurataStimataOre = request.DurataStimataOre,
            NoteInterne = request.NoteInterne,
            NotePerSquadra = request.NotePerSquadra,
            ImportoLavoro = request.ImportoLavoro,
            SquadraId = request.SquadraId,
            Stato = request.DataInizio.HasValue ? StatoLavoro.Pianificato : StatoLavoro.DaPianificare
        };

        db.Lavori.Add(lavoro);
        await db.SaveChangesAsync();
        await db.Entry(lavoro).Reference(l => l.Squadra).LoadAsync();

        return CreatedAtAction(nameof(GetLavoro), new { id = lavoro.Id }, MapToDto(lavoro));
    }

    // PUT /api/lavori/{id} — Admin
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<LavoroDto>> AggiornaLavoro(int id, [FromBody] CreateLavoroRequest request)
    {
        var lavoro = await db.Lavori
            .Include(l => l.Squadra)
            .Include(l => l.Documenti).ThenInclude(d => d.UploadedBy)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lavoro == null) return NotFound();

        if (!Enum.TryParse<TipoLavoro>(request.Tipo, out var tipo)) tipo = TipoLavoro.Altro;
        if (!Enum.TryParse<PrioritaLavoro>(request.Priorita, out var priorita)) priorita = PrioritaLavoro.Media;

        lavoro.NumeroLavoro = request.NumeroLavoro;
        lavoro.Tipo = tipo;
        lavoro.Descrizione = request.Descrizione;
        lavoro.Priorita = priorita;
        lavoro.ClienteNome = request.ClienteNome;
        lavoro.ClienteIndirizzo = request.ClienteIndirizzo;
        lavoro.ClienteCitta = request.ClienteCitta;
        lavoro.ClienteCap = request.ClienteCap;
        lavoro.ClienteProvincia = request.ClienteProvincia;
        lavoro.ClienteTelefono = request.ClienteTelefono;
        lavoro.ClienteEmail = request.ClienteEmail;
        lavoro.ClienteNote = request.ClienteNote;
        lavoro.DataInizio = request.DataInizio;
        lavoro.DataFine = request.DataFine ?? request.DataInizio;
        lavoro.FasciaDalle = request.FasciaDalle;
        lavoro.FasciaAlle = request.FasciaAlle;
        lavoro.DurataStimataOre = request.DurataStimataOre;
        lavoro.NoteInterne = request.NoteInterne;
        lavoro.NotePerSquadra = request.NotePerSquadra;
        lavoro.ImportoLavoro = request.ImportoLavoro;
        lavoro.SquadraId = request.SquadraId;
        lavoro.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(MapToDto(lavoro));
    }

    // PATCH /api/lavori/{id}/stato — Caposquadra aggiorna stato
    [HttpPatch("{id}/stato")]
    [Authorize(Roles = $"{Roles.Caposquadra},{Roles.Admin}")]
    public async Task<ActionResult<LavoroDto>> AggiornaStato(int id, [FromBody] AggiornaStatoLavoroRequest request)
    {
        var lavoro = await db.Lavori
            .Include(l => l.Squadra)
            .Include(l => l.Documenti).ThenInclude(d => d.UploadedBy)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lavoro == null) return NotFound();

        if (CurrentRole == Roles.Caposquadra)
        {
            var squadraId = await GetCurrentSquadraId();
            if (lavoro.SquadraId != squadraId) return Forbid();
        }

        if (!Enum.TryParse<StatoLavoro>(request.Stato, out var stato))
            return BadRequest(new { message = "Stato non valido" });

        lavoro.Stato = stato;
        if (request.NotePerSquadra != null) lavoro.NotePerSquadra = request.NotePerSquadra;
        lavoro.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(MapToDto(lavoro));
    }

    // PATCH /api/lavori/{id}/esito — Caposquadra inserisce esito
    [HttpPatch("{id}/esito")]
    [Authorize(Roles = $"{Roles.Caposquadra},{Roles.Admin}")]
    public async Task<ActionResult<LavoroDto>> AggiornaEsito(int id, [FromBody] AggiornaEsitoLavoroRequest request)
    {
        var lavoro = await db.Lavori
            .Include(l => l.Squadra)
            .Include(l => l.Documenti).ThenInclude(d => d.UploadedBy)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lavoro == null) return NotFound();

        if (CurrentRole == Roles.Caposquadra)
        {
            var squadraId = await GetCurrentSquadraId();
            if (lavoro.SquadraId != squadraId) return Forbid();
        }

        if (!Enum.TryParse<EsitoLavoro>(request.Esito, out var esito))
            return BadRequest(new { message = "Esito non valido" });

        lavoro.Esito = esito;
        lavoro.NoteEsito = request.NoteEsito;
        lavoro.DataCompletamento = request.DataCompletamento ?? DateTime.UtcNow;
        lavoro.Stato = esito == EsitoLavoro.Completato ? StatoLavoro.Completato : StatoLavoro.Sospeso;
        lavoro.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(MapToDto(lavoro));
    }

    // POST /api/lavori/{id}/documenti — Upload documento
    [HttpPost("{id}/documenti")]
    public async Task<ActionResult<DocumentoLavoroDto>> UploadDocumento(
        int id,
        IFormFile file,
        [FromForm] string tipo = "Altro",
        [FromForm] string? descrizione = null)
    {
        var lavoro = await db.Lavori.FindAsync(id);
        if (lavoro == null) return NotFound();

        if (CurrentRole == Roles.Caposquadra)
        {
            var squadraId = await GetCurrentSquadraId();
            if (lavoro.SquadraId != squadraId) return Forbid();
        }

        var tipiConsentiti = new[] { "application/pdf", "image/jpeg", "image/png", "image/webp" };
        if (!tipiConsentiti.Contains(file.ContentType.ToLower()))
            return BadRequest(new { message = "Tipo file non consentito. Accettati: PDF, JPEG, PNG" });

        if (file.Length > 25 * 1024 * 1024)
            return BadRequest(new { message = "File troppo grande. Massimo 25 MB" });

        if (!Enum.TryParse<TipoDocumentoLavoro>(tipo, out var tipoDoc))
            tipoDoc = TipoDocumentoLavoro.Altro;

        // Riusa il FileService con una sub-cartella diversa
        var cartella = Path.Combine(
            fileService.GetPathCompleto(string.Empty).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar),
            "lavori", id.ToString());
        Directory.CreateDirectory(cartella);

        var estensione = Path.GetExtension(file.FileName);
        var nomeFileSalvato = $"{Guid.NewGuid()}{estensione}";
        var pathRelativo = Path.Combine("lavori", id.ToString(), nomeFileSalvato);
        var pathCompleto = Path.Combine(cartella, nomeFileSalvato);

        using (var stream = new FileStream(pathCompleto, FileMode.Create))
            await file.CopyToAsync(stream);

        var documento = new DocumentoLavoro
        {
            LavoroId = id,
            NomeFileOriginale = file.FileName,
            NomeFileSalvato = nomeFileSalvato,
            PathFile = pathRelativo,
            ContentType = file.ContentType,
            DimensioneBytes = file.Length,
            Tipo = tipoDoc,
            UploadedById = CurrentUserId,
            Descrizione = descrizione
        };

        db.DocumentiLavoro.Add(documento);
        await db.SaveChangesAsync();
        await db.Entry(documento).Reference(d => d.UploadedBy).LoadAsync();

        return Ok(new DocumentoLavoroDto
        {
            Id = documento.Id,
            LavoroId = documento.LavoroId,
            NomeFileOriginale = documento.NomeFileOriginale,
            ContentType = documento.ContentType,
            DimensioneBytes = documento.DimensioneBytes,
            Tipo = documento.Tipo.ToString(),
            DataUpload = documento.DataUpload,
            UploadedByNome = $"{documento.UploadedBy.Nome} {documento.UploadedBy.Cognome}",
            Descrizione = documento.Descrizione
        });
    }

    // GET /api/lavori/{id}/documenti/{docId}/download
    [HttpGet("{id}/documenti/{docId}/download")]
    public async Task<IActionResult> DownloadDocumento(int id, int docId)
    {
        var doc = await db.DocumentiLavoro
            .Include(d => d.Lavoro)
            .FirstOrDefaultAsync(d => d.Id == docId && d.LavoroId == id);

        if (doc == null) return NotFound();

        if (CurrentRole == Roles.Caposquadra)
        {
            var squadraId = await GetCurrentSquadraId();
            if (doc.Lavoro.SquadraId != squadraId) return Forbid();
        }

        if (!fileService.FileEsiste(doc.PathFile))
            return NotFound(new { message = "File non trovato sul server" });

        var bytes = await System.IO.File.ReadAllBytesAsync(fileService.GetPathCompleto(doc.PathFile));
        return File(bytes, doc.ContentType, doc.NomeFileOriginale);
    }

    // DELETE /api/lavori/{id}/documenti/{docId} — Admin
    [HttpDelete("{id}/documenti/{docId}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> EliminaDocumento(int id, int docId)
    {
        var doc = await db.DocumentiLavoro.FirstOrDefaultAsync(d => d.Id == docId && d.LavoroId == id);
        if (doc == null) return NotFound();

        fileService.EliminaFile(doc.PathFile);
        db.DocumentiLavoro.Remove(doc);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/lavori/{id} — Admin
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> EliminaLavoro(int id)
    {
        var lavoro = await db.Lavori.FindAsync(id);
        if (lavoro == null) return NotFound();
        db.Lavori.Remove(lavoro);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string StatiToColore(StatoLavoro stato, string? coloreSquadra) => stato switch
    {
        StatoLavoro.Completato => "#22c55e",
        StatoLavoro.Annullato  => "#6b7280",
        StatoLavoro.Sospeso    => "#f59e0b",
        StatoLavoro.InCorso    => "#3b82f6",
        _ => coloreSquadra ?? "#3b82f6"
    };

    private static LavoroDto MapToDto(Lavoro l) => new()
    {
        Id = l.Id,
        NumeroLavoro = l.NumeroLavoro,
        Tipo = l.Tipo.ToString(),
        Descrizione = l.Descrizione,
        Priorita = l.Priorita.ToString(),
        ClienteNome = l.ClienteNome,
        ClienteIndirizzo = l.ClienteIndirizzo,
        ClienteCitta = l.ClienteCitta,
        ClienteCap = l.ClienteCap,
        ClienteProvincia = l.ClienteProvincia,
        ClienteTelefono = l.ClienteTelefono,
        ClienteEmail = l.ClienteEmail,
        ClienteNote = l.ClienteNote,
        DataInizio = l.DataInizio,
        DataFine = l.DataFine,
        FasciaDalle = l.FasciaDalle,
        FasciaAlle = l.FasciaAlle,
        DurataStimataOre = l.DurataStimataOre,
        Stato = l.Stato.ToString(),
        Esito = l.Esito.HasValue ? l.Esito.ToString() : null,
        DataCompletamento = l.DataCompletamento,
        NoteEsito = l.NoteEsito,
        NoteInterne = l.NoteInterne,
        NotePerSquadra = l.NotePerSquadra,
        ImportoLavoro = l.ImportoLavoro,
        SquadraId = l.SquadraId,
        SquadraNome = l.Squadra?.Nome,
        SquadraColore = l.Squadra?.Colore,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt,
        Documenti = l.Documenti.Select(d => new DocumentoLavoroDto
        {
            Id = d.Id,
            LavoroId = d.LavoroId,
            NomeFileOriginale = d.NomeFileOriginale,
            ContentType = d.ContentType,
            DimensioneBytes = d.DimensioneBytes,
            Tipo = d.Tipo.ToString(),
            DataUpload = d.DataUpload,
            UploadedByNome = $"{d.UploadedBy.Nome} {d.UploadedBy.Cognome}",
            Descrizione = d.Descrizione
        }).ToList()
    };
}
