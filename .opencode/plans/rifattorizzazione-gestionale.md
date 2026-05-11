# Piano Rifattorizzazione — Gestionale Quixel

## Obiettivo
Sostituire l'attuale "AI & SaaS Project Tracker" generico con un **cassaforte centralizzato** per la gestione di progetti, account esterni e credenziali, con AI pool multiprovider per audit incrociati e memoria persistente su Obsidian.

## Workflow reale
Cliente → Progetto → Account esterni (GitHub/Supabase/Vercel/...) + AI accounts (multiprovider) + Piano lavoro aggregato dalle chat + Memoria su Obsidian

---

## Fase 1 — Modelli Dati

### 1a — enums.py: aggiungere
- `ExternalAccountProvider` (github, supabase, vercel, docker_hub, cloudflare, aws, custom)
- `TOTPStatus` (disabled, pending_verification, active)
- `PlanStatus` (draft, generated, approved, archived)
- `DiscussionCategory` (insight, decision, action_item, question, code, architecture)

### 1b — models.py: modificare/aggiungere

**Rinominare `ExternalResource` → `ExternalAccount`**
  - Rimuovere: `last_sync_status`, `last_sync_at`, `sync_logs` relationship
  - Aggiungere: `username` (Optional[str]), `notes` (Optional[str])
  - Mantenere: project_id, resource_type → provider, external_id, name, url, owner, branch, is_active, provider-specific fields
  - `__tablename__` da `external_resources` a `external_accounts`

**Nuovo modello `CredentialVault`** (`credential_vault`)
  - `project_id` FK → projects.id
  - `provider` (ExternalAccountProvider)
  - `account_name` (str)
  - `encrypted_credentials` (Text) — JSON crittografato con Fernet
  - `credential_type` (str) — "oauth_token", "api_key", "password", "service_role_key"
  - `expires_at` (Optional[datetime])
  - `last_accessed_at` (Optional[datetime])
  - `access_count` (int, default=0)
  - `notes` (Optional[str])

**Nuovo modello `TOTPSecret`** (`totp_secrets`)
  - `admin_user_id` FK → admin_users.id (one-to-one)
  - `secret` (str) — encrypted TOTP secret
  - `status` (TOTPStatus, default=DISABLED)
  - `verified_at` (Optional[datetime])
  - `backup_codes` (JSON) — lista codici di recupero

**Nuovo modello `ProjectPlan`** (`project_plans`)
  - `project_id` FK → projects.id
  - `version` (str, default="1.0.0")
  - `status` (PlanStatus, default=DRAFT)
  - `title` (str)
  - `content` (Text) — piano aggregato markdown
  - `source_discussion_ids` (JSON) — lista ID discussioni usate
  - `source_chat_ids` (JSON) — lista ID chat usate
  - `generated_by` (Optional[str]) — "system" o "manual"
  - `approved_at` (Optional[datetime])

**Modificare `ChatLog`**
  - `project_id`: da Optional[str] a required (nullable=False)
  - Aggiungere: `conversation_title` (Optional[str], max_length=255)

**Modificare `ProjectDiscussion`**
  - Aggiungere: `category` (Optional[DiscussionCategory])
  - Aggiungere: `applied_to_plan` (bool, default=False)
  - Aggiungere: `priority` (int, default=0)

### 1c — schemas.py: aggiungere

**CredentialVault schemas**
  - `CredentialVaultCreate`: project_id, provider, account_name, credential_type, credentials (dict — in chiaro, verrà criptato), expires_at, notes
  - `CredentialVaultUpdate`: account_name, credentials, expires_at, notes
  - `CredentialVaultResponse`: id, project_id, provider, account_name, credential_type, expires_at, last_accessed_at, access_count, notes, created_at (NO credentials in chiaro)
  - `CredentialVaultUnlockResponse`: credentials (dict — solo dopo 2FA)

**TOTP schemas**
  - `TOTPSetupResponse`: secret (plain text per QR code), qr_uri
  - `TOTPVerifyRequest`: code (str, 6 caratteri)
  - `TOTPChallengeRequest`: code (str)
  - `TOTPChallengeResponse`: challenge_token (str, valido 5 min)

**ProjectPlan schemas**
  - `ProjectPlanGenerateRequest`: discussion_ids (Optional[List[str]]), chat_ids (Optional[List[str]])
  - `ProjectPlanUpdateRequest`: title, content, status
  - `ProjectPlanResponse`: id, project_id, version, status, title, content, source_discussion_ids, source_chat_ids, generated_by, created_at, updated_at, approved_at

**Aggiornare `ProjectDiscussionResponse`**
  - Aggiungere: category, applied_to_plan, priority

---

## Fase 2 — API Endpoints

### 2a — Autenticazione + 2FA
- `POST /api/v1/auth/2fa/setup` → genera secret TOTP, ritorna URI per QR
- `POST /api/v1/auth/2fa/verify` → verifica primo codice, attiva 2FA
- `POST /api/v1/auth/2fa/disable` → disabilita 2FA (richiede password)
- `POST /api/v1/auth/2fa/challenge` → verifica codice e rilascia challenge_token

### 2b — External Accounts CRUD
- `GET /api/v1/projects/{project_id}/accounts` → lista account
- `POST /api/v1/projects/{project_id}/accounts` → crea account
- `GET /api/v1/projects/{project_id}/accounts/{id}` → dettaglio (senza credenziali)
- `PUT /api/v1/projects/{project_id}/accounts/{id}` → modifica
- `DELETE /api/v1/projects/{project_id}/accounts/{id}` → elimina

