# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [3.13.0] - 2026-08-23
### Corrigido
- **Ações da foto inacessíveis no iPad:** os botões de apagar/editar da galeria do prontuário ficavam num overlay `opacity-0 group-hover:opacity-100`. No Tailwind 4 o `hover:` só se aplica onde há mouse, então em aparelhos de toque eles nunca apareciam — e ainda capturavam o toque por cima da foto. Agora são botões sempre visíveis.
- **Grade da galeria seguia a janela, não o container:** `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` produzia cartões de ~60px quando a lista de clientes estava aberta ao lado, cortando os botões. Trocado por `auto-fill/minmax(120px,1fr)`.
- **Zoom automático do Safari:** campos com fonte menor que 16px faziam o iOS ampliar a página ao focar. Aplicado 16px apenas em aparelhos de toque.
- Carga inicial de dados não espera mais a autenticação do Realtime, evitando atraso na tela "Carregando Sistema".

### Adicionado
- Edição de foto no prontuário: data, classificação (Antes/Depois/Evolução) e observação clínica opcional (até 500 caracteres), em `components/modals/EditarFotoModal.tsx`. Campo `observacao` adicionado a `EvolutionPhoto` (retrocompatível, sem migration).
- Observação exibida junto da miniatura na galeria cronológica.
- Utilitários de toque em `globals.css`: `.hover-actions`, `.touch-only`, `.touch-target`, remoção do realce de toque, rolagem com inércia e `overscroll-behavior: contain`.
- `aria-label` nos botões de abrir menu e nas ações de foto.
- Perfis `ipad` e `ipad-landscape` no Playwright; viewport do perfil desktop ajustada para 1440x900.
- Testes: 8 de componente para o modal de edição e 3 E2E de regressão da galeria em toque.

## [3.12.0] - 2026-08-23
### Segurança
- Trava de tentativas no login: 5 falhas por IP+usuário e 20 por IP em janela de 15 minutos, contando apenas tentativas que falham e liberando no acesso bem-sucedido (`lib/rateLimit.ts`).
- A leitura da tabela `users` pelo frontend passou a usar colunas explícitas (`USER_PUBLIC_COLUMNS`), eliminando o envio de `password_hash` ao navegador.
- Preparado o acesso autenticado ao banco: o navegador passa a apresentar um token de curta duração assinado pelo servidor (`lib/supabaseToken.ts`, rota `/api/auth/db-token`), em vez da chave pública.
- Nova migration `20260823000000_rls_authenticated.sql` restringe todas as policies a `authenticated` e revoga o acesso da role `anon`. **Só deve ser aplicada após configurar `SUPABASE_JWT_SECRET`** — ver instruções no topo do arquivo.

### Alterado
- Componentes extraídos na v3.11.0 e nunca importados foram ligados ao app: Sidebar, DespesaModal, ServicePieChart e CustomSearchableSelect.
- `app/page.tsx` reduzido de 8882 para ~8280 linhas.

## [3.11.0] - 2026-08-13
### Alterado
- Performance Otimizada: redução significativa do pacote de carregamento inicial (First Load JS) com Dynamic Imports e Code Splitting nos modais pesados.
- Limpeza Profunda: remoção de 18 componentes órfãos e dependências inativas da arquitetura antiga.

### Corrigido
- Layout Responsivo: correção de bugs no cabeçalho mobile identificados pela automação E2E.

## [3.10.0] - 2026-07-20
### Adicionado
- Manutenção Preventiva do Banco de Dados: rotina automática interna (cron a cada 6 dias) que mantém o banco de dados sempre ativo, evitando pausas por inatividade no plano gratuito do Supabase.

## [3.9.0] - 2026-07-02
### Adicionado
- Módulo Planos de Tratamento: orçamentos compostos por serviços, com aprovação, acompanhamento de execução por item e exportação em PDF.
- Nova aba "Planos de Tratamento" dentro do prontuário do cliente, com criação já vinculada ao cliente selecionado.

## [3.8.0] - 2026-06-30
### Adicionado
- Ficha de Anamnese para Microagulhamento Completo, com seções específicas para Facial, Barba, Couro Cabeludo e Sobrancelhas.
- Lógica condicional: seções de Avaliação Capilar e de Barba/Sobrancelhas aparecem automaticamente conforme a área selecionada na ficha.
- Alerta clínico de contraindicação ao uso de Isotretinoína nos últimos 6 meses.

## [3.7.0] - 2026-06-23
### Adicionado
- Ficha de Anamnese: Novo formulário específico para procedimentos de Microagulhamento com seções dinâmicas para Avaliação Capilar e de Barba/Sobrancelhas.

### Corrigido
- Agenda Realtime: Destravamento da atualização remota e injeção assíncrona local dos retornos para eliminar latência na tela principal.

## [3.6.0] - 2026-06-23
### Adicionado
- Aba de Retorno: Nova aba no prontuário do paciente com atalhos para agendamento automático de retorno (10, 15, 21, 25, 30 e 90 dias) e lógica de dias úteis (pulo de fim de semana).

### Alterado
- Nomenclatura: Remoção completa do termo 'CRM' de toda a aplicação (UI, cookies e schema de permissões do banco), alterado para 'Sistema'.

## [3.5.0] - 2026-06-22
### Adicionado
- Migração de Repositório: Atualização da URL do repositório remoto e infraestrutura de controle de versão para nova organização no GitHub (`caduhelp-DEV-hub/gabi-almeida-crm`).
- Versionamento: Atualização da exibição das versões nas telas de Login e Sobre do sistema.

## [3.4.0] - 2026-06-16
### Adicionado
- Módulo de Agenda Aprimorado: Transição da visualização diária/semanal para slots explícitos de 30 minutos das 08h às 19h, com altura proporcional e layout de cartões super compactos para ótima legibilidade.
- Campo de Valor Editável: Integrado campo editável "Valor (R$)" nos formulários de criação e edição, com cálculo automático com base na soma dos procedimentos selecionados.
- Dashboard de Performance e Finanças: Implementadas três sub-abas interativas:
  - Pizza: Gráfico de participação do faturamento dos Top 5 Serviços desenhado em Canvas.
  - Caixa: Tabela interativa de Fluxo de Caixa Diário com colunas coloridas de resultado e modal de detalhamento no clique.
  - Barras: Gráfico de Balanço Financeiro comparativo, Resumo de Esforço com métricas douradas e exportação automática em imagem PNG.

## [3.3.0] - 2026-06-15
### Adicionado
- Auto-Finalização de Agendamentos: Implementada regra de negócio que muda automaticamente qualquer agendamento de dias anteriores para o status de "Finalizado" tanto no carregamento inicial quanto ao receber updates em tempo real.

## [3.2.0] - 2026-06-15
### Alterado
- Correção de Layout Semanal: Integrada a visualização semanal diretamente no container principal com a timeline diária ocultada no desktop.
- Ações Rápidas na Semana: Adicionados botões de hover para editar e excluir agendamentos nos cards da semana.
- Interação Rápida: Cliques em cards na semana agora abrem o modal de detalhes do cliente e ações.
