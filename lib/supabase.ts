import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/*
 * Token de acesso ao banco (ver lib/supabaseToken.ts).
 *
 * O cliente Supabase chama getAccessToken() a cada requisicao. Guardamos o
 * token em memoria e so buscamos outro quando falta pouco para expirar.
 * Se nao houver token (usuario deslogado ou segredo ainda nao configurado no
 * servidor), o supabase-js cai de volta na chave publica sozinho.
 */

const REFRESH_MARGIN_MS = 5 * 60 * 1000; // renova 5 min antes de expirar

let cachedToken: string | null = null;
let cachedExpiresAt = 0;
let inFlight: Promise<string | null> | null = null;

async function fetchDbToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/db-token', { credentials: 'same-origin' });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.token) {
      cachedToken = null;
      cachedExpiresAt = 0;
      return null;
    }

    cachedToken = data.token as string;
    cachedExpiresAt = Date.now() + (Number(data.expiresIn) || 3600) * 1000;
    return cachedToken;
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  // No servidor as rotas usam supabaseAdmin; nao ha token de sessao para buscar.
  if (typeof window === 'undefined') return null;

  if (cachedToken && Date.now() < cachedExpiresAt - REFRESH_MARGIN_MS) {
    return cachedToken;
  }

  // O supabase-js avisa que pode chamar isso varias vezes em paralelo,
  // entao compartilhamos a mesma requisicao entre os chamadores simultaneos.
  if (!inFlight) {
    inFlight = fetchDbToken().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}

/** Descarta o token em memoria (usar ao sair do sistema). */
export function clearDbToken(): void {
  cachedToken = null;
  cachedExpiresAt = 0;
}

/**
 * Busca um token novo e reaplica no Realtime.
 * O Realtime so le o token quando a conexao e aberta, entao precisa ser
 * chamado apos o login, antes de assinar os canais.
 */
export async function refreshDbAuth(): Promise<void> {
  clearDbToken();
  if (!supabase?.realtime?.setAuth) return;
  try {
    await supabase.realtime.setAuth();
  } catch (err) {
    console.warn('[Supabase] Nao foi possivel aplicar o token no Realtime:', err);
  }
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: getAccessToken,
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : ({} as any);

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : supabase;