### 2c — Credential Vault
- `POST /api/v1/projects/{project_id}/vault` → crea credenziale (criptata)
- `POST /api/v1/projects/{project_id}/vault/{id}/unlock` → sblocca con challenge_token 2FA
- `GET /api/v1/projects/{project_id}/vault/{id}` → mostra credenziale decriptata (solo se sbloccata)
- `GET /api/v1/projects/{project_id}/vault` → lista credenziali (solo metadati, no valori)

### 2d — Project Planning
- `POST /api/v1/projects/{project_id}/plan/generate` → genera piano aggregato dalle discussioni/chat
- `GET /api/v1/projects/{project_id}/plan` → lista versioni piano
- `GET /api/v1/projects/{project_id}/plan/{id}` → dettaglio piano
- `PUT /api/v1/projects/{project_id}/plan/{id}` → modifica/approva piano
- `POST /api/v1/projects/{project_id}/plan/{id}/archive` → archivia piano

### 2e — Discussions potenziate
- `GET /api/v1/projects/{project_id}/discussions?category=insight` → filtra per categoria
- `PUT /api/v1/projects/{project_id}/discussions/{id}` → aggiorna categoria, applied_to_plan, priority

### 2f — Context Recovery
- `GET /api/v1/projects/{project_id}/context` → recupera contesto completo (ultimo piano, discussioni recenti, note chiave, ultima chat)

### 2g — Obsidian Sync
- `POST /api/v1/projects/{project_id}/obsidian/sync` → sync bidirezionale
- `GET /api/v1/projects/{project_id}/obsidian/notes` → elenco note Obsidian per il progetto

---

## Fase 3 — Servizi di Business

### 3a — Vault Service (nuovo)
- `encrypt_credentials(data: dict) → str`
- `decrypt_credentials(encrypted: str) → dict`
- `create_vault_entry(...) → CredentialVault`
- `unlock_vault(vault_id, challenge_token) → dict`
- `log_access(vault_id) → None`
- `check_2fa_challenge(challenge_token) → bool`

### 3b — Plan Aggregator (nuovo)
- `aggregate_discussions(project_id, discussion_ids) → str` — prende discussioni, estrae insight, genera piano markdown
- `aggregate_chats(project_id, chat_ids) → str` — prende chat log, estrae contenuti utili
- `generate_plan(project_id, source_ids) → ProjectPlan`
- Categorizzazione automatica degli insight per sezioni del piano

### 3c — Context Service (nuovo)
- `get_project_context(project_id) → dict` — recupera piano corrente, ultime N discussioni, ultime N chat, decisioni chiave
- `format_context_for_llm(project_id) → str` — formatta contesto per prompt LLM (per non ricominciare da zero)

### 3d — Obsidian Sync Service (nuovo)
- `sync_to_obsidian(project_id) → None` — esporta piano + discussioni nel vault Obsidian
- `sync_from_obsidian(project_id) → dict` — importa note Obsidian come discussioni
- `get_obsidian_notes(project_id) → list` — elenca note

### 3e — Discussion Extractor (migliorato)
- Aggiungere categorizzazione automatica (insight/decision/action_item/question/code/architecture)
- Aggiungere priority scoring basato su keywords

---

## Fase 4 — Frontend Pages

### 4a — Login potenziato
- `frontend/app/login/page.tsx` — dopo login, se 2FA attivo, mostra form challenge TOTP

### 4b — Settings 2FA
- `frontend/app/settings/page.tsx` — setup 2FA con QR code, input verifica

### 4c — Hub Progetto (ridisegnato)
- `frontend/app/projects/[id]/page.tsx` — hub con tabs:
  - **Overview**: info progetto, stato piano
  - **Account**: lista account esterni con pulsante "Sblocca Vault"
  - **AI Chat**: cronologia chat con filtri
  - **Piano**: piano aggregato, genera/modifica/approva
  - **Memoria**: contesto recuperato, note Obsidian, decisioni
  - **Discussioni**: insight categorizzati

### 4d — Vault View
- `frontend/app/projects/[id]/vault/page.tsx` — griglia account con credenziali offuscate, pulsante sblocco 2FA, copia one-click

### 4e — Plan View
- `frontend/app/projects/[id]/plan/page.tsx` — editor piano markdown, pulsanti genera/approva/archivia, storico versioni

### 4f — Context View
- `frontend/app/projects/[id]/context/page.tsx` — riepilogo contesto, copia per prompt, pulsante sync Obsidian

---

## Fase 5 — CLI

### `cli/main.py` — nuovi comandi
- `vault list` — elenco progetti con credenziali
- `vault show <project_id>` (chiede 2FA, mostra key)
- `plan generate <project_id>` — genera piano
- `plan show <project_id>` — mostra piano corrente
- `obsidian sync <project_id>` — sync bidirezionale
- `context <project_id>` — recupera e stampa contesto

---

## Fase 6 — Integrazione Obsidian (MCP)

Il vault Obsidian è già accessibile via `mcp-obsidian` in `C:\Users\Quixel\Documents\ObsidianVault`.

### Formato note Obsidian
```
ObsidianVault/
  Projects/
    {project-name}/
      README.md          → overview progetto
      piano-{versione}.md → piano aggregato
      discussioni/
        {data}-{titolo}.md → discussione categorizzata
      decisioni.md        → registro decisioni
      contesto.md         → contesto per LLM (aggiornato automaticamente)
```

---

## Tempistiche

| Fase | Stima |
|------|-------|
| Fase 1 (Modelli) | ~1h |
| Fase 2 (API) | ~3h |
| Fase 3 (Servizi) | ~3h |
| Fase 4 (Frontend) | ~4h |
| Fase 5 (CLI) | ~1h |
| Fase 6 (Obsidian) | ~2h |
| **Totale** | **~14h** |
