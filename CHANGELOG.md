# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [3.17.0] - 2026-08-24
### Adicionado
- **Assinatura do cliente vinculada à sessão do tratamento.** Ao registrar uma sessão, um segundo passo obrigatório pede a assinatura antes de salvar: novo `SignaturePad` com Pointer Events (mouse, dedo e caneta, com sensibilidade de pressão), redimensionamento por `devicePixelRatio`/`ResizeObserver` — testado e responsivo em iPad (retrato e paisagem). A assinatura desenhada, o horário exato do aceite e o texto do termo apresentado ficam gravados em `planos_tratamento_sessoes` (colunas novas: `assinatura_url`, `assinatura_aceite_em`, `assinatura_termo`), com upload para o bucket `signatures` do Storage. Quando o cliente já foi embora, é possível registrar a sessão dispensando a assinatura, mas só informando um motivo (`assinatura_dispensada_motivo`) — nunca some em silêncio.
- **Removido o selo de segurança falso.** O card antigo de assinatura ("Validação de Sessão") exibia um texto fixo "Segurança ICP-Brasil • IP: 192.168.1.45" — IP hardcoded, certificação inexistente — e na prática nunca salvava a imagem desenhada. Removido por completo (JSX, estado e funções órfãs) junto com todo o código morto que ele deixava em `app/page.tsx`.

### Corrigido
- **Barra de estatísticas do prontuário (Total Investido, Procedimentos, Última Foto, Status) estava inoperante.** O botão "Lançar Procedimento" tentava gravar em colunas inexistentes (`total_spent`/`procedures_count` em vez de `total_gasto`/`qtde_procedimentos`), recebia erro 400 a cada uso e nunca incrementava nada; "Última Foto" e o rótulo "Status do Studio" (texto fixo `'Standard'` desde o cadastro, sem uso funcional) nunca eram atualizados. Os 4 valores passam a ser calculados ao vivo (`lib/patientStats.ts`): Total Investido soma Skincare + Planos de Tratamento aprovados/em andamento/concluídos; Procedimentos conta sessões de fato executadas; Última Foto usa a data mais recente da Galeria; e "Status" (rótulo simplificado) mostra o status do plano de tratamento mais recente do cliente.
- A barra ficava com dado desatualizado durante o mesmo uso do sistema: o hook que busca os planos do cliente só recarregava quando o cliente selecionado mudava, não quando o próprio plano era aprovado, iniciado ou ganhava sessões novas — descoberto ao testar de ponta a ponta. Agora todo ponto que altera um plano (criar, aprovar, mudar status de item, registrar sessão, excluir) avisa o prontuário para atualizar a barra.
- Botão "Lançar Procedimento" simplificado para o que ele sempre foi de fato: lançamento financeiro avulso (mantém a gravação em `financials` e o insert em `cobrancas`, sem as colunas quebradas).
- Badge de zoom duplicado no card "Antes" da Galeria de Acompanhamento (cópia colada do card "Depois", faltando no card certo).

### Testes
- 3 arquivos novos (`patientStats`, `SignaturePad`, mappers de assinatura) e ajuste completo do teste do `RegistrarSessaoModal` para o fluxo de 2 passos — 91 testes unitários no total.
- Teste E2E estendido: desenha uma assinatura de verdade em canvas real (Playwright/Chromium), confere gravação no banco, dispensa a 2ª assinatura com motivo, e confere os 4 valores da barra de estatísticas — passando em desktop, iPad retrato e iPad paisagem.

## [3.16.0] - 2026-08-24
### Adicionado
- **Registro de sessões no Plano de Tratamento.** Novo `planos_tratamento_sessoes`: cada sessão de fato executada de um item (ex.: a 3ª de 5 sessões de Botox) agora tem sua própria data, descrição opcional e fotos opcionais, em vez do item inteiro depender de um único status/data de conclusão. O progresso do plano passa a ser calculado por sessão feita/contratada (`sessoesFeitas/quantidade`), não por item marcado concluído — item legado sem sessão registrada continua contando como feito na exibição, sem gravação retroativa.
- **Vínculo automático com o prontuário.** Ao registrar uma sessão: se houver descrição, ela vira um Protocolo (`historico`) do cliente (`"{serviço} — Sessão N/Total"`); se houver fotos, elas entram na Galeria de Acompanhamento (`fotos_evolucao`, tipo Evolução). A última sessão contratada de um item o marca `Concluido` automaticamente, reaproveitando a lógica que já fecha o plano quando todos os itens terminam.
- Fotos de sessão sobem para um bucket dedicado do Supabase Storage (`patient-photos`), não mais como base64 inline — com fallback silencioso se o upload falhar, mesmo padrão já usado nas assinaturas de anamnese.
- Novo modal `RegistrarSessaoModal` (data, descrição, múltiplas fotos, "realizado por" pré-preenchido com o usuário logado).

