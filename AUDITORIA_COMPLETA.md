# Auditoria Completa de Segurança, Performance e Arquitetura
## CRM Gabi Almeida Estética Avançada
**Data:** 14/06/2026 | **Stack:** Next.js 15 + React 19 + Supabase + TypeScript 5.9 + Tailwind 4

---

## Índice
1. [Categoria 1: SEGURANÇA (Críticos)](#1-seguranca)
2. [Categoria 2: CÓDIGO MORTO E ARQUITETURA](#2-codigo-morto-e-arquitetura)
3. [Categoria 3: BANCO DE DADOS](#3-banco-de-dados)
4. [Categoria 4: PERFORMANCE E BANDA](#4-performance-e-banda)
5. [Categoria 5: ARMAZENAMENTO E ARQUIVOS](#5-armazenamento-e-arquivos)
6. [Plano de Ação Priorizado](#6-plano-de-acao)

---

## 1. SEGURANÇA

### 🔴 CRÍTICO 1.1 — .env versionado com chaves reais de produção
**Arquivo:** `.env` (raiz do projeto)
**Arquivo:** `.gitignore` (linha 6: `.env*`)

**Problema:** O arquivo `.env` contém chaves de produção válidas e está sendo versionado no git:
- `SUPABASE_SERVICE_ROLE_KEY` — chave de administrador total do banco PostgreSQL
- `SUPABASE_ACCESS_TOKEN` — token de gerenciamento do projeto Supabase
- `JWT_SECRET` — segredo usado para assinar tokens de sessão
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — chave pública

**Risco:** Qualquer pessoa com acesso ao repositório (ou ao histórico do git) pode:
- Conectar-se ao banco como superadmin
- Extrair/alterar/deletar todos os dados
- Forjar tokens JWT e se passar por qualquer usuário
- Acessar a Management API do Supabase

**Solução:**
1. **IMEDIATO:** Remover o `.env` do tracking do git:
   ```bash
   git rm --cached .env
   ```
2. **IMEDIATO:** Rotacionar IMEDIATAMENTE todas as chaves expostas no Supabase Dashboard
3. Adicionar `.env` ao `.gitignore` (já está, mas o arquivo já foi commitado)
4. Usar secrets do GitHub Actions / ambiente para CI/CD

---

### 🔴 CRÍTICO 1.2 — Row Level Security (RLS) completamente aberto
**Arquivos:** Todas as migrations SQL e `supabase-schema.sql`

**Problema:** Todas as políticas RLS usam `FOR ALL TO public USING (true) WITH CHECK (true)`. O frontend (cliente) usa a `NEXT_PUBLIC_SUPABASE_ANON_KEY` diretamente para fazer queries:

```sql
CREATE POLICY "Allow public full access to users" ON public.users
    FOR ALL TO public USING (true) WITH CHECK (true);
```

```typescript
// app/page.tsx:565 — frontend faz query direta no Supabase
supabase.from('clientes').select('*')
```

**Risco:** A anon key é pública (exposta no frontend). Qualquer pessoa com essa chave pode:
- Listar todos os usuários, incluindo seus `password_hash`, `commission_rate`, `permissions`
- Criar, alterar ou deletar qualquer registro em qualquer tabela
- Não há nenhuma proteção real no banco

**Solução:**
1. **Implantar padrão API Gateway:** Todo acesso a dados deve passar pelas API routes do Next.js, nunca diretamente pelo cliente
2. Restringir RLS para `TO authenticated` e usar `auth.uid()` ou JWT claims
3. Atualmente o backend já usa `supabaseAdmin` com service_role_key — o frontend que deveria usar API routes, não DB direto
4. Remover o `supabase.from(...)` do frontend e criar API routes para cada operação

---

### 🔴 CRÍTICO 1.3 — Senha padrão fraca no registro
**Arquivo:** `app/api/auth/register/route.ts:38`

```typescript
const finalPassword = password && password.trim() !== '' ? password : '123';
```

**Problema:** Se a requisição não enviar `password` ou enviar vazio, a senha padrão é `'123'`.

**Risco:** Usuários criados sem senha explícita têm senha previsível e fraca.

**Solução:**
```typescript
if (!password || password.trim().length < 6) {
  return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
}
```

---

### 🔴 CRÍTICO 1.4 — JWT Secret versionado
**Arquivo:** `.env` (linha 3)

**Problema:** `JWT_SECRET` está no `.env` que está no git. O segredo é usado para assinar tokens de sessão. Se comprometido, qualquer pessoa pode forjar tokens JWT válidos.

**Solução:** Rotacionar o JWT_SECRET e removê-lo do histórico do git.

---

### 🟠 ALTO 1.5 — Upload de arquivos sem validação
**Arquivo:** `app/api/storage/upload/route.ts`

**Problema:**
```typescript
const { bucket, path, base64, contentType } = await request.json();
if (!bucket || !path || !base64) { ... }
const url = await uploadBase64ToStorage(bucket, path, base64, contentType);
```

- Não há validação de extensão de arquivo
- Não há limite de tamanho (DoS via base64 gigante)
- `bucket` e `path` arbitrários (path traversal)
- `contentType` enviado pelo cliente sem verificação

**Risco:** Upload de malware, overwrite de arquivos do sistema, path traversal, consumo de armazenamento.

**Solução:**
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE_MB = 10;

if (!ALLOWED_TYPES.includes(contentType)) { /* reject */ }
if (base64.length > MAX_SIZE_MB * 1024 * 1024 * 1.37) { /* reject */ }
// Sanitizar path: garantir que está dentro do diretório esperado
```

---

### 🟠 ALTO 1.6 — Exposição de metadata do banco no frontend
**Arquivo:** `app/page.tsx:55-65`

**Problema:** O fetch inicial busca `users.*` incluindo `commission_rate` e `password_hash` (embora removido no mapper). Dados salariais e comissionamentos ficam disponíveis no frontend.

**Solução:** API routes devem retornar apenas os campos necessários para cada operação. O backend deve selecionar explicitamente os campos.

---

### 🟡 MÉDIO 1.7 — Rate limiting ausente
**Arquivos:** `app/api/auth/login/route.ts`, `app/api/auth/change-password/route.ts`

**Problema:** Nenhuma rota de autenticação tem rate limiting. Não há proteção contra ataques de força bruta.

**Solução:** Implementar rate limiting com headers `X-RateLimit-*` ou usar middleware de rate limiting. Sugiro pacote como `express-rate-limit` ou implementar com Redis/Upstash.

---

### 🟡 MÉDIO 1.8 — Sem cabeçalhos de segurança HTTP
**Arquivo:** `next.config.ts`

**Problema:** Não há configuração de:
- `Content-Security-Policy` (CSP)
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security`

**Solução:** Adicionar no `next.config.ts`:
```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-eval' 'unsafe-inline';" },
    ]
  }];
}
```

---

### 🟡 MÉDIO 1.9 — Assinatura digital armazenada como base64 sem criptografia
**Arquivos:** `lib/storage.ts`, `components/AnamneseLimpezaDePele.tsx`

**Problema:** Assinaturas digitais são armazenadas como strings base64 diretamente no banco/documentos. Dados biométricos (assinatura) não têm proteção adicional.

**Solução:** Criptografar as assinaturas em repouso usando AES-256. Armazenar apenas hash para verificação.

---

### 🟡 MÉDIO 1.10 — XSS potencial via assistente AI
**Arquivo:** `app/api/assistant/route.ts:55`

```typescript
const text = response.text || 'Não consegui gerar uma resposta no momento.';
return NextResponse.json({response: text});
```

O texto retornado pela Gemini é inserido no DOM via React. Se a API retornar conteúdo malicioso, pode causar XSS. Apesar de o React escapar HTML por padrão, conteúdo com `<script>` em atributos ou dangerouslySetInnerHTML seria vulnerável.

**Solução:** Verificar se há uso de `dangerouslySetInnerHTML` em qualquer lugar onde o texto do assistente é renderizado. Implementar sanitização com DOMPurify se necessário.

---

### 🟢 BAIXO 1.11 — CORS permitindo todas as origens (implícito)
**Arquivo:** `next.config.ts`

**Problema:** Não há configuração explícita de CORS. Em modo standalone, Next.js aceita requisições de qualquer origem.

**Solução:** Se houver planos de ter frontend separado do backend, configurar CORS explicitamente.

---

## 2. CÓDIGO MORTO E ARQUITETURA

### 🔴 CRÍTICO 2.1 — Monólito de 6270+ linhas em um único arquivo
**Arquivo:** `app/page.tsx`

**Problema:** TODO o CRM está em um único componente. Isso inclui:
- 50+ estados (`useState`)
- 6+ efeitos (`useEffect`)
- 30+ handlers de eventos
- Interface de usuário completa com sidebar, agenda, pacientes, financeiro, etc.
- Lógica de negócio, queries de banco, e UI misturados

**Risco:**
- Impossível de testar unitariamente
- Qualquer mudança pode quebrar funcionalidades não relacionadas
- Re-renderizações desnecessárias (todos os estados em um único componente)
- Manutenção extremamente custosa
- Conflitos frequentes no git

**Solução:** Refatorar usando:
1. **Next.js App Router** — cada aba deve ser uma rota separada:
   - `/agenda` | `/clientes` | `/financeiro` | `/servicos` | `/estoque` | etc.
2. **Componentes atômicos** — extrair componentes reutilizáveis:
   - `Sidebar.tsx`, `Header.tsx`, `AgendaView.tsx`, `PatientList.tsx`, `FinanceiroView.tsx`
3. **Custom hooks** — extrair lógica de estado:
   - `useAuth()`, `useAppointments()`, `usePatients()`, `useTransactions()`
4. **Context API** para estado global compartilhado

---

### 🟠 ALTO 2.2 — Scripts de desenvolvimento no repositório
**Arquivos:** `fix_page.js`, `fix_page_issues.js`, `final_fix.js`, `fix_agenda.ps1`, `update_page.js`, `update_page_all.js`, `update_agenda_mobile.js`, `refactor_page.js`, `implement_despesas.js`, `check_db_v2.js`, `test_despesas.js`, `test_rls.js`, `test_supabase.js`, `test-error.js`, `test.js`, `test2.js`

**Problema:** 16+ scripts de desenvolvimento/teste na raiz do projeto. Poluem o repositório, aumentam o tamanho do clone, e podem conter lógica obsoleta ou chaves.

**Solução:**
- Mover scripts úteis para `scripts/`
- Adicionar `scripts/` ao `.gitignore` (com README explicando)
- Deletar scripts obsoletos

---

### 🟠 ALTO 2.3 — Lógica de timeline duplicada
**Arquivo:** `app/page.tsx:452-480`

`deleteTimelineItem` e `saveTimelineItem` têm praticamente a mesma estrutura. Poderiam ser combinadas em uma função genérica.

---

### 🟠 ALTO 2.4 — Falta de tipagem adequada
**Arquivos:** `lib/types.ts`, `lib/mappers.ts`

**Problema:** Os mappers usam `any` como tipo de entrada. Isso anula os benefícios do TypeScript. Erros de schema do banco só serão detectados em runtime.

```typescript
export const mapClienteToFrontend = (c: any): Cliente => ({
```

**Solução:** Criar tipos `DbUser`, `DbCliente`, `DbAgendamento` que refletem exatamente o schema do banco, com validação em runtime usando Zod.

---

### 🟡 MÉDIO 2.5 — `patients[0]` como fallback inseguro
**Arquivo:** `app/page.tsx:1385,2030,2184,2376`

```typescript
setNewApptPatient(patients[0]?.nome || '');
```

Se não houver pacientes, `patients[0]` é `undefined`.

**Risco:** Comportamento indefinido se o banco estiver vazio.

**Solução:** Usar fallback com verificação explícita ou UI de "nenhum paciente cadastrado".

---

### 🟡 MÉDIO 2.6 — Duplicação dos mappers de backend/frontend
**Arquivo:** `lib/mappers.ts`

Cada entidade tem `mapXToFrontend` e `mapXToBackend` com mapeamento manual de campos. Isso é repetitivo e propenso a erros quando o schema muda.

**Solução:** Usar biblioteca como `camelcase-keys`/`snakecase-keys` ou gerar automaticamente os mappers com tipos inferidos do Zod.

---

### 🟢 BAIXO 2.7 — imports não utilizados
**Arquivo:** `app/page.tsx:18`

```typescript
import { mapCobrancaToBackend, ... } from '../lib/mappers';
```

`mapCobrancaToBackend` é importado mas não usado.

---

## 3. BANCO DE DADOS

### 🔴 CRÍTICO 3.1 — Campos de data/hora como TEXT
**Tabelas:** `agendamentos.data`, `agendamentos.hora`, `cobrancas.data`, `clientes.ultima_visita`, `despesas.data`

**Problema:** Datas e horas armazenadas como texto (`TEXT` ou `VARCHAR`). O frontend faz parsing manual:
```typescript
const parts = t.data.split('/');
if (parts.length === 3) { const [, m, y] = parts; ... }
```

**Risco:**
- Impossível ordenar corretamente por data no SQL
- Impossível fazer queries de intervalo com índices
- Validação de integridade zero (qualquer string é aceita)
- Performance horrível para queries baseadas em data
- Formato inconsistente (às vezes DD/MM/AAAA, às vezes YYYY-MM-DD)

**Solução:** Migrar para `DATE`/`TIMESTAMPTZ`/`TIME`:
```sql
ALTER TABLE agendamentos ALTER COLUMN data TYPE DATE USING data::DATE;
ALTER TABLE agendamentos ALTER COLUMN hora TYPE TIME USING hora::TIME;
```

---

### 🟠 ALTO 3.2 — Ausência completa de índices
**Tabelas:** Todas

**Problema:** Nenhum índice além da PK `id` foi criado. Colunas frequentemente filtradas:
- `users.username` — usado no login
- `agendamentos.data` — filtro por dia/mês
- `agendamentos.cliente_id` — JOIN com clientes
- `cobrancas.data` — relatórios financeiros
- `clientes.nome` — busca de pacientes

**Risco:** Queries ficarão exponencialmente mais lentas conforme os dados crescem. Cada SELECT faz full table scan.

**Solução:**
```sql
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_agendamentos_data ON public.agendamentos(data);
CREATE INDEX idx_agendamentos_cliente_id ON public.agendamentos(cliente_id);
CREATE INDEX idx_cobrancas_data ON public.cobrancas(data);
CREATE INDEX idx_clientes_nome ON public.clientes(nome);
```

---

### 🟠 ALTO 3.3 — JSONB para dados relacionais
**Tabela:** `clientes.financials` (JSONB), `clientes.documents` (JSONB)

**Problema:** Dados financeiros e documentos dos pacientes são armazenados como JSONB dentro da tabela de clientes, ao invés de tabelas normalizadas separadas.

**Risco:**
- Impossível fazer JOIN, índices, ou integridade referencial
- Query complexas no frontend filtram manualmente o JSONB
- Concorrência: dois usuários podem sobrescrever dados um do outro
- Escalabilidade: o registro do cliente cresce indefinidamente

**Solução:** Criar tabelas separadas:
```sql
CREATE TABLE patient_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  procedure TEXT,
  price NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('Pago', 'Pendente', 'Cancelado')),
  method TEXT
);

CREATE TABLE patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  size TEXT,
  signed BOOLEAN DEFAULT FALSE,
  signature_base64 TEXT,
  content JSONB
);
```

---

### 🟠 ALTO 3.4 — Duas tabelas de mensagens predefinidas
**Arquivo:** `20260607000000_portuguese_schema.sql` e `20260614000000_mensagens_predefinidas.sql`

**Problema:** A migração `portuguese_schema` cria `mensagens_pre_definidas` (underline duplo), mas a migração posterior cria `mensagens_predefinidas`. O frontend usa `mensagens_predefinidas`. A tabela antiga pode permanecer como lixo.

**Solução:** Verificar qual tabela está em uso e dropar a obsoleta.

---

### 🟡 MÉDIO 3.5 — CHECK constraint inconsistente para categoria de agendamento
**Tabela:** `agendamentos.categoria`

**Problema:** O banco aceita `('Estética', 'Injetáveis', 'Consulta')`, mas o frontend só usa `'Estética' | 'Consulta'`. `'Injetáveis'` não tem suporte no frontend.

**Solução:** Alinhar o CHECK constraint com os valores realmente usados.

---

### 🟡 MÉDIO 3.6 — `despesas` sem estrutura consistente
**Arquivos:** Duas definições diferentes de `despesas`:
1. Migração portuguese: `data TEXT, descricao TEXT, categoria TEXT, status TEXT, valor NUMERIC`
2. Migração fix_rls: `descricao TEXT NOT NULL, valor NUMERIC NOT NULL, data TIMESTAMP WITH TIME ZONE NOT NULL`

A segunda versão perde as colunas `categoria` e `status`, mas o frontend depende delas.

**Solução:** Unificar a definição da tabela.

---

### 🟢 BAIXO 3.7 — Sem soft delete
**Problema:** Todas as deleções são `DELETE` físico. Não há coluna `deleted_at` para soft delete.

**Risco:** Dados deletados por engano são irrecuperáveis. Sem trilha de auditoria.

**Solução:** Adicionar `deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL` em todas as tabelas principais. Filtrar por `WHERE deleted_at IS NULL`.

---

## 4. PERFORMANCE E BANDA

### 🔴 CRÍTICO 4.1 — Realtime subscriptions refazendo SELECT completo
**Arquivo:** `app/page.tsx:606-656`

```typescript
supabase
  .channel('schema-db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
    supabase.from('clientes').select('*').then(...) // REFETCH ALL
  })
```

**Problema:** Cada mudança em qualquer tabela dispara um SELECT completo de TODOS os registros. Com 7 subscriptions, uma única mudança pode disparar 7 queries full-scan.

**Risco:** Conforme os dados crescem, isso se torna inviável. Cada alteração de status de um agendamento refetch todos os clientes, transações, serviços, etc.

**Solução:** Usar o `payload.new`/`payload.old` do Realtime para atualizar apenas o registro modificado:
```typescript
.on('postgres_changes', { event: 'UPDATE', table: 'clientes' }, (payload) => {
  setPatients(prev => prev.map(p => p.id === payload.new.id ? mapClienteToFrontend(payload.new) : p));
})
```

---

### 🟠 ALTO 4.2 — Fetch inicial sem paginação
**Arquivo:** `app/page.tsx:554-574`

```typescript
supabase.from('clientes').select('*')       // TODOS os clientes
supabase.from('agendamentos').select('*')   // TODOS os agendamentos
supabase.from('cobrancas').select('*')      // TODAS as transações
```

**Problema:** Busca todos os registros de todas as tabelas na inicialização. Sem paginação, sem limite, sem filtro.

**Risco:** Com 10.000 clientes e 100.000 transações, o payload da página inicial seria dezenas de MB.

**Solução:** Implementar paginação com `range()` e lazy loading. Carregar apenas dados do mês corrente.

---

### 🟡 MÉDIO 4.3 — Imagens sem otimização do Next.js
**Arquivo:** `app/page.tsx` (múltiplos usos)

```tsx
<Image width={500} height={500} unoptimized
  alt="Perfil" className="..."
  src={currentUser.avatar} sizes="(max-width: 768px) 100vw, 500px"
/>
```

**Problema:** `unoptimized` desativa toda a otimização de imagens do Next.js (webp, redimensionamento, lazy loading). `sizes` está incorreto para thumbnails de 40x40px.

**Solução:** Remover `unoptimized` e usar sizes corretos:
```tsx
<Image width={40} height={40} className="w-10 h-10 rounded-full"
  src={currentUser.avatar} alt="Perfil" sizes="40px"
/>
```

---

### 🟡 MÉDIO 4.4 — Sem SWR/React Query/TanStack Query
**Problema:** As queries são feitas diretamente com `fetch` + `useState`. Não há cache, deduplicação de requisições, retry, ou stale-while-revalidate.

**Solução:** Implementar TanStack Query com:
- Cache automático com stale time
- Deduplicação de requisições paralelas
- Retry automático em falhas
- Mutations otimistas para UI responsiva

---

### 🟢 BAIXO 4.5 — Headers de compressão ausentes
**Problema:** Não há configuração explícita de compressão gzip/brotli nas respostas da API.

**Solução:** No Next.js standalone, configurar compressão no proxy reverso (NGINX, Cloudflare). Em modo dev, Next.js já comprime por padrão.

---

## 5. ARMAZENAMENTO E ARQUIVOS

### 🟠 ALTO 5.1 — Upload de base64 sem limite de tamanho
**Arquivo:** `lib/storage.ts:3-22`

```typescript
const buffer = Buffer.from(base64Data, 'base64');
const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, { contentType, upsert: true });
```

**Problema:** Nenhuma validação de tamanho do arquivo. Um base64 de 100MB seria aceito e faria upload. O bucket `avatars` pode encher facilmente.

**Solução:** Validar tamanho antes do upload:
```typescript
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
if (buffer.length > MAX_SIZE) {
  throw new Error(`Arquivo excede o limite de ${MAX_SIZE / 1024 / 1024}MB`);
}
```

---

### 🟡 MÉDIO 5.2 — Dependência de serviços externos para avatares
**Problema:** Avatares default usam `api.dicebear.com`, que é um serviço externo. Se ficar offline, todos os avatares default quebram. Além disso, URLs de terceiros podem conter tracking.

**Solução:** Gerar avatares localmente com `@dicebear/core` ou placeholder inline usando iniciais do nome.

---

### 🟡 MÉDIO 5.3 — Sem geração de thumbnails
**Problema:** As fotos de clientes (antes/depois/evolução) são armazenadas no tamanho completo. Não há geração de thumbnails para visualizações menores (lista, cards).

**Risco:** Carregar fotos em resolução máxima mesmo em cards pequenos desperdiça banda e torna a UI lenta.

**Solução:** Implementar pipeline de transformação de imagens (com Supabase Image Transformation ou imgproxy):
- Thumbnail: 150x150px para listas
- Medium: 600x600px para visualização
- Full: original para download

---

### 🟢 BAIXO 5.4 — Buckets sem validação de nome
**Problema:** O frontend envia o nome do bucket como string. Se um bucket malicioso for especificado, o upload pode ir para um local inesperado.

**Solução:** Restringir buckets permitidos no servidor:
```typescript
const ALLOWED_BUCKETS = ['avatars', 'patient-photos', 'documents'];
if (!ALLOWED_BUCKETS.includes(bucket)) { /* reject */ }
```

---

## 6. PLANO DE AÇÃO PRIORIZADO

### ⚡ Curto Prazo (1-3 dias) — Emergências de Segurança

| Prioridade | Ação | Responsável |
|------------|------|-------------|
| P0 | Rotacionar SUPABASE_SERVICE_ROLE_KEY e SUPABASE_ACCESS_TOKEN | Admin |
| P0 | Remover `.env` do git tracking (`git rm --cached .env`) | Dev |
| P0 | Rotacionar JWT_SECRET no Supabase e no servidor | Admin |
| P0 | Corrigir senha padrão '123' no register route | Dev |
| P1 | Adicionar rate limiting nas rotas de auth | Dev |
| P1 | Validar extensão e tamanho no upload de arquivos | Dev |

### 📅 Médio Prazo (1-2 semanas) — Arquitetura e Performance

| Prioridade | Ação |
|------------|------|
| P1 | Refatorar page.tsx em rotas separadas (app router) |
| P1 | Migrar frontend para usar API routes ao invés de Supabase direto |
| P1 | Restringir RLS policies para `TO authenticated` |
| P1 | Criar tabelas normalizadas para patient_financials e patient_documents |
| P2 | Adicionar índices nas colunas mais consultadas |
| P2 | Refatorar realtime subscriptions para usar payload.new/old |
| P2 | Implementar paginação no fetch inicial |

### 🏗️ Longo Prazo (1-2 meses) — Escalabilidade e Maturidade

| Prioridade | Ação |
|------------|------|
| P2 | Implementar soft delete em todas as tabelas |
| P2 | Adicionar TanStack Query para cache e deduplicação |
| P2 | Migrar datas/horas de TEXT para tipos nativos do PostgreSQL |
| P2 | Adicionar cabeçalhos de segurança HTTP |
| P3 | Implementar pipeline de thumbnails para imagens |
| P3 | Adicionar testes unitários para cada API route |
| P3 | Configurar CI/CD com GitHub Actions (já existe esqueleto) |
| P3 | Remover scripts de desenvolvimento obsoletos da raiz |
| P3 | Adicionar validação de schema com Zod |

---

## Resumo de Severidade

| Severidade | Quantidade |
|------------|-----------|
| 🔴 Crítico | 8 |
| 🟠 Alto | 10 |
| 🟡 Médio | 12 |
| 🟢 Baixo | 4 |
| **Total** | **34** |

---

## Próximos Passos Recomendados

1. **Reunião de emergência** para tratar os itens críticos (P0) — chaves expostas
2. **Rewriting planejado** da arquitetura do frontend (SPA → rotas)
3. **Code review** de todas as API routes antes de implementar novas features
4. **Estabelecer pipeline de CI** com lint + typecheck + testes obrigatórios
5. **Documentar** as políticas de segurança (RLS, CORS, upload) em README

---

*Auditoria realizada em 14/06/2026. Recomenda-se reavaliação após implementação das correções críticas.*
