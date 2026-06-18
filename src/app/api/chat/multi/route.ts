import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';

export const maxDuration = 120;

const FREE_MODELS = [
  { label: 'Llama 4 Scout', value: 'meta-llama/llama-4-scout:free' },
  { label: 'Gemini 2.0 Flash', value: 'google/gemini-2.0-flash-exp:free' },
  { label: 'DeepSeek R1', value: 'deepseek/deepseek-r1:free' },
  { label: 'Qwen3 30B', value: 'qwen/qwen3-30b-a3b:free' },
];

const VERIFIER_MODEL = 'anthropic/claude-opus-4-7';

const COMPARISON_SYSTEM =
  'Rispondi SOLO alla domanda specifica che ti viene posta. Sii conciso, preciso e diretto. Non fare introduzioni, non ripetere la domanda, non aggiungere riepiloghi. Rispondi in italiano.';

export async function POST(req: Request) {
  try {
    const { question, accountId, models } = await req.json();

    if (!question?.trim()) {
      return Response.json({ error: 'Domanda mancante' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: aiAccount } = await supabase
      .from('ai_accounts')
      .select('api_key_encrypted')
      .eq('id', accountId)
      .single();

    if (!aiAccount?.api_key_encrypted) {
      return Response.json({ error: 'Account AI non trovato' }, { status: 400 });
    }

    const apiKey = await decrypt(aiAccount.api_key_encrypted);
    const openrouter = createOpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'HTTP-Referer': 'https://gestionale.quixel.it',
        'X-Title': 'Gestionale Quixel',
      },
    });

    const modelList: string[] = models ?? FREE_MODELS.map((m) => m.value);

    // Query all free models in parallel — send only the question, no project history
    const settled = await Promise.allSettled(
      modelList.map(async (model) => {
        const result = await generateText({
          model: openrouter(model),
          system: COMPARISON_SYSTEM,
          prompt: question,
          maxOutputTokens: 800,
        });
        return { model, content: result.text, tokens: result.usage?.totalTokens ?? 0 };
      })
    );

    const responses = settled
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<{ model: string; content: string; tokens: number }>).value);

    const failed = settled
      .filter((r) => r.status === 'rejected')
      .map((r, i) => ({
        model: modelList[i],
        error: (r as PromiseRejectedResult).reason?.message ?? 'Errore sconosciuto',
      }));

    if (responses.length === 0) {
      return Response.json({ error: 'Tutti i modelli hanno fallito', failed }, { status: 500 });
    }

    // Opus 4.7 verifies hallucinations and synthesizes the best answer
    const verifierPrompt = `Hai ricevuto la seguente domanda e le risposte di ${responses.length} modelli AI.

DOMANDA: ${question}

RISPOSTE:
${responses.map((r, i) => `[${i + 1}. ${r.model}]\n${r.content}`).join('\n\n---\n\n')}

Analizza le risposte e:
1. Identifica allucinazioni, errori fattuali o affermazioni non verificabili per ciascun modello
2. Indica quale risposta è più accurata e completa
3. Produci una sintesi finale verificata e concisa

Formato OBBLIGATORIO:
## Analisi errori
[bullet per modello con eventuali problemi, oppure "Nessuna allucinazione rilevata"]

## Migliore risposta
[nome modello]

## Sintesi verificata
[testo della risposta migliore/sintetizzata, pronta per essere salvata]`;

    const verification = await generateText({
      model: openrouter(VERIFIER_MODEL),
      prompt: verifierPrompt,
      maxOutputTokens: 700,
    });

    return Response.json({
      responses,
      failed,
      verification: verification.text,
      verificationTokens: verification.usage?.totalTokens ?? 0,
    });
  } catch (error: unknown) {
    console.error('[chat/multi] error:', error);
    const message = error instanceof Error ? error.message : 'Errore interno';
    return Response.json({ error: message }, { status: 500 });
  }
}
