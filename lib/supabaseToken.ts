import jwt from 'jsonwebtoken';

/**
 * Gera um "cracha" que o navegador usa para falar com o banco.
 *
 * Hoje o frontend usa a chave publica crua (anon), que qualquer pessoa consegue
 * ler no codigo do site. Com este token, o banco passa a aceitar apenas quem
 * esta realmente logado no sistema, porque so o servidor sabe assinar.
 *
 * O token e assinado com o mesmo segredo do projeto Supabase
 * (Settings -> API -> JWT Settings -> JWT Secret), entao o Postgres o aceita
 * como se fosse um usuario autenticado e aplica as policies de `authenticated`.
 */

// Validade curta de proposito: se vazar, expira rapido. O frontend renova sozinho.
export const DB_TOKEN_TTL_SECONDS = 60 * 60; // 1 hora

export function getSupabaseJwtSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error(
      'SUPABASE_JWT_SECRET nao definido. Copie o valor de Settings -> API -> JWT Settings no painel do Supabase.'
    );
  }
  return secret;
}

export function isSupabaseTokenConfigured(): boolean {
  return Boolean(process.env.SUPABASE_JWT_SECRET);
}

export function signSupabaseToken(userId: string, appRole: string): string {
  return jwt.sign(
    {
      sub: userId,
      aud: 'authenticated',
      // Papel que o Postgres enxerga. E ele que faz as policies de `authenticated` valerem.
      role: 'authenticated',
      // Papel interno do sistema (admin/staff/prestador), para policies mais finas no futuro.
      app_role: appRole,
    },
    getSupabaseJwtSecret(),
    { expiresIn: DB_TOKEN_TTL_SECONDS }
  );
}
