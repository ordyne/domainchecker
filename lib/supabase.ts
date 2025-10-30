// Supabase client configuration for Next.js 15 App Router
// Client Component용 - 브라우저에서 사용
import { createBrowserClient } from '@supabase/ssr';
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
 * Client Component용 Supabase 클라이언트
 * 
 * @example
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase';
 * 
 * export function MyComponent() {
 *   const supabase = createClient();
 *   // Use supabase client
 * }
 * ```
 */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = validateEnvVars();

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}



