import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/embeddings';

export const maxDuration = 300; // sync può richiedere qualche minuto

const REGISTRY_URL =
  'https://raw.githubusercontent.com/mvanhorn/printing-press-library/main/registry.json';

type RegistryEntry = {
  name: string;
  category: string;
  description: string;
  path: string;
  printer: string;
};

export async function POST(req: Request) {
  // Protezione: solo cron Vercel o chiamata manuale con secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(REGISTRY_URL, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Registry fetch failed: ${res.status}`);
    const registry = await res.json();
    const entries: RegistryEntry[] = registry.entries ?? [];

    if (entries.length === 0) {
      return Response.json({ error: 'Registry vuoto' }, { status: 500 });
    }

    // Usa service role per bypassare RLS durante sync
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let synced = 0;
    let failed = 0;

    // Processa in batch da 10 per non saturare l'embedding service
    for (let i = 0; i < entries.length; i += 10) {
      const batch = entries.slice(i, i + 10);
      await Promise.all(
        batch.map(async (entry) => {
          try {
            const embedText = `${entry.name} ${entry.description}`;
            const embedding = await generateEmbedding(embedText);

            await supabase.from('pp_cli_catalog').upsert(
              {
                name: entry.name,
                category: entry.category,
                description: entry.description,
                path: entry.path,
                printer: entry.printer,
                embedding: embedding ? JSON.stringify(embedding) : null,
                last_synced_at: new Date().toISOString(),
              },
              { onConflict: 'name' }
            );
            synced++;
          } catch {
            failed++;
          }
        })
      );
    }

    console.log(`[pp-catalog/sync] synced=${synced} failed=${failed} total=${entries.length}`);
    return Response.json({ synced, failed, total: entries.length });
  } catch (error: unknown) {
    console.error('[pp-catalog/sync] error:', error);
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    return Response.json({ error: message }, { status: 500 });
  }
}

// GET per trigger manuale da browser (solo in dev o con secret in header)
export async function GET(req: Request) {
  return POST(req);
}
