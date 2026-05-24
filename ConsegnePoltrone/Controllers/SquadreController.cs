using ConsegnePoltrone.Constants;
using ConsegnePoltrone.Data;
using ConsegnePoltrone.DTOs.Squadre;
using ConsegnePoltrone.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConsegnePoltrone.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SquadreController(ApplicationDbContext db) : ControllerBase
{
    private int CurrentUserId => int.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
        ?? "0");

    private string CurrentRole => User.FindFirstValue(ClaimTypes.Role) ?? "";

    // GET /api/squadre
    [HttpGet]
    public async Task<ActionResult<List<SquadraListDto>>> GetSquadre([FromQuery] bool soloAttive = false)
    {
        var query = db.Squadre
            .Include(s => s.Caposquadra)
            .Include(s => s.Membri)
            .Include(s => s.Lavori)
            .AsQueryable();

        if (soloAttive) query = query.Where(s => s.IsActive);

        // Caposquadra vede solo la propria squadra
        if (CurrentRole == Roles.Caposquadra)
        {
            var user = await db.Users.FindAsync(CurrentUserId);
            query = query.Where(s => s.Id == user!.SquadraId);
        }

        var squadre = await query
            .OrderBy(s => s.Nome)
            .Select(s => new SquadraListDto
            {
                Id = s.Id,
                Nome = s.Nome,
                Colore = s.Colore,
                Specializzazioni = s.Specializzazioni,
                IsActive = s.IsActive,
                CaposquadraNome = s.Caposquadra != null
                    ? $"{s.Caposquadra.Nome} {s.Caposquadra.Cognome}"
                    : null,
                NumMembri = s.Membri.Count,
                LavoriAttivi = s.Lavori.Count(l =>
                    l.Stato != StatoLavoro.Completato && l.Stato != StatoLavoro.Annullato)
            })
            .ToListAsync();

        return Ok(squadre);
    }

    // GET /api/squadre/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<SquadraDto>> GetSquadra(int id)
    {
        var squadra = await db.Squadre
            .Include(s => s.Caposquadra)
            .Include(s => s.Membri)
            .Include(s => s.Lavori)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (squadra == null) return NotFound();

        if (CurrentRole == Roles.Caposquadra)
        {
            var user = await db.Users.FindAsync(CurrentUserId);
            if (user?.SquadraId != id) return Forbid();
        }

        return Ok(MapToDto(squadra));
    }

    // POST /api/squadre — Admin
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<SquadraDto>> CreaSquadra([FromBody] CreateSquadraRequest request)
    {
        var squadra = new Squadra
        {
            Nome = request.Nome,
            Descrizione = request.Descrizione,
            Colore = request.Colore,
            Specializzazioni = request.Specializzazioni,
            CaposquadraId = request.CaposquadraId
        };

        db.Squadre.Add(squadra);
        await db.SaveChangesAsync();

        // Assegna il caposquadra come membro della squadra
        if (request.CaposquadraId.HasValue)
        {
            var capo = await db.Users.FindAsync(request.CaposquadraId.Value);
            if (capo != null) { capo.SquadraId = squadra.Id; }
        }

        // Assegna gli altri membri
        foreach (var membroId in request.MembroIds.Where(id => id != request.CaposquadraId))
        {
            var membro = await db.Users.FindAsync(membroId);
            if (membro != null) membro.SquadraId = squadra.Id;
        }

        await db.SaveChangesAsync();

        await db.Entry(squadra).Reference(s => s.Caposquadra).LoadAsync();
        await db.Entry(squadra).Collection(s => s.Membri).LoadAsync();

        return CreatedAtAction(nameof(GetSquadra), new { id = squadra.Id }, MapToDto(squadra));
    }

    // PUT /api/squadre/{id} — Admin
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<SquadraDto>> AggiornaSquadra(int id, [FromBody] UpdateSquadraRequest request)
    {
        var squadra = await db.Squadre
            .Include(s => s.Caposquadra)
            .Include(s => s.Membri)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (squadra == null) return NotFound();

        if (request.Nome != null) squadra.Nome = request.Nome;
        if (request.Descrizione != null) squadra.Descrizione = request.Descrizione;
        if (request.Colore != null) squadra.Colore = request.Colore;
        if (request.Specializzazioni != null) squadra.Specializzazioni = request.Specializzazioni;
        if (request.IsActive.HasValue) squadra.IsActive = request.IsActive.Value;

        if (request.CaposquadraId.HasValue)
        {
            squadra.CaposquadraId = request.CaposquadraId;
        }

        // Riassegna membri se specificato
        if (request.MembroIds != null)
        {
            // Rimuovi squadra dagli attuali
            foreach (var m in squadra.Membri.Where(m => !request.MembroIds.Contains(m.Id)))
                m.SquadraId = null;

            // Aggiungi nuovi
            foreach (var membroId in request.MembroIds)
            {
                var membro = await db.Users.FindAsync(membroId);
                if (membro != null) membro.SquadraId = id;
            }
        }

        await db.SaveChangesAsync();

        await db.Entry(squadra).Reference(s => s.Caposquadra).LoadAsync();
        await db.Entry(squadra).Collection(s => s.Membri).LoadAsync();

        return Ok(MapToDto(squadra));
    }

    // GET /api/squadre/disponibili — utenti non ancora in nessuna squadra (per assegnazione)
    [HttpGet("utenti-disponibili")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult> GetUtentiDisponibili()
    {
        var utenti = await db.Users
            .Where(u => u.IsActive && u.SquadraId == null
                && u.Role != Roles.Admin && u.Role != Roles.Manager)
            .Select(u => new { u.Id, u.Nome, u.Cognome, u.Email, u.Role })
            .ToListAsync();

        return Ok(utenti);
    }

    private static SquadraDto MapToDto(Squadra s) => new()
    {
        Id = s.Id,
        Nome = s.Nome,
        Descrizione = s.Descrizione,
        Colore = s.Colore,
        Specializzazioni = s.Specializzazioni,
        IsActive = s.IsActive,
        CaposquadraId = s.CaposquadraId,
        CaposquadraNome = s.Caposquadra != null
            ? $"{s.Caposquadra.Nome} {s.Caposquadra.Cognome}"
            : null,
        Membri = s.Membri.Select(m => new MembroDto
        {
            Id = m.Id,
            Nome = m.Nome,
            Cognome = m.Cognome,
            Email = m.Email,
            Telefono = m.Telefono,
            IsCaposquadra = m.Id == s.CaposquadraId
        }).ToList()
    };
}
