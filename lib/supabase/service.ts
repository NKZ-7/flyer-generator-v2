import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

let _client: ReturnType<typeof createClient<Database>> | null = null;

export function getServiceClient() {
  if (!_client) {
    _client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return _client;
}
