using ConsegnePoltrone.Constants;
using ConsegnePoltrone.Data;
using ConsegnePoltrone.DTOs.Auth;
using ConsegnePoltrone.Models;
using ConsegnePoltrone.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConsegnePoltrone.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(ApplicationDbContext db, JwtService jwtService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Email o password non validi" });

        var token = jwtService.GenerateToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(24);

        return Ok(new LoginResponse
        {
            Token = token,
            Email = user.Email,
            Nome = user.Nome,
            Cognome = user.Cognome,
            Role = user.Role,
            UserId = user.Id,
            ExpiresAt = expiresAt
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserMeResponse>> GetMe()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
            ?? "0");

        var user = await db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        return Ok(new UserMeResponse
        {
            Id = user.Id,
            Email = user.Email,
            Nome = user.Nome,
            Cognome = user.Cognome,
            Role = user.Role,
            Telefono = user.Telefono
        });
    }

    // Solo Admin: lista utenti
    [HttpGet("utenti")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<List<UserMeResponse>>> GetUtenti()
    {
        var utenti = await db.Users
            .Where(u => u.IsActive)
            .Select(u => new UserMeResponse
            {
                Id = u.Id,
                Email = u.Email,
                Nome = u.Nome,
                Cognome = u.Cognome,
                Role = u.Role,
                Telefono = u.Telefono
            })
            .ToListAsync();

        return Ok(utenti);
    }

    // Solo Admin: crea utente
    [HttpPost("utenti")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<UserMeResponse>> CreaUtente([FromBody] CreaUtenteRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
            return BadRequest(new { message = "Email già in uso" });

        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Nome = request.Nome,
            Cognome = request.Cognome,
            Role = request.Role,
            Telefono = request.Telefono
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMe), new UserMeResponse
        {
            Id = user.Id,
            Email = user.Email,
            Nome = user.Nome,
            Cognome = user.Cognome,
            Role = user.Role
        });
    }

    // Solo Admin: trasportatori disponibili per assegnazione
    [HttpGet("trasportatori")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Manager}")]
    public async Task<ActionResult<List<UserMeResponse>>> GetTrasportatori()
    {
        var trasportatori = await db.Users
            .Where(u => u.IsActive && u.Role == Roles.Trasportatore)
            .Select(u => new UserMeResponse
            {
                Id = u.Id,
                Email = u.Email,
                Nome = u.Nome,
                Cognome = u.Cognome,
                Role = u.Role,
                Telefono = u.Telefono
            })
            .ToListAsync();

        return Ok(trasportatori);
    }
}

public class CreaUtenteRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Cognome { get; set; } = string.Empty;
    public string Role { get; set; } = Roles.Trasportatore;
    public string? Telefono { get; set; }
}
