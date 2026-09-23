-- Normaliza o campo `profissional` de agendamentos antigos.
--
-- Achado: 139 registros gravados como "Gabi Almeida" (variacao sem "ela") e
-- 118 com profissional vazio, nenhum batendo com o nome exato do usuario
-- ativo "Gabriela Almeida". A nova grade da Agenda (v3.22.0) agrupa
-- agendamentos por coluna usando igualdade exata de nome com `users.name` --
-- sem essa correcao, quase nenhum agendamento apareceria em coluna nenhuma.
--
-- A causa raiz (valor padrao errado no formulario) foi corrigida junto no
-- app/page.tsx; esta migration so limpa o que ja estava gravado.

UPDATE public.agendamentos
SET profissional = 'Gabriela Almeida'
WHERE profissional IN ('Gabi Almeida', '') OR profissional IS NULL;
