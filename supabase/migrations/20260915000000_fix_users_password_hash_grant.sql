-- Corrige o REVOKE de password_hash que a migration anterior nao aplicou de fato.
--
-- 20260823000000_rls_authenticated.sql deu `GRANT SELECT, INSERT, UPDATE, DELETE
-- ON public.users TO authenticated` (tabela inteira) e so depois tentou
-- `REVOKE ALL (password_hash) ... FROM authenticated`. No Postgres um GRANT de
-- tabela inteira sempre vence um REVOKE de coluna especifica feito depois --
-- nao da pra "subtrair" uma coluna de um privilegio ja concedido na tabela
-- toda. Resultado: password_hash continuou legivel por qualquer usuario
-- autenticado (confirmado direto via REST).
--
-- Correcao: revoga tudo de public.users e regarante so nas colunas seguras
-- (mesma lista de USER_PUBLIC_COLUMNS em lib/mappers.ts para SELECT).
--
-- Aproveitando a correcao: o UPDATE tambem estava liberado para a tabela
-- inteira, incluindo `role` e `permissions`. Hoje o app so faz UPDATE direto
-- (client-side, com o token do usuario logado) nas colunas `status` e
-- `commission_rate` (ver app/page.tsx) -- toda mudanca de role/permissions
-- passa por app/api/auth/users/update/route.ts, que ja valida
-- auto-promocao (fix fb91e7c). Restringir o GRANT a essas duas colunas fecha
-- o mesmo tipo de escalonamento de privilegio via REST direto ao Supabase
-- (hoje nao explorável: so existem 2 contas admin, sem staff/prestador).

BEGIN;

REVOKE ALL ON public.users FROM authenticated;

GRANT SELECT (
  id, name, username, role, status, specialty, phone, avatar,
  commission_rate, permissions, created_at
) ON public.users TO authenticated;

GRANT UPDATE (status, commission_rate) ON public.users TO authenticated;

GRANT DELETE ON public.users TO authenticated;

COMMIT;
