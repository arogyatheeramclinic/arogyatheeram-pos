import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hizvdomxxogkmkaxizry.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

/**
 * Public Supabase client for browser and real-time operations
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Administrative client using service role key (for server actions & direct seeding)
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey || 'placeholder-service-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Checks whether Supabase credentials are configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Validates active connectivity to Supabase backend
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  hasTables: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      hasTables: false,
      message: 'Supabase credentials not configured in environment.',
    };
  }

  try {
    const { data, error } = await supabase.from('clinic_config').select('id').limit(1);
    if (error) {
      if (error.message.includes('Could not find the table') || error.code === 'PGRST204') {
        return {
          connected: true,
          hasTables: false,
          message: 'Supabase reachable. Tables pending schema execution in SQL Editor.',
        };
      }
      return {
        connected: false,
        hasTables: false,
        message: error.message,
      };
    }
    return {
      connected: true,
      hasTables: true,
      message: 'Supabase cloud connected and operational.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown connection error';
    return {
      connected: false,
      hasTables: false,
      message: errorMsg,
    };
  }
}