### Corrigido
- **Editar um plano de tratamento apagava e recriava todos os itens** com IDs novos, mesmo para uma mudança trivial de título — o que teria apagado em cascata o histórico de sessões. Trocado por diff (atualiza item existente, insere novo, remove só o que foi de fato retirado).
- **Criar um plano sem preencher a validade do orçamento falhava** (`invalid input syntax for type date: ""`) — bug pré-existente, descoberto durante a verificação de ponta a ponta desta entrega. O campo em branco agora vira `NULL` corretamente.
- Plano concluído/cancelado manualmente não atualizava o status dos itens ainda pendentes, o que podia mostrar o plano como "Concluído" com a barra de progresso incompleta na mesma tela.
- Um plano com algum item cancelado nunca completava sozinho, mesmo com todo o resto concluído.
- Desconto de um item podia exceder o valor do próprio item sem aviso.

### Testes
- 22 novos testes (mappers da sessão, componente do modal, teste E2E completo simulando criar → aprovar → iniciar tratamento → registrar 2 sessões → conferir Protocolo/Galeria/auto-conclusão, com dado descartável).

## [3.15.0] - 2026-08-24
### Segurança
- **Escalonamento de privilégio corrigido.** `POST /api/auth/users/update` verificava se o usuário podia editar o alvo (admin ou o próprio perfil), mas aceitava `role`, `status`, `permissions` e `commission_rate` sem checar se o valor havia mudado. Um usuário `staff`/`prestador` editando o próprio perfil podia enviar `role: "admin"` diretamente na requisição (fora do que a interface envia) e se promover. A UI nunca oferecia essa opção, mas a API precisa se defender por conta própria — o cliente não é confiável. Agora, uma edição do próprio perfil que tente mudar qualquer um desses quatro campos é recusada com 403; edições de admin sobre outra conta continuam funcionando normalmente. Coberto por 7 testes que reproduzem o ataque e confirmam que a versão anterior falhava 4 deles.
- Verificado no banco de produção: apenas as 2 contas admin esperadas existem hoje, sem indício de exploração.

## [3.14.0] - 2026-08-24
### Performance
- **Carga inicial 94% mais leve.** A listagem de clientes usava `select('*')`, baixando `fotos_evolucao`, `foto_antes`, `foto_depois`, `documents` e `financials` de todos os clientes a cada abertura do sistema: 2,48 MB e 2,2 s só nessa consulta, sendo ~2,2 MB de imagem em base64 que a lista sequer exibe. Agora a lista usa `CLIENTE_LIST_COLUMNS` (0,14 MB, 267 ms) e os campos pesados são buscados sob demanda ao abrir o prontuário (`CLIENTE_DETALHE_COLUMNS`). O custo era linear no número de clientes.
- O refetch do Realtime preserva os detalhes já carregados e sinaliza recarga do prontuário aberto, para não apagar fotos da tela nem servir dado velho.

### Corrigido
- Módulo de venda de skincare passa a refletir a cobrança no financeiro imediatamente, em vez de depender do Realtime.

## [3.13.0] - 2026-08-23
### Corrigido (adicional)
- Datas geradas com `toISOString()` retornavam o dia seguinte a partir das 21h no fuso do Brasil, afetando data padrão de novo agendamento e nova despesa, agendamento de retorno e a visão semanal da agenda. Substituído por `dataLocalISO()` em `lib/utils.ts`.
- `checkSession` disparava `POST /api/auth/seed` a cada visita anônima; chamada automática removida.

### Removido
- 619 linhas de arquivos nunca importados (`hooks/useDashboardMetrics.ts`, `hooks/use-mobile.ts`, `contexts/DashboardContext.tsx`) e sobras menores. O projeto ficou sem nenhuma declaração não utilizada.

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
