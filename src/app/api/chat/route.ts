import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import { generateEmbedding } from '@/lib/embeddings';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, projectId } = await req.json();
    const supabase = await createClient();

    const [{ data: project }, relevantIdeas] = await Promise.all([
      supabase
        .from('projects')
        .select(`
          name, description,
          project_ai_pool_assignments(
            is_primary,
            ai_account:ai_accounts(api_key_encrypted, model_name)
          )
        `)
        .eq('id', projectId)
        .single(),
      getRelevantIdeas(supabase, messages, projectId),
    ]);

    const assignments: any[] = project?.project_ai_pool_assignments ?? [];
    const primary = assignments.find(p => p.is_primary) ?? assignments[0];
    const aiAccount = primary?.ai_account as any;

    if (!aiAccount?.api_key_encrypted) {
      return new Response(
        'Nessun account AI collegato a questo progetto. Vai in Impostazioni, aggiungi un account OpenRouter, poi collegalo al progetto.',
        { status: 400 }
      );
    }

    const apiKey = await decrypt(aiAccount.api_key_encrypted);
    const modelName = aiAccount.model_name ?? 'anthropic/claude-sonnet-4-6';

    const openrouter = createOpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'HTTP-Referer': 'https://gestionale.quixel.it',
        'X-Title': 'Gestionale Quixel',
      },
    });

    const ideasContext = relevantIdeas.length > 0
      ? `\n\n## Tue idee e insight rilevanti (dal tuo archivio personale):\n${relevantIdeas.map(i =>
          `[${i.category.toUpperCase()}] ${i.title ? i.title + ': ' : ''}${i.content}`
        ).join('\n\n')}\n\nUsa questi tuoi insight come base del ragionamento quando pertinenti.`
      : '';

    const systemPrompt = `Sei l'assistente AI personale dedicato al progetto "${project?.name}".${project?.description ? `\nDescrizione progetto: ${project.description}` : ''}${ideasContext}

Rispondi sempre in italiano. Sii diretto, concreto e professionale. Quando usi gli insight dell'archivio personale, integrali naturalmente nel ragionamento senza citarli esplicitamente.`;

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: openrouter(modelName),
      system: systemPrompt,
      messages: modelMessages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}

async function getRelevantIdeas(supabase: any, messages: any[], projectId: string): Promise<any[]> {
  try {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return [];

    const queryText = (lastUserMessage.parts ?? [])
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text ?? '')
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
