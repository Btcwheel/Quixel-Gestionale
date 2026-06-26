import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import { generateEmbedding } from '@/lib/embeddings';
import { searchWeb } from '@/lib/web-search';
import { sanitizeSearchResults } from '@/lib/search-agent';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, projectId, accountId, modelOverride } = await req.json();
    const supabase = await createClient();

    const [projectRes, relevantIdeas, relevantCLIs] = await Promise.all([
      projectId
        ? supabase
            .from('projects')
            .select('name, description')
            .eq('id', projectId)
            .single()
        : Promise.resolve({ data: null, error: null }),
      getRelevantIdeas(supabase, messages),
      getRelevantCLIs(supabase, messages),
    ]);

    const project = projectRes.data;

    // Use the selected accountId if provided, otherwise fall back to project primary
    let aiAccount: { api_key_encrypted: string; model_name: string } | null = null;
    if (accountId) {
      const { data } = await supabase
        .from('ai_accounts')
        .select('api_key_encrypted, model_name')
        .eq('id', accountId)
        .single();
      aiAccount = data;
    } else if (projectId) {
      const { data: proj } = await supabase
        .from('projects')
        .select('project_ai_pool_assignments(is_primary, ai_account:ai_accounts(api_key_encrypted, model_name))')
        .eq('id', projectId)
        .single();
      const assignments: Array<{ is_primary: boolean; ai_account: { api_key_encrypted: string; model_name: string } | null }> = (proj as { project_ai_pool_assignments: Array<{ is_primary: boolean; ai_account: { api_key_encrypted: string; model_name: string } | null }> } | null)?.project_ai_pool_assignments ?? [];
      const primary = assignments.find(p => p.is_primary) ?? assignments[0];
      aiAccount = primary?.ai_account ?? null;
    }

    if (!aiAccount) {
      // Fallback: get first AI account
      const { data } = await supabase
        .from('ai_accounts')
        .select('api_key_encrypted, model_name')
        .order('priority', { ascending: false })
        .limit(1)
        .single();
      aiAccount = data;
    }

    let apiKey = '';
    if (aiAccount?.api_key_encrypted) {
      try {
        apiKey = await decrypt(aiAccount.api_key_encrypted);
      } catch (decryptErr) {
        console.error('[chat] decrypt failed (VAULT_SECRET mismatch?):', decryptErr);
        return new Response(
          JSON.stringify({
            error: 'Impossibile decifrare la API key',
            detail: 'La variabile VAULT_SECRET potrebbe essere diversa da quella usata durante la cifratura. Riconfigura la API key nelle Impostazioni.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (process.env.OPENAI_API_KEY) {
      apiKey = process.env.OPENAI_API_KEY;
    } else if (process.env.OPENCODE_API_KEY) {
      apiKey = process.env.OPENCODE_API_KEY;
    } else {
      return new Response(
        JSON.stringify({
          error: 'Nessun account AI selezionato',
          detail: 'Vai in Impostazioni o aggiungi OPENAI_API_KEY in .env',
          accountId,
          projectId,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let modelName = modelOverride ?? aiAccount?.model_name ?? 'anthropic/claude-sonnet-4-6';
    let routingPrefix = '';

    const isGoProvider = apiKey.startsWith('opencode-') || modelName.startsWith('opencode-go/') || (aiAccount?.model_name && aiAccount.model_name.startsWith('opencode-go/'));
    const baseURL = isGoProvider ? 'https://opencode.ai/zen/go/v1' : 'https://openrouter.ai/api/v1';

    const openrouter = createOpenAI({
      apiKey,
      baseURL,
      headers: {
        'HTTP-Referer': 'https://gestionale.quixel.it',
        'X-Title': 'Gestionale Quixel',
      },
    });

    const llm = isGoProvider ? openrouter.chat : openrouter;

    if (modelName === 'orchestrated') {
      try {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        const msg = lastUserMessage as { content?: string; parts?: Array<{ type: string; text?: string; mediaType?: string; url?: string }> } | undefined;
        const userPrompt = msg?.content || (msg?.parts ?? []).filter((p) => p.type === 'text').map((p) => p.text).join('') || '';
        const hasFiles = (msg?.parts ?? []).some((p) => p.type === 'file');
        const fileTypes = (msg?.parts ?? []).filter((p) => p.type === 'file').map((p) => p.mediaType ?? '').filter(Boolean);

        // Configure models based on provider
        const classifierModel = isGoProvider ? 'opencode-go/deepseek-v4-flash' : 'google/gemini-2.5-flash-preview';
        const lowModel = isGoProvider ? 'opencode-go/deepseek-v4-flash' : 'google/gemini-2.5-flash-preview';
        const medModel = isGoProvider ? 'opencode-go/kimi-k2.7-code' : 'anthropic/claude-sonnet-4-6';
        const highModel = isGoProvider ? 'opencode-go/glm-5.1' : 'deepseek/deepseek-r1';

        // Classify using the cheap model
        const multimodalContext = hasFiles
          ? `\n\nL'utente ha anche allegato ${fileTypes.length === 1 ? 'un file' : `${fileTypes.length} file`} (${fileTypes.join(', ') || 'vari formati'}). Preferisci un modello con buona capacità multimodale (GPT-4o, Claude, Gemini) se l'analisi visiva è rilevante.`
          : '';

        const classification = await generateText({
          model: llm(classifierModel),
          system: `Sei l'orchestratore del Gestionale Quixel. Analizza il prompt dell'utente per determinare la complessità e scegliere il modello ottimale.${multimodalContext}
Scegli tra questi 3 modelli:
- "${lowModel}" -> per compiti semplici, domande teoriche, spiegazioni rapide, traduzioni, formattazione o riassunti.
- "${medModel}" -> per programmazione, creazione di componenti React/UI, refactoring di file, logica server o stesura di requisiti tecnici. Se ci sono immagini/PDF da analizzare visivamente, scegli questo o il modello superiore.
- "${highModel}" -> per calcoli matematici, algoritmi complessi, debug approfonditi di errori inspiegabili, architetture complesse di database o ragionamento puro.

Rispondi ESCLUSIVAMENTE in formato JSON valido:
{
  "selectedModel": "id-del-modello-scelto",
  "modelFriendlyName": "Nome del modello scelto (es. Claude 3.5 Sonnet, DeepSeek R1, Kimi K2.7, GLM 5.1 o DeepSeek V4 Flash)",
  "reasoning": "Breve spiegazione del perché hai scelto questo modello (max 15 parole)"
}`,
          prompt: `MESSAGGIO UTENTE: "${userPrompt}"${hasFiles ? '\n\n[L\'utente ha allegato file - considera la multimodalità nella scelta del modello]' : ''}`,
          maxOutputTokens: 150,
        });

        const cleanJson = classification.text.trim().replace(/^```json\s*|```$/g, '');
        const classificationData = JSON.parse(cleanJson);
        modelName = classificationData.selectedModel;
        routingPrefix = `> **🧠 Orchestrator**: Instradato su **${classificationData.modelFriendlyName}** (*${classificationData.reasoning}*)\n\n`;
      } catch (err) {
        console.error('[orchestrator] routing failed:', err);
        modelName = isGoProvider ? 'opencode-go/kimi-k2.7-code' : 'anthropic/claude-sonnet-4-6';
        routingPrefix = `> **🧠 Orchestrator**: Fallback su **${isGoProvider ? 'Kimi K2.7 Code' : 'Claude 3.5 Sonnet'}** (*Errore durante la categorizzazione*)\n\n`;
      }
    }

    const ideasContext = relevantIdeas.length > 0
      ? `\n\n## Idee e insight personali rilevanti:\n${relevantIdeas.map(i =>
          `[${i.category.toUpperCase()}] ${i.title ? i.title + ': ' : ''}${i.content}`
        ).join('\n\n')}`
      : '';

    const cliContext = relevantCLIs.length > 0
      ? `\n\n## CLI già pronti (usa questi prima di costruire da zero):\n${relevantCLIs.map(c =>
          `- pp-${c.name}: ${c.description} → npx -y @mvanhorn/printing-press install ${c.name}`
        ).join('\n')}`
      : '';

    const webSearchNote = `\n\nHai a disposizione lo strumento \`web_search\` per cercare informazioni aggiornate sul web. Usalo quando il prompt richiede dati non presenti nella tua memoria (es. notizie attuali, prezzi, documentazione aggiornata, tendenze di mercato). Non usarlo per domande generiche o concettuali che puoi già rispondere.`;

    let systemPrompt = project
      ? `Sei l'assistente AI personale dedicato al progetto "${project.name}".${project.description ? `\nDescrizione: ${project.description}` : ''}${ideasContext}${cliContext}${webSearchNote}
Rispondi sempre in italiano. Sii diretto, concreto e professionale. Quando usi gli insight dell'archivio personale, integrali naturalmente nel ragionamento senza citarli esplicitamente.`
      : `Sei l'assistente AI personale del gestionale Quixel, dedicato al brainstorming e allo sviluppo di idee.${ideasContext}${cliContext}${webSearchNote}
Rispondi sempre in italiano. Sii diretto, concreto e professionale. Quando usi gli insight dell'archivio personale, integrali naturalmente nel ragionamento senza citarli esplicitamente.`;

    if (routingPrefix) {
      systemPrompt += `\n\nIMPORTANTE: Devi iniziare la tua risposta esattamente con questa riga di intestazione (inclusi i caratteri markdown e i due a capo alla fine):
${routingPrefix}`;
    }

    // Filtra i messaggi assistant vuoti — possono finire nel DB se lo streaming viene interrotto
    const cleanMessages = messages.filter((m: { role: string; parts?: Array<{ type: string; text?: string }>; content?: string }) => {
      if (m.role !== 'assistant') return true
      const text = (m.parts ?? []).filter(p => p.type === 'text').map(p => p.text ?? '').join('') || m.content || ''
      return text.trim().length > 0
    })

    // Converte file part non-immagine in parti di testo (i provider non supportano text/plain come file)
    const sanitizedMessages = cleanMessages.map(sanitizeFileParts);
    const modelMessages = await convertToModelMessages(sanitizedMessages);

    const streamModel = isGoProvider && modelName.startsWith('opencode-go/') ? modelName.slice('opencode-go/'.length) : modelName;
    console.log('[chat] model:', modelName, '| streamModel:', streamModel, '| messages:', modelMessages.length, '| ideasCtx:', relevantIdeas.length, '| cliCtx:', relevantCLIs.length);

    const result = streamText({
      model: llm(streamModel),
      system: systemPrompt,
      messages: modelMessages,
      tools: {
        web_search: tool({
          description: 'Cerca informazioni aggiornate sul web. Usalo per notizie, prezzi, documentazione tecnica, dati di mercato o qualsiasi contenuto online recente. La ricerca viene eseguita in un ambiente sandboxato per sicurezza.',
          inputSchema: z.object({
            query: z.string().describe('La query di ricerca. Sii specifico per ottenere risultati pertinenti.'),
          }),
          execute: async ({ query }) => {
            const response = await searchWeb(query)
            const sanitized = await sanitizeSearchResults(
              query,
              response.results,
              response.answer,
              apiKey,
              isGoProvider,
            )
            return sanitized
          },
        }),
      },
      onError: (e) => console.error('[chat] streamText error:', e),
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(message, { status: 500 });
  }
}

async function getRelevantCLIs(supabase: Awaited<ReturnType<typeof createClient>>, messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }>; content?: string }>): Promise<Array<{ name: string; description: string }>> {
  try {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return [];

    const queryText = (lastUserMessage.parts ?? [])
      .filter((p) => p.type === 'text')
      .map((p) => p.text ?? '')
      .join(' ') || lastUserMessage.content || '';

    if (!queryText.trim()) return [];

    const embedding = await generateEmbedding(queryText);
    if (!embedding) return [];

    const { data } = await supabase.rpc('search_clis', {
      query_embedding: JSON.stringify(embedding),
      match_count: 3,
      match_threshold: 0.5,
    });

    return data ?? [];
  } catch {
    return [];
  }
}

async function getRelevantIdeas(supabase: Awaited<ReturnType<typeof createClient>>, messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }>; content?: string }>): Promise<Array<{ category: string; title: string | null; content: string }>> {
  try {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return [];

    const queryText = (lastUserMessage.parts ?? [])
      .filter((p) => p.type === 'text')
      .map((p) => p.text ?? '')
      .join(' ') || lastUserMessage.content || '';

    if (!queryText.trim()) return [];

    const embedding = await generateEmbedding(queryText);
    if (!embedding) return [];

    const { data } = await supabase.rpc('search_ideas', {
      query_embedding: JSON.stringify(embedding),
      match_count: 4,
      match_threshold: 0.45,
    });

    return data ?? [];
  } catch {
    return [];
  }
}


// Converte file part non-immagine in parti di testo (i provider rifiutano text/plain come file)
function sanitizeFileParts(msg: { role: string; parts?: Array<{ type: string; text?: string; url?: string; mediaType?: string; filename?: string }>; content?: string }) {
  if (!msg.parts) return msg;
  const sanitized = msg.parts.map(p => {
    if (p.type !== 'file' || !p.url) return p;
    if (p.mediaType?.startsWith('image/')) return p;
    try {
      const match = p.url.match(/^data:(text\/\w+);base64,(.+)$/);
      if (match) {
        const decoded = atob(match[2]);
        return { type: 'text' as const, text: '[File: ' + (p.filename ?? 'allegato') + ']\n' + decoded };
      }
    } catch {}
    return { type: 'text' as const, text: '[File: ' + (p.filename ?? 'allegato') + ' (contenuto non decodificabile)]' };
  });
  return { ...msg, parts: sanitized };
}
