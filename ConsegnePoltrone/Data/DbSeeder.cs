using ConsegnePoltrone.Constants;
using ConsegnePoltrone.Models;
using Microsoft.EntityFrameworkCore;

namespace ConsegnePoltrone.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db, IConfiguration configuration)
    {
        await db.Database.MigrateAsync();

        if (!await db.Users.AnyAsync())
        {
            // La password NON è hardcodata: deve essere impostata tramite
            // variabile d'ambiente o appsettings.Production.json
            // Variabile d'ambiente: Seeder__AdminPassword=<password>
            var adminPassword = configuration["Seeder:AdminPassword"]
                ?? throw new InvalidOperationException(
                    "Seeder:AdminPassword non configurata. " +
                    "Impostare la variabile d'ambiente Seeder__AdminPassword prima di avviare.");

            db.Users.Add(new User
            {
                Email = "admin@consegnepoltrone.it",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                Nome = "Admin",
                Cognome = "Sistema",
                Role = Roles.Admin,
                IsActive = true
            });

            await db.SaveChangesAsync();
            Console.WriteLine("✅ Utente admin creato: admin@consegnepoltrone.it");
        }
    }
}
