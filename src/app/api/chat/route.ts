import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, projectId } = await req.json();

    const supabase = await createClient();

    // Fetch the primary AI pool for this project
    const { data: project } = await supabase
      .from('projects')
      .select(`
        name,
        description,
        project_ai_pool_assignments(
          is_primary,
          ai_account:ai_accounts(provider, model_name, api_key_encrypted)
        )
      `)
      .eq('id', projectId)
      .single();

    let apiKey = process.env.OPENAI_API_KEY; // Fallback
    let modelName = 'gpt-3.5-turbo';
    
    // Look for assigned AI pool
    if (project?.project_ai_pool_assignments && project.project_ai_pool_assignments.length > 0) {
      // Find primary or just take first
      const primaryPool = project.project_ai_pool_assignments.find((p: any) => p.is_primary) 
        || project.project_ai_pool_assignments[0];
      
      const aiAccount = primaryPool.ai_account as any;
      if (aiAccount && aiAccount.api_key_encrypted) {
        apiKey = aiAccount.api_key_encrypted;
        modelName = aiAccount.model_name || 'gpt-4-turbo';
      }
    }

    if (!apiKey) {
      return new Response("No API Key configured. Please link an AI pool with a valid key.", { status: 400 });
    }

    const openai = createOpenAI({
      apiKey: apiKey,
    });

    const systemPrompt = `Sei l'assistente AI dedicato al progetto "${project?.name}". 
${project?.description ? `Descrizione progetto: ${project.description}` : ''}
Rispondi sempre in italiano in modo professionale ma conciso.`;

    const result = streamText({
      model: openai(modelName),
      system: systemPrompt,
      messages,
    });

    return (result as any).toDataStreamResponse ? (result as any).toDataStreamResponse() : (result as any).toTextStreamResponse();
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(error.message || "Internal Server Error", { status: 500 });
  }
}
