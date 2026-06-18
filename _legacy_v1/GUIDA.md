# Guida al Gestionale Quixel

## Come Accedere

1. Apri il browser e vai su `http://localhost:3000`
2. Login: utente `admin`, password `admin123`

---

## Dashboard

La dashboard ti mostra una panoramica:
- **Statistiche**: clienti, progetti attivi, account AI
- **Grafico attività**: chat recenti e deployment
- **Alert**: notifiche da risolvere
- **Feed attività**: azioni recenti nel sistema

---

## Clienti

Per aggiungere un cliente:
1. Clicca **Clients** nel menu
2. Clicca **New Client**
3. Inserisci nome e descrizione
4. Clicca **Save**

---

## Progetti

Per creare un progetto:
1. Clicca **Projects** nel menu
2. Clicca **New Project**
3. Collegalo a un cliente esistente
4. Aggiungi stato (planning → active → completed → archived)
5. Aggiungi tag se necessario

---

## Account AI

Il sistema gestisce account da più provider:
- OpenAI, Anthropic, Google Gemini, Mistral, Cohere, Groq, Together AI

Per aggiungere un account:
1. Clicca **AI Pool** nel menu
2. Clicca **New Account**
3. Scegli il provider
4. Inserisci la API key (viene criptata automaticamente)
5. Imposta i crediti disponibili

### Smart Routing
Il sistema sceglie automaticamente l'account migliore basandosi su:
- Priorità impostata
- Crediti disponibili
- Rate limit
- Bilanciamento carico

### Valutazione Chat
Dopo ogni conversazione puoi dare un voto da 1 a 5 stelle ⭐ — utile per tracciare la qualità delle risposte.

---

## Integrazioni Esterne

### GitHub
1. **Settings** → **Developer settings** → **Personal access tokens**
2. Crea token con repo access
3. Integra: **Resources** → **New Resource** → **GitHub**
4. Incolla token e indica il repository

Ricevi automaticamente:
- Commit tracking
- PR monitoring
- Statistiche contributor

### Supabase
1. Vai su **Account Settings** → **API**
2. Crea access token
3. Integra: **Resources** → **New Resource** → **Supabase**
4. Incolla token e indica il project ref

### Vercel
1. **Settings** → **Tokens** → **Create Token**
2. Integra: **Resources** → **New Resource** → **Vercel**
3. Incolla token e indica il deployment

---

## Webhook

Il sistema riceve webhook da:
- `POST /webhooks/github` — push, PR
- `POST /webhooks/supabase` — backup, health
- `POST /webhooks/vercel` — deployment status

Configurali nei rispettivi servizi:
```
Payload URL: https://tuodominio.com/webhooks/[provider]
Secret: vedi .env (WEBHOOK_SECRET)
```

---

## Alert

Gli alert vengono generati automaticamente per:
- Crediti AI bassi (<20% warning, <10% critical)
- Fallimento sync
- Errori webhook
- Health check falliti

Per visualizzarli:
1. Clicca **Alerts** nel menu
2. Visualizza per severità
3. Clicca **Resolve** per chiuderli

---

## CLI

Se preferisci la riga di comando:

```bash
cd cli
pip install -r requirements.txt

# Login
python main.py login -u admin -p admin123

# Statistiche
python main.py stats -t TOKEN

# Sync risorse
python main.py sync --type all -t TOKEN

# Lista alert
python main.py alerts -t TOKEN
```

---

## Sicurezza

- **Password**: cambia subito quella di default (`admin123`)
- **API Key**: sono criptate con Fernet
- **Webhook**: verificati con HMAC signature
- **Sessione**: token JWT con scadenza configurabile

---

## Problemi Comuni

| Problema | Soluzione |
|---------|-----------|
| Login non funziona | Verifica credenziali o resetta password |
| Backend non risponde | Check `docker-compose ps` o riavvia |
| Sync fallito | Verifica token API e permessi |
| Crediti non aggiornati | Check webhooks o trigger sync manuale |

---

## Supporto

- Documentazione API: `http://localhost:8000/api/docs`
- Log: `docker-compose logs -f backend`
- Contatta l'amministratore per problemi persistenti