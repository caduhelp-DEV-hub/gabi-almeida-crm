# Auditoria Completa - CRM Gabi Almeida

**Data:** 08/06/2026
**Próxima Sessão:** 09/06/2026

---

## Notas do Projeto (0-10)

| Categoria | Nota |
|---|---|
| Arquitetura | **3/10** |
| Qualidade do Código | **4/10** |
| Segurança | **3/10** |
| Performance | **5/10** |
| Escalabilidade | **3/10** |
| Manutenibilidade | **2/10** |
| UX | **6/10** |
| **NOTA GERAL** | **3.7/10** |

---

## Roadmap de Implementação

### Fase 1 – Correções Críticas (1-2 dias)
- [ ] Proteger endpoint `/api/auth/seed`
- [ ] Validar `JWT_SECRET` na inicialização
- [ ] Adicionar tratamento de erro nas subscriptions
- [ ] Corrigir inconsistência de formato de data

### Fase 2 – Limpeza do Projeto (1 dia)
- [ ] Remover código morto (mappers, utils, hooks, scripts .js avulsos)
- [ ] Remover imports não utilizados
- [ ] Organizar exports de tipos

### Fase 3 – Refatoração Estrutural (1-2 semanas)
- [ ] Quebrar `page.tsx` em componentes (AgendaView, ClientesView, etc.)
- [ ] Extrair lógica financeira para hooks customizados
- [ ] Componentizar calendário (eliminar duplicação)
- [ ] Criar API routes para operações CRUD

### Fase 4 – Otimizações (1 semana)
- [ ] Gerar tipos Supabase
- [ ] Adicionar índices no banco
- [ ] Migrar JSONB para tabelas relacionais
- [ ] Otimizar imagens

### Fase 5 – Escalabilidade (2-3 semanas)
- [ ] Migrar para múltiplas rotas Next.js App Router
- [ ] Implementar virtualização de listas
- [ ] Adicionar testes de integração
- [ ] CI/CD completa

---

## Código Morto para Remover (Seguro)

| Arquivo | Item |
|---|---|
| `lib/mappers.ts:131` | `mapCobrancaToFrontend` |
| `lib/mappers.ts:140` | `mapCobrancaToBackend` |
| `lib/mappers.ts:151` | `mapServicoToFrontend` |
| `lib/mappers.ts:159` | `mapServicoToBackend` |
| `lib/mappers.ts:169` | `getAppointmentColorClass` |
| `lib/utils.ts:4` | `cn()` function |
| `hooks/use-mobile.ts` | `useIsMobile()` hook |
| `lib/types.ts:87` | `MsgPreDefinida` type |
| `check_db_v2.js` | Script órfão |
| `final_fix.js` | Script órfão |
| `fix_agenda.ps1` | Script órfão |
| `fix_page.js` | Script órfão |
| `refactor_page.js` | Script órfão |
| `update_agenda_mobile.js` | Script órfão |
| `update_page.js` | Script órfão |
| `test-error.js` | Script órfão |
| `test.js` | Script órfão |
| `test2.js` | Script órfão |

---

## Problemas Críticos Identificados

1. **RLS aberto para public** - Qualquer um com anon key acessa tudo
2. **Endpoint `/api/auth/seed` sem proteção** - Cria admin sem auth
3. **Monólito SPA de 5733 linhas** - `app/page.tsx`
4. **Acesso direto ao DB pelo cliente** - `supabase.from(...)` no frontend
5. **Senha default '123'** para novos usuários
6. **Refresh total de dados nas Realtime subscriptions**
7. **Falta de validação de role server-side**
