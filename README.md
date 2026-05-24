# Consegne Poltrone — Dashboard Gestione Consegne

Sistema web per la gestione delle consegne tra il back office e il trasportatore.

## Architettura

```
ConsegnePoltrone/
├── ConsegnePoltrone/     ← Backend: .NET 10 Web API
│   ├── Controllers/      ← Auth, Consegne, Documenti, Report
│   ├── Data/             ← ApplicationDbContext + DbSeeder
│   ├── Models/           ← User, Consegna, Documento
│   ├── Services/         ← JwtService, FileService
│   ├── DTOs/             ← Data Transfer Objects
│   └── Constants/        ← Roles
└── frontend/             ← Frontend: React + Vite + TypeScript + Tailwind
    └── src/
        ├── pages/        ← Login, Dashboard, Consegne, Report, Utenti
        ├── services/     ← API clients
        ├── contexts/     ← AuthContext (JWT)
        └── types/        ← TypeScript types
```

## Ruoli utenti

| Ruolo          | Permessi |
|----------------|----------|
| `Admin`        | Tutto: crea/modifica consegne, gestisce utenti, vede note interne |
| `Trasportatore`| Vede solo le sue consegne, pianifica date, inserisce esito, carica documenti |
| `Manager`      | Vede tutte le consegne e i report, sola lettura |

## Prerequisiti

- .NET 10 SDK
- SQL Server (locale o remoto)
- Node.js 18+

---

## Setup Backend

### 1. Configurare appsettings.json

Modifica `ConsegnePoltrone/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=TUO_SERVER;Database=ConsegnePoltrone;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Secret": "UNA_CHIAVE_SICURA_DI_ALMENO_32_CARATTERI_RANDOM",
    "Issuer": "ConsegnePoltrone",
    "Audience": "ConsegnePoltrone",
    "ExpiryHours": "24"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173", "https://tuodominio.it"]
  },
  "FileStorage": {
    "UploadPath": "uploads"
  }
}
```

> ⚠️ **Importante**: Genera una chiave JWT sicura con: `openssl rand -base64 32`

### 2. Installare pacchetti NuGet

```bash
cd ConsegnePoltrone
dotnet restore
```

### 3. Creare il database (EF Core Migration)

```bash
cd ConsegnePoltrone
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 4. Avviare il backend

```bash
dotnet run --project ConsegnePoltrone
```

L'API sarà disponibile su `http://localhost:5000`

**Al primo avvio** viene creato automaticamente un utente admin:
- Email: `admin@consegnepoltrone.it`
- Password: `Admin@2024!`
> ⚠️ Cambia la password al primo accesso!

### 5. Swagger UI (solo development)

`http://localhost:5000/swagger`

---

## Setup Frontend

```bash
cd frontend

# Copiare il file .env
cp .env.example .env
# Modificare VITE_API_URL se necessario

# Installare dipendenze
npm install

# Avviare in sviluppo
npm run dev
```

Il frontend sarà disponibile su `http://localhost:5173`

---

## API Endpoints

### Auth
| Metodo | Endpoint | Ruolo | Descrizione |
|--------|----------|-------|-------------|
| `POST` | `/api/auth/login` | Tutti | Login, ritorna JWT |
| `GET` | `/api/auth/me` | Autenticato | Info utente corrente |
| `GET` | `/api/auth/trasportatori` | Admin, Manager | Lista trasportatori |
| `GET` | `/api/auth/utenti` | Admin | Lista utenti |
| `POST` | `/api/auth/utenti` | Admin | Crea utente |

### Consegne
| Metodo | Endpoint | Ruolo | Descrizione |
|--------|----------|-------|-------------|
| `GET` | `/api/consegne` | Tutti | Lista (filtrata per ruolo) |
| `GET` | `/api/consegne/{id}` | Tutti | Dettaglio |
| `POST` | `/api/consegne` | Admin | Crea consegna |
| `PUT` | `/api/consegne/{id}` | Admin | Modifica completa |
| `PATCH` | `/api/consegne/{id}/pianifica` | Trasportatore, Admin | Imposta data prevista |
| `PATCH` | `/api/consegne/{id}/esito` | Trasportatore, Admin | Inserisce esito |
| `DELETE` | `/api/consegne/{id}` | Admin | Elimina |

### Documenti
| Metodo | Endpoint | Ruolo | Descrizione |
|--------|----------|-------|-------------|
| `GET` | `/api/consegne/{id}/documenti` | Tutti | Lista documenti |
| `POST` | `/api/consegne/{id}/documenti` | Tutti | Upload (PDF/JPG/PNG, max 20MB) |
| `DELETE` | `/api/consegne/{id}/documenti/{docId}` | Admin | Elimina documento |
| `GET` | `/api/documenti/{id}/download` | Tutti | Download file |

### Report (Admin + Manager)
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/report/statistiche` | KPI globali |
| `GET` | `/api/report/mensile?mesi=6` | Trend mensile |
| `GET` | `/api/report/trasportatori` | Performance per trasportatore |

---

## Stati consegna

```
DaPianificare → Pianificata → InTransito → Consegnata
                                         ↘ NonConsegnata
           (annullata in qualsiasi stato) → Annullata
```

## Tipi documento

- `BollaDaFirmare` — Bolla caricata dall'admin da far firmare
- `BollaFirmata` — Bolla firmata caricata dal trasportatore
- `Foto` — Foto della consegna
- `Altro` — Qualsiasi altro documento

---

## Deploy su VPS

### Backend
```bash
dotnet publish -c Release -o /var/www/consegne-api
# Configurare come servizio systemd o IIS
```

### Frontend
```bash
cd frontend
npm run build
# Copiare dist/ sul web server (nginx, Apache, IIS)
```

### Nginx config (esempio)
```nginx
server {
    listen 80;
    server_name tuodominio.it;
    
    # Frontend
    root /var/www/consegne-frontend/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
    }
}
```
