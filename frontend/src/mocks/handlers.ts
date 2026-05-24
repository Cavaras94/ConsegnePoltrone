import { http, HttpResponse } from 'msw';
import { users, squadre, consegne, lavori, nextId } from './data';

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getUserFromRequest(request: Request) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  const match = token.match(/^mock_token_(\d+)$/);
  if (!match) return null;
  return users.find(u => u.id === Number(match[1])) ?? null;
}

function paginate<T>(items: T[], page: number, perPage: number) {
  const start = (page - 1) * perPage;
  return { data: items.slice(start, start + perPage), total: items.length };
}

function addDelay() {
  return new Promise(resolve => setTimeout(resolve, 200));
}

/** Returns a previewable mock blob for a document. SVG for images, HTML page for PDFs. */
function mockDocResponse(contentType: string, nome: string) {
  if (contentType.startsWith('image/')) {
    const isPhoto = contentType === 'image/jpeg' || contentType === 'image/png' || contentType === 'image/webp';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dbeafe;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ede9fe;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#bg)" rx="8"/>
  <text x="300" y="170" text-anchor="middle" font-size="64">${isPhoto ? '📷' : '🖼️'}</text>
  <text x="300" y="230" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#1e40af" font-weight="600">${nome}</text>
  <text x="300" y="258" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#6b7280">Immagine mock – ambiente di sviluppo</text>
</svg>`;
    return new HttpResponse(svg, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }

  // PDF and other types → HTML page shown in iframe
  const html = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><style>
  body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh;
         background: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
  .card { background: white; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.1);
          padding: 48px 56px; text-align: center; max-width: 440px; }
  .icon { font-size: 72px; margin-bottom: 16px; }
  h2 { color: #111827; margin: 0 0 8px; font-size: 18px; }
  p  { color: #6b7280; font-size: 14px; margin: 0; }
  .badge { display: inline-block; margin-top: 16px; padding: 4px 12px; background: #f3f4f6;
           border-radius: 999px; font-size: 11px; color: #9ca3af; }
</style></head>
<body>
  <div class="card">
    <div class="icon">📄</div>
    <h2>${nome}</h2>
    <p>Documento PDF mock</p>
    <span class="badge">Ambiente di sviluppo</span>
  </div>
</body></html>`;
  return new HttpResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ─── Auth ───────────────────────────────────────────────────────────────────

const authHandlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await addDelay();
    const body = await request.json() as { email: string; password: string };
    const user = users.find(u => u.email === body.email && u.password === body.password);
    if (!user) {
      return HttpResponse.json({ message: 'Credenziali non valide' }, { status: 401 });
    }
    return HttpResponse.json({
      token: `mock_token_${user.id}`,
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      role: user.role,
      userId: user.id,
      expiresAt: new Date(Date.now() + 8 * 3600_000).toISOString(),
    });
  }),

  http.get(`${BASE}/auth/me`, async ({ request }) => {
    const user = getUserFromRequest(request);
    if (!user) return HttpResponse.json({ message: 'Non autenticato' }, { status: 401 });
    return HttpResponse.json({
      id: user.id, email: user.email, nome: user.nome,
      cognome: user.cognome, role: user.role, telefono: user.telefono,
    });
  }),

  http.get(`${BASE}/auth/utenti`, async ({ request }) => {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return HttpResponse.json([], { status: 403 });
    return HttpResponse.json(users.map(u => ({
      id: u.id, email: u.email, nome: u.nome,
      cognome: u.cognome, role: u.role, telefono: u.telefono,
    })));
  }),

  http.post(`${BASE}/auth/utenti`, async ({ request }) => {
    await addDelay();
    const body = await request.json() as any;
    const newUser = {
      id: nextId.user++,
      email: body.email,
      password: body.password,
      nome: body.nome,
      cognome: body.cognome,
      role: body.role,
      telefono: body.telefono ?? null,
      isActive: true,
      squadraId: null,
    };
    users.push(newUser);
    return HttpResponse.json({
      id: newUser.id, email: newUser.email, nome: newUser.nome,
      cognome: newUser.cognome, role: newUser.role, telefono: newUser.telefono,
    }, { status: 201 });
  }),

  http.get(`${BASE}/auth/trasportatori`, () => {
    return HttpResponse.json(
      users.filter(u => u.role === 'Trasportatore').map(u => ({
        id: u.id, email: u.email, nome: u.nome, cognome: u.cognome, role: u.role,
      }))
    );
  }),
];

