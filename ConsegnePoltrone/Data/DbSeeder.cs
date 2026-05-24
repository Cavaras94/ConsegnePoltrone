using ConsegnePoltrone.Constants;
using ConsegnePoltrone.Models;
using Microsoft.EntityFrameworkCore;

namespace ConsegnePoltrone.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db)
    {
        await db.Database.MigrateAsync();

        // Crea admin di default se non esiste
        if (!await db.Users.AnyAsync())
        {
            var adminPassword = "Admin@2024!"; // Cambiare in produzione!
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
            Console.WriteLine("✅ Utente admin creato: admin@consegnepoltrone.it / Admin@2024!");
            Console.WriteLine("⚠️  Cambia la password al primo accesso!");
        }
    }
}
