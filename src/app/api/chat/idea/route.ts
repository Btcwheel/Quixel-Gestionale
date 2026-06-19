import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText, convertToModelMessages } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, ideaId, accountId, modelOverride } = await req.json();
    const supabase = await createClient();

    const { data: idea } = await supabase
      .from('ideas')
      .select('title, content, category')
      .eq('id', ideaId)
      .single();

    if (!idea) {
      return new Response('Idea non trovata', { status: 404 });
    }

    let aiAccount: { api_key_encrypted: string; model_name: string } | null = null;
    if (accountId) {
      const { data } = await supabase
        .from('ai_accounts')
        .select('api_key_encrypted, model_name')
        .eq('id', accountId)
        .single();
      aiAccount = data;
    } else {
      const { data } = await supabase
        .from('ai_accounts')
        .select('api_key_encrypted, model_name')
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
        'Nessun account AI configurato. Vai in Impostazioni o configura OPENAI_API_KEY/OPENCODE_API_KEY.',
        { status: 400 }
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

    if (modelName === 'orchestrated') {
      const llm = isGoProvider ? openrouter.chat : openrouter;
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

    const ideaLabel = idea.title ? `"${idea.title}"` : 'questa idea';

    let systemPrompt = `Sei un interlocutore intellettuale che aiuta ad esplorare e sviluppare ${ideaLabel}.

## L'idea da esplorare:
${idea.title ? `**${idea.title}**\n` : ''}${idea.content}

Il tuo ruolo è:
- Approfondire l'idea con domande stimolanti e prospettive nuove
- Identificare punti di forza, debolezze, opportunità e rischi
- Collegare l'idea a concetti, mercati, tecnologie o esempi concreti
- Aiutare a strutturare e raffinare il pensiero
- Suggerire direzioni di sviluppo pratico o teorico

Rispondi sempre in italiano. Sii diretto, curioso e stimolante — non limitarti a confermare, metti alla prova l'idea.`;

    if (routingPrefix) {
      systemPrompt += `\n\nIMPORTANTE: Devi iniziare la tua risposta esattamente con questa riga di intestazione (inclusi i caratteri markdown e i due a capo alla fine):
${routingPrefix}`;
    }

    const modelMessages = await convertToModelMessages(messages);

    const streamModel = isGoProvider && modelName.startsWith('opencode-go/') ? modelName.slice('opencode-go/'.length) : modelName;
    const llm = isGoProvider ? openrouter.chat : openrouter;
    console.log('[idea-chat] model:', modelName, '| streamModel:', streamModel);

    const result = streamText({
      model: llm(streamModel),
      system: systemPrompt,
      messages: modelMessages,
      onError: (e) => console.error('[idea-chat] streamText error:', e),
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error('Idea Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(message, { status: 500 });
  }
}
