// Supabase server client configuration for Server Components
// Server Component/API Route용 - 서버에서만 사용
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Environment variable validation
function validateEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Server Component/API Route용 Supabase 클라이언트
 * 
 * @example
 * ```tsx
 * import { createServerSupabaseClient } from '@/lib/supabase/server';
 * 
 * export async function GET() {
 *   const supabase = await createServerSupabaseClient();
 *   const { data } = await supabase.from('domains').select();
 *   return Response.json(data);
 * }
 * ```
 */
export async function createServerSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = validateEnvVars();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

