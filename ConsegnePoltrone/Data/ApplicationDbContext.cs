using ConsegnePoltrone.Models;
using Microsoft.EntityFrameworkCore;

namespace ConsegnePoltrone.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Consegna> Consegne { get; set; }
    public DbSet<Documento> Documenti { get; set; }
    public DbSet<Squadra> Squadre { get; set; }
    public DbSet<Lavoro> Lavori { get; set; }
    public DbSet<DocumentoLavoro> DocumentiLavoro { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasMaxLength(50);
            e.Property(u => u.Email).HasMaxLength(255);
            e.Property(u => u.Nome).HasMaxLength(100);
            e.Property(u => u.Cognome).HasMaxLength(100);
        });

        // Consegna
        modelBuilder.Entity<Consegna>(e =>
        {
            e.Property(c => c.NumeroOrdine).HasMaxLength(50);
            e.Property(c => c.ImportoDaPagare).HasColumnType("decimal(18,2)");
            e.Property(c => c.Stato).HasConversion<string>();
            e.Property(c => c.Esito).HasConversion<string>();

            e.HasOne(c => c.Trasportatore)
             .WithMany(u => u.ConsegneAssegnate)
             .HasForeignKey(c => c.TrasportatoreId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // Documento
        modelBuilder.Entity<Documento>(e =>
        {
            e.Property(d => d.Tipo).HasConversion<string>();

            e.HasOne(d => d.Consegna)
             .WithMany(c => c.Documenti)
             .HasForeignKey(d => d.ConsegnaId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(d => d.UploadedBy)
             .WithMany(u => u.DocumentiCaricati)
             .HasForeignKey(d => d.UploadedById)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Squadra
        modelBuilder.Entity<Squadra>(e =>
        {
            e.Property(s => s.Nome).HasMaxLength(100);
            e.Property(s => s.Colore).HasMaxLength(7);

            e.HasOne(s => s.Caposquadra)
             .WithOne()
             .HasForeignKey<Squadra>(s => s.CaposquadraId)
             .OnDelete(DeleteBehavior.SetNull);

            e.HasMany(s => s.Membri)
             .WithOne(u => u.Squadra)
             .HasForeignKey(u => u.SquadraId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // Lavoro
        modelBuilder.Entity<Lavoro>(e =>
        {
            e.Property(l => l.NumeroLavoro).HasMaxLength(50);
            e.Property(l => l.Tipo).HasConversion<string>();
            e.Property(l => l.Stato).HasConversion<string>();
            e.Property(l => l.Priorita).HasConversion<string>();
            e.Property(l => l.Esito).HasConversion<string>();
            e.Property(l => l.ImportoLavoro).HasColumnType("decimal(18,2)");

            e.HasOne(l => l.Squadra)
             .WithMany(s => s.Lavori)
             .HasForeignKey(l => l.SquadraId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // DocumentoLavoro
        modelBuilder.Entity<DocumentoLavoro>(e =>
        {
            e.Property(d => d.Tipo).HasConversion<string>();

            e.HasOne(d => d.Lavoro)
             .WithMany(l => l.Documenti)
             .HasForeignKey(d => d.LavoroId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(d => d.UploadedBy)
             .WithMany(u => u.DocumentiLavoroCaricati)
             .HasForeignKey(d => d.UploadedById)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
