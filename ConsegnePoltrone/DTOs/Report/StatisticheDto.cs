namespace ConsegnePoltrone.DTOs.Report;

public class StatisticheDto
{
    public int TotaleConsegne { get; set; }
    public int DaPianificare { get; set; }
    public int Pianificate { get; set; }
    public int InTransito { get; set; }
    public int Consegnate { get; set; }
    public int NonConsegnate { get; set; }
    public int Annullate { get; set; }
    public decimal TotaleImporti { get; set; }
    public decimal ImportiRiscossi { get; set; }
    public decimal ImportiDaRiscuotere { get; set; }
    public int ConsegneMese { get; set; }
    public int ConsegneOggi { get; set; }
}

public class ConsegneMensiliDto
{
    public int Anno { get; set; }
    public int Mese { get; set; }
    public string NomeMese { get; set; } = string.Empty;
    public int Totale { get; set; }
    public int Consegnate { get; set; }
    public int NonConsegnate { get; set; }
}

public class TrasportatoreStatsDto
{
    public int TrasportatoreId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int Totale { get; set; }
    public int Consegnate { get; set; }
    public int NonConsegnate { get; set; }
    public double PercentualeSuccesso { get; set; }
}
