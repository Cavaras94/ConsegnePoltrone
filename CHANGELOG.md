# Changelog

Tutte le modifiche significative al progetto vengono documentate in questo file.

Formato basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/).

---

## [Unreleased]

## [0.4.0] — 2026-05-24

### Rimosso
- **Priorità installazioni** — campo rimosso da lista, dettaglio e form di creazione
- **Campi data nel form "Nuova installazione"** — data inizio/fine arrivano dal CRM e non sono inseribili manualmente dalla dashboard; la sezione "Pianificazione" è diventata solo "Fascia oraria" con nota esplicativa

## [0.3.0] — 2026-05-24

### Modificato
- **Navigazione via click su riga** nelle tabelle desktop di Consegne e Installazioni
  - Click su qualsiasi punto della riga porta al dettaglio (non più solo "Dettaglio →")
  - Nome cliente evidenziato in blu (`text-blue-700`) per indicare la cliccabilità
  - Hover: sfondo blu tenue (`bg-blue-50/40`) al posto del grigio
  - `cursor-pointer` su tutte le righe cliccabili
- **Consegne** — colonna "Dettaglio →" sostituita con **Orario** (`fasciaDalle – fasciaAlle`)
- **Installazioni** — colonna "Dettaglio →" sostituita con **Docs** (conteggio documenti con icona `FileText`)
- Mobile già ottimizzato: card = `Link` completo, nessuna modifica richiesta

## [0.2.0] — 2026-05-24

### Aggiunto
- **Installazioni — distinzione Lavoro / Assistenza**
  - Nuovo tipo `CategoriaLavoro = 'Lavoro' | 'Assistenza'` nei tipi TypeScript
  - Nuovo tipo `TurnoAssistenza = 'Mattina' | 'Pomeriggio'`
  - Badge visivi distinti: 🏗️ Lavoro (indaco) e 🔧 Assistenza (ambra)
  - Colonna "Data / Orario" nella lista: mostra orario inizio per Lavori, turno (🌅/🌇) per Assistenze
  - Toggle a 3 tab nella pagina Lavori: **Tutti | Lavori | Assistenze** con conteggi
  - Righe Assistenze con sfondo ambra tenue + bordo sinistro colorato (mobile)

- **Regola di capacità squadra con avviso automatico ⚠️**
  - Lavori: max 1 per squadra per giorno (conflitto evidenziato)
  - Assistenze: max 1 per turno (Mattina/Pomeriggio) per squadra per giorno
  - Tooltip esplicativo al passaggio sul triangolo di avviso

- **Nuovo form "Nuova installazione"** (`NuovoLavoro.tsx`)
  - Selezione categoria Lavoro/Assistenza con descrizione regola di capacità
  - Per Assistenze: selettore turno Mattina/Pomeriggio con orari auto-impostati (08–13 / 14–18)
  - Per Lavori: campi orario inizio/fine liberi
  - Pulsante submit dinamico: "Crea lavoro" / "Crea assistenza"

- **Dettaglio installazione** (`LavoroDetail.tsx`)
  - Badge categoria nella testata della pagina
  - Sezione Pianificazione: mostra turno con orari per Assistenze, orario per Lavori

- **Mock data**: aggiunte 4 Assistenze (`ASS-2026-001` → `ASS-2026-004`), di cui 2 in conflitto per testare l'avviso ⚠️

### Modificato
- `LavoroList` (type): aggiunti campi `categoria`, `fasciaDalle`, `fasciaAlle`, `turno`
- `Lavoro` (type): `fasciaDalle` e `fasciaAlle` spostati in `LavoroList` (ereditati)
- Mock handler GET `/api/lavori`: espone i nuovi campi nella lista

---

## [0.1.0] — 2026-05-20

### Aggiunto
- **Auth**: JWT con ruoli `Admin`, `Manager`, `Trasportatore`, `Caposquadra`
- **Impersonazione**: l'Admin può navigare come altro utente senza cambiare token
- **Dashboard**: KPI consegne (Da pianificare, In transito, Consegnate, Oggi)
- **Consegne**
  - Lista con toggle Tutte / Da fare / Completate + conteggi
  - Filtro per stato e ricerca testo
  - Ordinamento per data prevista (3 stati: neutro → asc → desc)
  - Dettaglio con pianificazione, esito, upload/preview documenti
  - Form nuova consegna con validazione Zod
- **Lavori/Installazioni**
  - Lista con filtri stato, squadra, ricerca
  - Ordinamento per data inizio
  - Calendario mensile (FullCalendar)
  - Dettaglio con aggiornamento stato, inserimento esito, upload documenti
  - Form nuovo lavoro
- **Squadre**: lista, dettaglio, creazione con gestione membri
- **Report**: grafico consegne mensili (Recharts), tasso successo
- **Utenti**: lista e creazione (Admin only)
- **Preview documenti**: immagini in `<img>`, PDF in `<iframe>`, pattern bottom-sheet su mobile
- **Responsive**: layout ottimizzato per mobile (bottom-sheet modali, card list, `p-4 sm:p-6`)
- **Mock Service Worker (MSW v2)**: tutti gli endpoint simulati per sviluppo offline

### Architettura
- Backend: .NET 10 Web API + EF Core + SQL Server + JWT
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS 4 + TanStack Query v5

---

[Unreleased]: https://github.com/Cavaras94/ConsegnePoltrone/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/Cavaras94/ConsegnePoltrone/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Cavaras94/ConsegnePoltrone/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Cavaras94/ConsegnePoltrone/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Cavaras94/ConsegnePoltrone/releases/tag/v0.1.0
