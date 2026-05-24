using ConsegnePoltrone.Constants;
using ConsegnePoltrone.Data;
using ConsegnePoltrone.DTOs.Consegne;
using ConsegnePoltrone.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConsegnePoltrone.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConsegneController(ApplicationDbContext db) : ControllerBase
{
    private int CurrentUserId => int.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
        ?? "0");

    private string CurrentRole => User.FindFirstValue(ClaimTypes.Role) ?? "";

    // GET /api/consegne — Lista (filtrata per ruolo)
    [HttpGet]
    public async Task<ActionResult<List<ConsegnaListDto>>> GetConsegne(
        [FromQuery] string? stato,
        [FromQuery] string? cerca,
        [FromQuery] DateTime? dal,
        [FromQuery] DateTime? al,
        [FromQuery] int? trasportatoreId,
        [FromQuery] int pagina = 1,
        [FromQuery] int perPagina = 20)
    {
        var query = db.Consegne
            .Include(c => c.Trasportatore)
            .Include(c => c.Documenti)
            .AsQueryable();

        // Il trasportatore vede solo le sue consegne
        if (CurrentRole == Roles.Trasportatore)
            query = query.Where(c => c.TrasportatoreId == CurrentUserId);

        // Filtri
        if (!string.IsNullOrEmpty(stato) && Enum.TryParse<StatoConsegna>(stato, out var statoEnum))
            query = query.Where(c => c.Stato == statoEnum);

        if (!string.IsNullOrEmpty(cerca))
            query = query.Where(c =>
                c.NumeroOrdine.Contains(cerca) ||
                c.ClienteNome.Contains(cerca) ||
                c.ClienteCitta.Contains(cerca) ||
                c.ProdottoDescrizione.Contains(cerca));

        if (dal.HasValue) query = query.Where(c => c.DataOrdine >= dal.Value);
        if (al.HasValue) query = query.Where(c => c.DataOrdine <= al.Value);
        if (trasportatoreId.HasValue && CurrentRole != Roles.Trasportatore)
            query = query.Where(c => c.TrasportatoreId == trasportatoreId);

        var totale = await query.CountAsync();
        var consegne = await query
            .OrderByDescending(c => c.DataOrdine)
            .Skip((pagina - 1) * perPagina)
            .Take(perPagina)
            .Select(c => new ConsegnaListDto
            {
                Id = c.Id,
                NumeroOrdine = c.NumeroOrdine,
                DataOrdine = c.DataOrdine,
                ClienteNome = c.ClienteNome,
                ClienteCitta = c.ClienteCitta,
                ProdottoDescrizione = c.ProdottoDescrizione,
                ImportoDaPagare = c.ImportoDaPagare,
                PagamentoRicevuto = c.PagamentoRicevuto,
                Stato = c.Stato.ToString(),
                DataPrevistaConsegna = c.DataPrevistaConsegna,
                Esito = c.Esito.HasValue ? c.Esito.ToString() : null,
                TrasportatoreNome = c.Trasportatore != null
                    ? $"{c.Trasportatore.Nome} {c.Trasportatore.Cognome}"
                    : null,
                DocumentiCount = c.Documenti.Count
            })
            .ToListAsync();

        Response.Headers.Append("X-Total-Count", totale.ToString());
        Response.Headers.Append("X-Page", pagina.ToString());
        Response.Headers.Append("X-Per-Page", perPagina.ToString());

        return Ok(consegne);
    }

    // GET /api/consegne/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ConsegnaDto>> GetConsegna(int id)
    {
        var consegna = await db.Consegne
            .Include(c => c.Trasportatore)
            .Include(c => c.Documenti).ThenInclude(d => d.UploadedBy)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (consegna == null) return NotFound();

        // Trasportatore: può vedere solo le sue
        if (CurrentRole == Roles.Trasportatore && consegna.TrasportatoreId != CurrentUserId)
            return Forbid();

        return Ok(MapToDto(consegna));
    }

    // POST /api/consegne — Solo Admin
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ConsegnaDto>> CreaConsegna([FromBody] CreateConsegnaRequest request)
    {
        if (await db.Consegne.AnyAsync(c => c.NumeroOrdine == request.NumeroOrdine))
            return BadRequest(new { message = "Numero ordine già presente" });

        var consegna = new Consegna
        {
            NumeroOrdine = request.NumeroOrdine,
            DataOrdine = request.DataOrdine,
            ClienteNome = request.ClienteNome,
            ClienteIndirizzo = request.ClienteIndirizzo,
            ClienteCitta = request.ClienteCitta,
            ClienteCap = request.ClienteCap,
            ClienteProvincia = request.ClienteProvincia,
            ClienteTelefono = request.ClienteTelefono,
            ClienteEmail = request.ClienteEmail,
            ClienteNote = request.ClienteNote,
            ProdottoDescrizione = request.ProdottoDescrizione,
            ProdottoCodice = request.ProdottoCodice,
            Quantita = request.Quantita,
            ProdottoNote = request.ProdottoNote,
            ImportoDaPagare = request.ImportoDaPagare,
            ModalitaPagamento = request.ModalitaPagamento,
            TrasportatoreId = request.TrasportatoreId,
            NoteInterne = request.NoteInterne
        };

        if (request.TrasportatoreId.HasValue)
            consegna.Stato = StatoConsegna.Pianificata;

        db.Consegne.Add(consegna);
        await db.SaveChangesAsync();

        await db.Entry(consegna).Reference(c => c.Trasportatore).LoadAsync();

        return CreatedAtAction(nameof(GetConsegna), new { id = consegna.Id }, MapToDto(consegna));
    }

    // PUT /api/consegne/{id} — Admin aggiorna tutto
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ConsegnaDto>> AggiornaConsegna(int id, [FromBody] UpdateConsegnaRequest request)
    {
        var consegna = await db.Consegne
            .Include(c => c.Trasportatore)
            .Include(c => c.Documenti).ThenInclude(d => d.UploadedBy)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (consegna == null) return NotFound();

        if (request.NumeroOrdine != null) consegna.NumeroOrdine = request.NumeroOrdine;
        if (request.ClienteNome != null) consegna.ClienteNome = request.ClienteNome;
        if (request.ClienteIndirizzo != null) consegna.ClienteIndirizzo = request.ClienteIndirizzo;
        if (request.ClienteCitta != null) consegna.ClienteCitta = request.ClienteCitta;
        if (request.ClienteCap != null) consegna.ClienteCap = request.ClienteCap;
        if (request.ClienteProvincia != null) consegna.ClienteProvincia = request.ClienteProvincia;
        if (request.ClienteTelefono != null) consegna.ClienteTelefono = request.ClienteTelefono;
        if (request.ClienteEmail != null) consegna.ClienteEmail = request.ClienteEmail;
        if (request.ClienteNote != null) consegna.ClienteNote = request.ClienteNote;
        if (request.ProdottoDescrizione != null) consegna.ProdottoDescrizione = request.ProdottoDescrizione;
        if (request.ProdottoCodice != null) consegna.ProdottoCodice = request.ProdottoCodice;
        if (request.Quantita.HasValue) consegna.Quantita = request.Quantita.Value;
        if (request.ProdottoNote != null) consegna.ProdottoNote = request.ProdottoNote;
        if (request.ImportoDaPagare.HasValue) consegna.ImportoDaPagare = request.ImportoDaPagare.Value;
        if (request.PagamentoRicevuto.HasValue) consegna.PagamentoRicevuto = request.PagamentoRicevuto.Value;
        if (request.ModalitaPagamento != null) consegna.ModalitaPagamento = request.ModalitaPagamento;
        if (request.TrasportatoreId.HasValue)
        {
            consegna.TrasportatoreId = request.TrasportatoreId.Value;
            if (consegna.Stato == StatoConsegna.DaPianificare)
                consegna.Stato = StatoConsegna.Pianificata;
        }
        if (request.NoteInterne != null) consegna.NoteInterne = request.NoteInterne;

        consegna.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(MapToDto(consegna));
    }

    // PATCH /api/consegne/{id}/pianifica — Trasportatore pianifica la data
    [HttpPatch("{id}/pianifica")]
    [Authorize(Roles = $"{Roles.Trasportatore},{Roles.Admin}")]
    public async Task<ActionResult<ConsegnaDto>> Pianifica(int id, [FromBody] AggiornaPianificazioneRequest request)
    {
        var consegna = await db.Consegne
            .Include(c => c.Trasportatore)
            .Include(c => c.Documenti).ThenInclude(d => d.UploadedBy)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (consegna == null) return NotFound();
        if (CurrentRole == Roles.Trasportatore && consegna.TrasportatoreId != CurrentUserId) return Forbid();

        consegna.DataPrevistaConsegna = request.DataPrevistaConsegna;
        consegna.FasciaDalle = request.FasciaDalle;
        consegna.FasciaAlle = request.FasciaAlle;
        if (consegna.Stato == StatoConsegna.DaPianificare || consegna.Stato == StatoConsegna.Pianificata)
            consegna.Stato = StatoConsegna.InTransito;
        consegna.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(MapToDto(consegna));
    }

    // PATCH /api/consegne/{id}/esito — Trasportatore inserisce l'esito
    [HttpPatch("{id}/esito")]
    [Authorize(Roles = $"{Roles.Trasportatore},{Roles.Admin}")]
    public async Task<ActionResult<ConsegnaDto>> AggiornaEsito(int id, [FromBody] AggiornaEsitoRequest request)
    {
        var consegna = await db.Consegne
            .Include(c => c.Trasportatore)
            .Include(c => c.Documenti).ThenInclude(d => d.UploadedBy)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (consegna == null) return NotFound();
        if (CurrentRole == Roles.Trasportatore && consegna.TrasportatoreId != CurrentUserId) return Forbid();

        if (!Enum.TryParse<EsitoConsegna>(request.Esito, out var esito))
            return BadRequest(new { message = "Esito non valido" });

        consegna.Esito = esito;
        consegna.DataEffettivaConsegna = request.DataEffettivaConsegna;
        consegna.NoteConsegna = request.NoteConsegna;
        consegna.Stato = esito == EsitoConsegna.Consegnata ? StatoConsegna.Consegnata : StatoConsegna.NonConsegnata;
        if (request.PagamentoRicevuto.HasValue) consegna.PagamentoRicevuto = request.PagamentoRicevuto.Value;
        consegna.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(MapToDto(consegna));
    }

    // DELETE /api/consegne/{id} — Solo Admin
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> EliminaConsegna(int id)
    {
        var consegna = await db.Consegne.FindAsync(id);
        if (consegna == null) return NotFound();

        db.Consegne.Remove(consegna);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static ConsegnaDto MapToDto(Consegna c) => new()
    {
        Id = c.Id,
        NumeroOrdine = c.NumeroOrdine,
        DataOrdine = c.DataOrdine,
        ClienteNome = c.ClienteNome,
        ClienteIndirizzo = c.ClienteIndirizzo,
        ClienteCitta = c.ClienteCitta,
        ClienteCap = c.ClienteCap,
        ClienteProvincia = c.ClienteProvincia,
        ClienteTelefono = c.ClienteTelefono,
        ClienteEmail = c.ClienteEmail,
        ClienteNote = c.ClienteNote,
        ProdottoDescrizione = c.ProdottoDescrizione,
        ProdottoCodice = c.ProdottoCodice,
        Quantita = c.Quantita,
        ProdottoNote = c.ProdottoNote,
        ImportoDaPagare = c.ImportoDaPagare,
        PagamentoRicevuto = c.PagamentoRicevuto,
        ModalitaPagamento = c.ModalitaPagamento,
        Stato = c.Stato.ToString(),
        DataPrevistaConsegna = c.DataPrevistaConsegna,
        FasciaDalle = c.FasciaDalle,
        FasciaAlle = c.FasciaAlle,
        DataEffettivaConsegna = c.DataEffettivaConsegna,
        Esito = c.Esito.HasValue ? c.Esito.ToString() : null,
        NoteConsegna = c.NoteConsegna,
        NoteInterne = c.NoteInterne,
        TrasportatoreId = c.TrasportatoreId,
        TrasportatoreNome = c.Trasportatore != null
            ? $"{c.Trasportatore.Nome} {c.Trasportatore.Cognome}"
            : null,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt,
        Documenti = c.Documenti.Select(d => new DocumentoDto
        {
            Id = d.Id,
            ConsegnaId = d.ConsegnaId,
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
