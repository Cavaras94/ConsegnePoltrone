using ConsegnePoltrone.Constants;
using ConsegnePoltrone.Data;
using ConsegnePoltrone.DTOs.Report;
using ConsegnePoltrone.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace ConsegnePoltrone.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{Roles.Admin},{Roles.Manager}")]
public class ReportController(ApplicationDbContext db) : ControllerBase
{
    // GET /api/report/statistiche
    [HttpGet("statistiche")]
    public async Task<ActionResult<StatisticheDto>> GetStatistiche()
    {
        var oggi = DateTime.UtcNow.Date;
        var inizioMese = new DateTime(oggi.Year, oggi.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var consegne = await db.Consegne.ToListAsync();

        var stats = new StatisticheDto
        {
            TotaleConsegne = consegne.Count,
            DaPianificare = consegne.Count(c => c.Stato == StatoConsegna.DaPianificare),
            Pianificate = consegne.Count(c => c.Stato == StatoConsegna.Pianificata),
            InTransito = consegne.Count(c => c.Stato == StatoConsegna.InTransito),
            Consegnate = consegne.Count(c => c.Stato == StatoConsegna.Consegnata),
            NonConsegnate = consegne.Count(c => c.Stato == StatoConsegna.NonConsegnata),
            Annullate = consegne.Count(c => c.Stato == StatoConsegna.Annullata),
            TotaleImporti = consegne.Sum(c => c.ImportoDaPagare),
            ImportiRiscossi = consegne.Where(c => c.PagamentoRicevuto).Sum(c => c.ImportoDaPagare),
            ImportiDaRiscuotere = consegne.Where(c => !c.PagamentoRicevuto).Sum(c => c.ImportoDaPagare),
            ConsegneMese = consegne.Count(c => c.DataOrdine >= inizioMese),
            ConsegneOggi = consegne.Count(c => c.DataPrevistaConsegna.HasValue &&
                                               c.DataPrevistaConsegna.Value.Date == oggi)
        };

        return Ok(stats);
    }

    // GET /api/report/mensile?mesi=6
    [HttpGet("mensile")]
    public async Task<ActionResult<List<ConsegneMensiliDto>>> GetMensile([FromQuery] int mesi = 6)
    {
        var da = DateTime.UtcNow.AddMonths(-mesi).Date;

        var consegne = await db.Consegne
            .Where(c => c.DataOrdine >= da)
            .ToListAsync();

        var result = consegne
            .GroupBy(c => new { c.DataOrdine.Year, c.DataOrdine.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new ConsegneMensiliDto
            {
                Anno = g.Key.Year,
                Mese = g.Key.Month,
                NomeMese = new DateTime(g.Key.Year, g.Key.Month, 1)
                    .ToString("MMMM yyyy", new CultureInfo("it-IT")),
                Totale = g.Count(),
                Consegnate = g.Count(c => c.Stato == StatoConsegna.Consegnata),
                NonConsegnate = g.Count(c => c.Stato == StatoConsegna.NonConsegnata)
            })
            .ToList();

        return Ok(result);
    }

    // GET /api/report/trasportatori
    [HttpGet("trasportatori")]
    public async Task<ActionResult<List<TrasportatoreStatsDto>>> GetStatsTrasportatori()
    {
        var stats = await db.Consegne
            .Include(c => c.Trasportatore)
            .Where(c => c.TrasportatoreId != null)
            .GroupBy(c => new { c.TrasportatoreId, c.Trasportatore!.Nome, c.Trasportatore.Cognome })
            .Select(g => new TrasportatoreStatsDto
            {
                TrasportatoreId = g.Key.TrasportatoreId!.Value,
                Nome = $"{g.Key.Nome} {g.Key.Cognome}",
                Totale = g.Count(),
                Consegnate = g.Count(c => c.Stato == StatoConsegna.Consegnata),
                NonConsegnate = g.Count(c => c.Stato == StatoConsegna.NonConsegnata),
                PercentualeSuccesso = g.Count() > 0
                    ? Math.Round((double)g.Count(c => c.Stato == StatoConsegna.Consegnata) / g.Count() * 100, 1)
                    : 0
            })
            .OrderByDescending(s => s.Totale)
            .ToListAsync();

        return Ok(stats);
    }
}
