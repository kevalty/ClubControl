import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Cliente con service_role key: bypassea RLS. SOLO usar en route handlers/
// server actions que corren en el servidor (cron jobs, webhooks). Nunca
// importar este archivo desde código que se ejecute en el cliente.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