// ─── Consegne ────────────────────────────────────────────────────────────────

const consegneHandlers = [
  http.get(`${BASE}/consegne`, async ({ request }) => {
    await addDelay();
    const user = getUserFromRequest(request);
    const url = new URL(request.url);
    const stato = url.searchParams.get('stato') ?? '';
    const cerca = (url.searchParams.get('cerca') ?? '').toLowerCase();
    const page  = parseInt(url.searchParams.get('pagina') ?? '1');
    const size  = parseInt(url.searchParams.get('perPagina') ?? '20');

    let items = [...consegne];
    // Trasportatore vede solo le proprie
    if (user?.role === 'Trasportatore') {
      items = items.filter(c => c.trasportatoreId === user.id);
    }
    if (stato) items = items.filter(c => c.stato === stato);
    if (cerca) {
      items = items.filter(c =>
        c.clienteNome.toLowerCase().includes(cerca) ||
        c.clienteCitta.toLowerCase().includes(cerca) ||
        c.numeroOrdine.toLowerCase().includes(cerca) ||
        (c.articoli ?? []).some((a: any) =>
          a.descrizione.toLowerCase().includes(cerca) ||
          (a.codice ?? '').toLowerCase().includes(cerca)
        )
      );
    }

    const { data, total } = paginate(items, page, size);
    // Return list-shaped objects
    const listItems = data.map(c => {
      const articoli: any[] = c.articoli ?? [];
      const articoliCount = articoli.length;
      const articoliSommario = articoliCount === 0
        ? '—'
        : articoliCount === 1
          ? articoli[0].descrizione
          : `${articoli[0].descrizione} + altri ${articoliCount - 1}`;
      return {
        id: c.id, numeroOrdine: c.numeroOrdine, dataOrdine: c.dataOrdine,
        clienteNome: c.clienteNome, clienteCitta: c.clienteCitta,
        clienteTelefono: c.clienteTelefono ?? null,
        articoliSommario,
        articoliCount,
        articoli,  // inclusi per expand inline
        importoDaPagare: c.importoDaPagare,
        pagamentoRicevuto: c.pagamentoRicevuto,
        modalitaPagamento: c.modalitaPagamento ?? null,
        fasciaDalle: c.fasciaDalle ?? null,
        fasciaAlle: c.fasciaAlle ?? null,
        stato: c.stato,
        dataPrevistaConsegna: c.dataPrevistaConsegna,
        esito: c.esito,
        trasportatoreNome: c.trasportatoreNome, documentiCount: c.documentiCount,
      };
    });

    return HttpResponse.json(listItems, {
      headers: {
        'X-Total-Count': String(total),
        'Access-Control-Expose-Headers': 'X-Total-Count',
      },
    });
  }),

  http.get(`${BASE}/consegne/:id`, async ({ params }) => {
    await addDelay();
    const c = consegne.find(c => c.id === Number(params.id));
    if (!c) return HttpResponse.json({ message: 'Non trovato' }, { status: 404 });
    return HttpResponse.json(c);
  }),

  http.post(`${BASE}/consegne`, async ({ request }) => {
    await addDelay();
    const body = await request.json() as any;
    const trasportatore = body.trasportatoreId
      ? users.find(u => u.id === body.trasportatoreId)
      : null;
    const newC = {
      ...body,
      id: nextId.consegna++,
      numeroOrdine: `ORD-2026-${String(nextId.consegna).padStart(3, '0')}`,
      stato: 'DaPianificare',
      pagamentoRicevuto: false,
      trasportatoreNome: trasportatore ? `${trasportatore.nome} ${trasportatore.cognome}` : null,
      documentiCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      documenti: [],
    };
    consegne.push(newC);
    return HttpResponse.json(newC, { status: 201 });
  }),

  http.patch(`${BASE}/consegne/:id/pianifica`, async ({ params, request }) => {
    await addDelay();
    const body = await request.json() as any;
    const c = consegne.find(c => c.id === Number(params.id));
    if (!c) return HttpResponse.json({ message: 'Non trovato' }, { status: 404 });
    const trasportatore = body.trasportatoreId ? users.find(u => u.id === body.trasportatoreId) : null;
    Object.assign(c, {
      dataPrevistaConsegna: body.dataPrevistaConsegna,
      fasciaDalle: body.fasciaDalle ?? null,
      fasciaAlle: body.fasciaAlle ?? null,
      trasportatoreId: body.trasportatoreId ?? c.trasportatoreId,
      trasportatoreNome: trasportatore ? `${trasportatore.nome} ${trasportatore.cognome}` : c.trasportatoreNome,
      stato: 'Pianificata',
      updatedAt: new Date().toISOString(),
    });
    return HttpResponse.json(c);
  }),

  http.patch(`${BASE}/consegne/:id/esito`, async ({ params, request }) => {
    await addDelay();
    const body = await request.json() as any;
    const c = consegne.find(c => c.id === Number(params.id));
    if (!c) return HttpResponse.json({ message: 'Non trovato' }, { status: 404 });
    Object.assign(c, {
      esito: body.esito,
      dataEffettivaConsegna: body.dataEffettivaConsegna ?? new Date().toISOString().split('T')[0],
      noteConsegna: body.noteConsegna ?? null,
      pagamentoRicevuto: body.pagamentoRicevuto ?? c.pagamentoRicevuto,
      stato: body.esito === 'Consegnata' ? 'Consegnata' : 'NonConsegnata',
      updatedAt: new Date().toISOString(),
    });
    return HttpResponse.json(c);
  }),

  // Upload documento consegna
  http.post(`${BASE}/consegne/:id/documenti`, async ({ params }) => {
    await addDelay();
    const c = consegne.find(c => c.id === Number(params.id));
    if (!c) return HttpResponse.json({ message: 'Non trovato' }, { status: 404 });
    const newDoc = {
      id: nextId.documento++,
      consegnaId: c.id,
      nomeFileOriginale: 'documento_caricato.pdf',
      contentType: 'application/pdf',
      dimensioneBytes: 123456,
      tipo: 'Altro',
      dataUpload: new Date().toISOString(),
      uploadedByNome: 'Utente',
      descrizione: null,
    };
    c.documenti.push(newDoc);
    c.documentiCount = c.documenti.length;
    return HttpResponse.json(newDoc, { status: 201 });
  }),

  http.delete(`${BASE}/documenti/:id`, async ({ params }) => {
    await addDelay();
    for (const c of consegne) {
      const idx = c.documenti.findIndex((d: any) => d.id === Number(params.id));
      if (idx !== -1) {
        c.documenti.splice(idx, 1);
        c.documentiCount = c.documenti.length;
        break;
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/documenti/:id/download`, ({ params }) => {
    const docId = Number(params.id);
    let found: { contentType: string; nomeFileOriginale: string } | undefined;
    for (const c of consegne) {
      found = c.documenti.find((d: any) => d.id === docId);
      if (found) break;
    }
    return mockDocResponse(found?.contentType ?? 'application/pdf', found?.nomeFileOriginale ?? 'documento.pdf');
  }),
];

// ─── Report ──────────────────────────────────────────────────────────────────

const reportHandlers = [
  http.get(`${BASE}/report/statistiche`, async () => {
    await addDelay();
    const totaleImporti = consegne.reduce((s, c) => s + c.importoDaPagare, 0);
    const importiRiscossi = consegne.filter(c => c.pagamentoRicevuto).reduce((s, c) => s + c.importoDaPagare, 0);
    return HttpResponse.json({
      totaleConsegne: consegne.length,
      daPianificare: consegne.filter(c => c.stato === 'DaPianificare').length,
      pianificate:   consegne.filter(c => c.stato === 'Pianificata').length,
      inTransito:    consegne.filter(c => c.stato === 'InTransito').length,
      consegnate:    consegne.filter(c => c.stato === 'Consegnata').length,
      nonConsegnate: consegne.filter(c => c.stato === 'NonConsegnata').length,
      annullate:     consegne.filter(c => c.stato === 'Annullata').length,
      totaleImporti,
      importiRiscossi,
      importiDaRiscuotere: totaleImporti - importiRiscossi,
      consegneMese: 3,
      consegneOggi: 0,
    });
  }),

  http.get(`${BASE}/report/mensile`, async () => {
    await addDelay();
    return HttpResponse.json([
      { anno: 2025, mese: 11, nomeMese: 'Novembre', totale: 18, consegnate: 15, nonConsegnate: 3 },
      { anno: 2025, mese: 12, nomeMese: 'Dicembre', totale: 22, consegnate: 19, nonConsegnate: 3 },
      { anno: 2026, mese: 1,  nomeMese: 'Gennaio',  totale: 14, consegnate: 12, nonConsegnate: 2 },
      { anno: 2026, mese: 2,  nomeMese: 'Febbraio', totale: 16, consegnate: 13, nonConsegnate: 3 },
      { anno: 2026, mese: 3,  nomeMese: 'Marzo',    totale: 20, consegnate: 17, nonConsegnate: 3 },
      { anno: 2026, mese: 4,  nomeMese: 'Aprile',   totale: 19, consegnate: 15, nonConsegnate: 4 },
      { anno: 2026, mese: 5,  nomeMese: 'Maggio',   totale:  7, consegnate:  1, nonConsegnate: 1 },
    ]);
  }),

  http.get(`${BASE}/report/trasportatori`, async () => {
    await addDelay();
    return HttpResponse.json([
      { trasportatoreId: 3, nome: 'Luca Bianchi',       totale: 48, consegnate: 42, nonConsegnate: 6,  percentualeSuccesso: 87.5 },
      { trasportatoreId: 4, nome: 'Alessandro Conti',   totale: 35, consegnate: 29, nonConsegnate: 6,  percentualeSuccesso: 82.9 },
    ]);
  }),
];

// ─── Squadre ─────────────────────────────────────────────────────────────────

const squadreHandlers = [
  // IMPORTANT: utenti-disponibili must come before /:id
  http.get(`${BASE}/squadre/utenti-disponibili`, async () => {
    await addDelay();
    const disponibili = users.filter(u =>
      u.squadraId === null &&
      (u.role === 'Trasportatore' || u.role === 'Caposquadra')
    );
    return HttpResponse.json(disponibili.map(u => ({
      id: u.id, nome: u.nome, cognome: u.cognome,
      email: u.email, role: u.role,
    })));
  }),

  http.get(`${BASE}/squadre`, async ({ request }) => {
    await addDelay();
    const url = new URL(request.url);
    const soloAttive = url.searchParams.get('soloAttive') === 'true';
    let items = soloAttive ? squadre.filter(s => s.isActive) : [...squadre];
    return HttpResponse.json(items.map(s => ({
      id: s.id, nome: s.nome, colore: s.colore,
      specializzazioni: s.specializzazioni, isActive: s.isActive,
      caposquadraNome: s.caposquadraNome, numMembri: s.numMembri,
      lavoriAttivi: s.lavoriAttivi,
    })));
  }),

  http.get(`${BASE}/squadre/:id`, async ({ params }) => {
    await addDelay();
    const s = squadre.find(s => s.id === Number(params.id));
    if (!s) return HttpResponse.json({ message: 'Non trovata' }, { status: 404 });
    return HttpResponse.json(s);
  }),

  http.post(`${BASE}/squadre`, async ({ request }) => {
    await addDelay();
    const body = await request.json() as any;
    const capo = body.caposquadraId ? users.find(u => u.id === body.caposquadraId) : null;
    const nuovaSquadra = {
      id: nextId.squadra++,
      nome: body.nome,
      descrizione: body.descrizione ?? null,
      colore: body.colore ?? '#3b82f6',
      specializzazioni: body.specializzazioni ?? null,
      isActive: true,
      caposquadraId: body.caposquadraId ?? null,
      caposquadraNome: capo ? `${capo.nome} ${capo.cognome}` : null,
      numMembri: body.membroIds?.length ?? 0,
      lavoriAttivi: 0,
      membri: (body.membroIds ?? []).map((id: number) => {
        const u = users.find(x => x.id === id);
        return u ? { id: u.id, nome: u.nome, cognome: u.cognome, email: u.email, isCaposquadra: u.id === body.caposquadraId } : null;
      }).filter(Boolean),
    };
    squadre.push(nuovaSquadra);
    // Aggiorna squadraId degli utenti
    for (const id of (body.membroIds ?? [])) {
      const u = users.find(x => x.id === id);
      if (u) u.squadraId = nuovaSquadra.id;
    }
    return HttpResponse.json(nuovaSquadra, { status: 201 });
  }),

  http.put(`${BASE}/squadre/:id`, async ({ params, request }) => {
    await addDelay();
    const body = await request.json() as any;
    const s = squadre.find(s => s.id === Number(params.id));
    if (!s) return HttpResponse.json({ message: 'Non trovata' }, { status: 404 });
    const capo = body.caposquadraId ? users.find(u => u.id === body.caposquadraId) : null;
    Object.assign(s, {
      nome: body.nome ?? s.nome,
      descrizione: body.descrizione ?? s.descrizione,
      colore: body.colore ?? s.colore,
      specializzazioni: body.specializzazioni ?? s.specializzazioni,
      caposquadraId: body.caposquadraId ?? s.caposquadraId,
      caposquadraNome: capo ? `${capo.nome} ${capo.cognome}` : s.caposquadraNome,
    });
    return HttpResponse.json(s);
  }),
];

// ─── Lavori ──────────────────────────────────────────────────────────────────

function statoColor(stato: string, squadraColore?: string): string {
  switch (stato) {
    case 'Completato':  return '#22c55e';
    case 'Annullato':   return '#9ca3af';
    case 'Sospeso':     return '#f59e0b';
    case 'InCorso':     return '#3b82f6';
    default: return squadraColore ?? '#6b7280';
  }
}

const lavoriHandlers = [
  // IMPORTANT: /calendario must come before /:id
  http.get(`${BASE}/lavori/calendario`, async ({ request }) => {
    await addDelay();
    const url = new URL(request.url);
    const squadraId = url.searchParams.get('squadraId');
    let items = lavori.filter(l => l.dataInizio);
    if (squadraId) items = items.filter(l => l.squadraId === Number(squadraId));

    const events = items.map(l => {
      const end = l.dataFine
        ? new Date(new Date(l.dataFine).getTime() + 86_400_000).toISOString().split('T')[0]
        : new Date(new Date(l.dataInizio).getTime() + 86_400_000).toISOString().split('T')[0];
      return {
        id: String(l.id),
        title: `${l.clienteNome} – ${l.descrizione.substring(0, 40)}${l.descrizione.length > 40 ? '…' : ''}`,
        start: l.dataInizio,
        end,
        color: statoColor(l.stato, l.squadraColore),
        textColor: '#ffffff',
        extendedProps: {
          tipo: l.tipo,
          stato: l.stato,
          priorita: l.priorita,
          clienteNome: l.clienteNome,
          clienteCitta: l.clienteCitta,
          squadraNome: l.squadraNome,
        },
      };
    });
    return HttpResponse.json(events);
  }),

  http.get(`${BASE}/lavori`, async ({ request }) => {
    await addDelay();
    const current = getUserFromRequest(request);
    const url = new URL(request.url);
    const stato     = url.searchParams.get('stato') ?? '';
    const tipo      = url.searchParams.get('tipo') ?? '';
    const cerca     = (url.searchParams.get('cerca') ?? '').toLowerCase();
    const squadraId = url.searchParams.get('squadraId');
    const page      = parseInt(url.searchParams.get('pagina') ?? '1');
    const size      = parseInt(url.searchParams.get('perPagina') ?? '20');

    let items = [...lavori];
    // Caposquadra vede solo la propria squadra
    if (current?.role === 'Caposquadra') {
      items = items.filter(l => l.squadraId === current.squadraId);
    }
    if (stato) items = items.filter(l => l.stato === stato);
    if (tipo)  items = items.filter(l => l.tipo === tipo);
    if (squadraId) items = items.filter(l => l.squadraId === Number(squadraId));
    if (cerca) {
      items = items.filter(l =>
        l.clienteNome.toLowerCase().includes(cerca) ||
        l.descrizione.toLowerCase().includes(cerca) ||
        l.clienteCitta.toLowerCase().includes(cerca) ||
        l.numeroLavoro.toLowerCase().includes(cerca)
      );
    }

    const { data, total } = paginate(items, page, size);
    const listItems = data.map(l => ({
      id: l.id, numeroLavoro: l.numeroLavoro, tipo: l.tipo,
      descrizione: l.descrizione, priorita: l.priorita,
      categoria: l.categoria ?? 'Lavoro',
      clienteNome: l.clienteNome, clienteCitta: l.clienteCitta,
      dataInizio: l.dataInizio, dataFine: l.dataFine,
      fasciaDalle: l.fasciaDalle ?? null,
      fasciaAlle: l.fasciaAlle ?? null,
      turno: l.turno ?? null,
      stato: l.stato, esito: l.esito,
      squadraId: l.squadraId, squadraNome: l.squadraNome, squadraColore: l.squadraColore,
      documentiCount: l.documentiCount,
    }));

    return HttpResponse.json(listItems, {
      headers: {
        'X-Total-Count': String(total),
        'Access-Control-Expose-Headers': 'X-Total-Count',
      },
    });
  }),

  http.get(`${BASE}/lavori/:id`, async ({ params }) => {
    await addDelay();
    const l = lavori.find(l => l.id === Number(params.id));
    if (!l) return HttpResponse.json({ message: 'Non trovato' }, { status: 404 });
    return HttpResponse.json(l);
  }),

  http.post(`${BASE}/lavori`, async ({ request }) => {
    await addDelay();
    const body = await request.json() as any;
    const squadra = body.squadraId ? squadre.find(s => s.id === body.squadraId) : null;
    const newL = {
      ...body,
      id: nextId.lavoro++,
      numeroLavoro: `LAV-2026-${String(nextId.lavoro).padStart(3, '0')}`,
      stato: 'DaPianificare',
      esito: null,
      dataCompletamento: null,
      noteEsito: null,
      squadraNome: squadra?.nome ?? null,
      squadraColore: squadra?.colore ?? null,
      documentiCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      documenti: [],
    };
    lavori.push(newL);
    return HttpResponse.json(newL, { status: 201 });
  }),

  http.put(`${BASE}/lavori/:id`, async ({ params, request }) => {
    await addDelay();
    const body = await request.json() as any;
    const l = lavori.find(l => l.id === Number(params.id));
    if (!l) return HttpResponse.json({ message: 'Non trovato' }, { status: 404 });
    const squadra = body.squadraId ? squadre.find(s => s.id === body.squadraId) : null;
    Object.assign(l, body, {
      squadraNome:  squadra?.nome  ?? l.squadraNome,
      squadraColore: squadra?.colore ?? l.squadraColore,
      updatedAt: new Date().toISOString(),
    });
    return HttpResponse.json(l);
  }),

  http.patch(`${BASE}/lavori/:id/stato`, async ({ params, request }) => {
    await addDelay();
    const body = await request.json() as any;
    const l = lavori.find(l => l.id === Number(params.id));
    if (!l) return HttpResponse.json({ message: 'Non trovato' }, { status: 404 });
    Object.assign(l, {
      stato: body.stato,
      notePerSquadra: body.notePerSquadra ?? l.notePerSquadra,
      updatedAt: new Date().toISOString(),
    });
    return HttpResponse.json(l);
  }),

  http.patch(`${BASE}/lavori/:id/esito`, async ({ params, request }) => {
    await addDelay();
    const body = await request.json() as any;
    const l = lavori.find(l => l.id === Number(params.id));
    if (!l) return HttpResponse.json({ message: 'Non trovato' }, { status: 404 });
    Object.assign(l, {
      esito: body.esito,
      noteEsito: body.noteEsito ?? null,
      dataCompletamento: body.dataCompletamento ?? new Date().toISOString().split('T')[0],
      stato: 'Completato',
      updatedAt: new Date().toISOString(),
    });
    return HttpResponse.json(l);
  }),

  // Upload documento lavoro
  http.post(`${BASE}/lavori/:id/documenti`, async ({ params, request }) => {
    await addDelay();
    const l = lavori.find(l => l.id === Number(params.id));
    if (!l) return HttpResponse.json({ message: 'Non trovato' }, { status: 404 });
    // Try to read tipo from FormData
    let tipo = 'Altro';
    try {
      const fd = await request.formData();
      tipo = (fd.get('tipo') as string) ?? 'Altro';
    } catch { /* ignore */ }
    const newDoc = {
      id: nextId.documento++,
      lavoroId: l.id,
      nomeFileOriginale: 'documento_caricato.pdf',
      contentType: 'application/pdf',
      dimensioneBytes: 234567,
      tipo,
      dataUpload: new Date().toISOString(),
      uploadedByNome: 'Utente',
      descrizione: null,
    };
    l.documenti.push(newDoc);
    l.documentiCount = l.documenti.length;
    return HttpResponse.json(newDoc, { status: 201 });
  }),

  http.delete(`${BASE}/lavori/:id/documenti/:docId`, async ({ params }) => {
    await addDelay();
    const l = lavori.find(l => l.id === Number(params.id));
    if (l) {
      const idx = l.documenti.findIndex((d: any) => d.id === Number(params.docId));
      if (idx !== -1) {
        l.documenti.splice(idx, 1);
        l.documentiCount = l.documenti.length;
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/lavori/:id/documenti/:docId/download`, ({ params }) => {
    const lId = Number(params.id);
    const dId = Number(params.docId);
    const l = lavori.find(x => x.id === lId);
    const doc = l?.documenti.find((d: any) => d.id === dId);
    return mockDocResponse(doc?.contentType ?? 'application/pdf', doc?.nomeFileOriginale ?? 'documento.pdf');
  }),

  http.delete(`${BASE}/lavori/:id`, async ({ params }) => {
    await addDelay();
    const idx = lavori.findIndex(l => l.id === Number(params.id));
    if (idx !== -1) lavori.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

// ─── Export all handlers ─────────────────────────────────────────────────────

export const handlers = [
  ...authHandlers,
  ...consegneHandlers,
  ...reportHandlers,
  ...squadreHandlers,
  ...lavoriHandlers,
];
