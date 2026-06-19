import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText, convertToModelMessages } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import { generateEmbedding } from '@/lib/embeddings';

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
      apiKey = await decrypt(aiAccount.api_key_encrypted);
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
        const userPrompt = lastUserMessage?.content || (lastUserMessage?.parts as Array<{ type: string; text?: string }> | undefined)?.filter((p) => p.type === 'text').map((p) => p.text).join('') || '';

        // Configure models based on provider
        const classifierModel = isGoProvider ? 'opencode-go/deepseek-v4-flash' : 'google/gemini-2.5-flash-preview';
        const lowModel = isGoProvider ? 'opencode-go/deepseek-v4-flash' : 'google/gemini-2.5-flash-preview';
        const medModel = isGoProvider ? 'opencode-go/kimi-k2.7-code' : 'anthropic/claude-sonnet-4-6';
        const highModel = isGoProvider ? 'opencode-go/glm-5.1' : 'deepseek/deepseek-r1';

        // Classify using the cheap model
        const classification = await generateText({
          model: llm(classifierModel),
          system: `Sei l'orchestratore del Gestionale Quixel. Analizza il prompt dell'utente per determinare la complessità e scegliere il modello ottimale.
Scegli tra questi 3 modelli:
- "${lowModel}" -> per compiti semplici, domande teoriche, spiegazioni rapide, traduzioni, formattazione o riassunti.
- "${medModel}" -> per programmazione, creazione di componenti React/UI, refactoring di file, logica server o stesura di requisiti tecnici.
- "${highModel}" -> per calcoli matematici, algoritmi complessi, debug approfonditi di errori inspiegabili, architetture complesse di database o ragionamento puro.

Rispondi ESCLUSIVAMENTE in formato JSON valido:
{
  "selectedModel": "id-del-modello-scelto",
  "modelFriendlyName": "Nome del modello scelto (es. Claude 3.5 Sonnet, DeepSeek R1, Kimi K2.7, GLM 5.1 o DeepSeek V4 Flash)",
  "reasoning": "Breve spiegazione del perché hai scelto questo modello (max 15 parole)"
}`,
          prompt: `MESSAGGIO UTENTE: "${userPrompt}"`,
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

    let systemPrompt = project
      ? `Sei l'assistente AI personale dedicato al progetto "${project.name}".${project.description ? `\nDescrizione: ${project.description}` : ''}${ideasContext}${cliContext}
Rispondi sempre in italiano. Sii diretto, concreto e professionale. Quando usi gli insight dell'archivio personale, integrali naturalmente nel ragionamento senza citarli esplicitamente.`
      : `Sei l'assistente AI personale del gestionale Quixel, dedicato al brainstorming e allo sviluppo di idee.${ideasContext}${cliContext}
Rispondi sempre in italiano. Sii diretto, concreto e professionale. Quando usi gli insight dell'archivio personale, integrali naturalmente nel ragionamento senza citarli esplicitamente.`;

    if (routingPrefix) {
      systemPrompt += `\n\nIMPORTANTE: Devi iniziare la tua risposta esattamente con questa riga di intestazione (inclusi i caratteri markdown e i due a capo alla fine):
${routingPrefix}`;
    }

    const modelMessages = await convertToModelMessages(messages);

    const streamModel = isGoProvider && modelName.startsWith('opencode-go/') ? modelName.slice('opencode-go/'.length) : modelName;
    console.log('[chat] model:', modelName, '| streamModel:', streamModel, '| messages:', modelMessages.length, '| ideasCtx:', relevantIdeas.length, '| cliCtx:', relevantCLIs.length);

    const result = streamText({
      model: llm(streamModel),
      system: systemPrompt,
      messages: modelMessages,
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
