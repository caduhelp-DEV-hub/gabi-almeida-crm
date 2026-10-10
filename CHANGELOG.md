# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [3.33.0] - 2026-10-10
### Corrigido
- **Robô podia oferecer e agendar horário que já passou hoje.** A agenda do robô não descartava horários anteriores ao momento atual, então quem pedia "hoje" podia receber, por exemplo, 09:30 às 15h. Agora só são oferecidos horários de hoje que ainda não passaram, e a criação/remarcação é recusada se o horário já passou (usando o horário de São Paulo, independente do servidor). A lista de dias do menu agora também inclui o dia de hoje, quando ainda há horário.
- **Espaços sobrando nas mensagens do robô.** Nomes de procedimento cadastrados com espaço no fim ou no começo (ex.: "Manicure ") deixavam espaço duplo e espaço antes da pontuação ("Manicure ?"). As mensagens agora saem limpas, sem alterar o cadastro.

### Testes
- Novos testes de "horário já passou" (hoje, dias anteriores e virada de dia no fuso de São Paulo) e da limpeza de espaços.

## [3.32.0] - 2026-10-10
### Corrigido
- **Robô respondia "fora do horário de atendimento" num atendimento 24 horas.** A saudação da primeira mensagem mudava conforme o horário de funcionamento (num sábado depois das 15h, por exemplo, o cliente recebia o aviso de fora do horário e só conseguia agendar insistindo). Agora o robô sempre recebe o cliente com a boas-vindas e o menu, a qualquer hora. O horário de funcionamento passou a limitar apenas quais horários da agenda são oferecidos. O campo "Mensagem fora do horário de atendimento" não é mais usado pelo robô.

### Segurança
- **Trava de horário de funcionamento no agendamento.** Além de só oferecer horários dentro do expediente, a criação e a remarcação de agendamentos pelo robô agora são recusadas se o dia estiver fechado ou o atendimento não couber inteiro entre a abertura e o fechamento cadastrados em Configurações > WhatsApp. Se a configuração estiver ausente, o dia conta como fechado (nunca se assume um horário padrão).

### Testes
- Novos testes da regra de expediente (dia fechado, 08:00 antes da abertura, atendimento que passa do fechamento, configuração ausente ou inválida).

## [3.31.0] - 2026-10-10
### Corrigido
- **Horário de atendimento ignorado pelo robô.** A consulta de disponibilidade lia só uma linha das configurações do WhatsApp (a do "bot ativo"), então o horário de atendimento nunca era aplicado: o robô oferecia horários em dias fechados (ex.: domingo e segunda) e fora do expediente (das 8h às 19h, em vez do configurado). Agora a rota lê o horário de atendimento cadastrado em Configurações > WhatsApp, e dia fechado volta sem horários.

### Adicionado
- **Menu por números no atendimento.** O robô passou a conduzir o cliente por listas numeradas (menu principal, procedimento, próximos dias com horário livre, período e horário), sem exigir formato de data ou hora. O cliente responde só o número; escrever com as próprias palavras continua funcionando.

## [3.30.0] - 2026-10-10
### Adicionado
- **Pausa de "digitando..." ajustável.** O robô mostrava o "digitando..." por no máximo 3,5 s, e a espera era aplicada em dobro no código. Agora a pausa é proporcional ao tamanho da resposta, com mínimo e máximo editáveis em Configurações > WhatsApp (padrão 2,5 s a 7 s).
- **Mensagem de "sem horário disponível" editável.** Quando o dia ou período pedido está fechado, bloqueado ou lotado, o robô responde com um texto cordial pedindo outra data. A variável `[quando]` vira "em 15/10/2026" ou "na tarde de 15/10/2026".

### Corrigido
- **Respostas embaralhadas/cortadas.** O bot processava em paralelo duas mensagens seguidas do mesmo cliente, então as respostas podiam se cruzar ou o estado da conversa ser lido desatualizado. Agora cada conversa é processada uma mensagem por vez, na ordem de chegada.
- **Reagendamento sem horário.** Ao não haver horário na data escolhida, a conversa ficava presa no passo "período" e a próxima mensagem do cliente era lida como período. Agora volta ao passo "data".

## [3.29.0] - 2026-10-06
### Adicionado
- **Histórico de Conversas (WhatsApp):** Nova aba adicionada para listar o histórico de conversas atendidas pela Inteligência Artificial. Agora é possível ler as mensagens diretamente do CRM.
- **Controle de Ativação do Robô:** Possibilidade de desativar/reativar manualmente o robô para conversas específicas, e definição de reativação automática em horas (ex: após 24h).
- **Inteligência de Agendamento:** Filtro de "manhã vs tarde" nativo na API e restrição para mostrar apenas os horários rigorosamente dentro do plano de horário da clínica, minuto a minuto.

## [3.28.0] - 2026-10-05
### Adicionado
- **Aviso final + cancelamento automático.** Perto da hora do agendamento (padrão 3h antes), o bot manda um último aviso ao cliente avisando que, sem resposta, o horário será cancelado — e já avisa a profissional também. Se em 30 minutos (ajustável) ninguém agir (cliente não responde e a profissional não marca "Confirmado" na Agenda), o bot cancela de verdade e libera o horário. Agendamentos marcados em cima da hora não entram nessa regra. Quem está na Lista de Espera com procedimento/profissional compatível é avisado automaticamente que o horário abriu.
- Três novos campos em Configurações > WhatsApp: antecedência do aviso final, prazo até cancelar, e os textos das três mensagens novas (aviso final, cancelamento automático, lista de espera).

## [3.27.0] - 2026-10-04
### Adicionado
- **Aviso de "não confirmou" para a profissional.** Se o cliente for lembrado do agendamento do dia seguinte e não confirmar nem cancelar dentro de um prazo (padrão 3h, ajustável em Configurações), a profissional recebe um aviso pelo WhatsApp pra ligar e confirmar manualmente — fecha a lacuna entre "mandei o lembrete" e "ninguém respondeu e ela só descobre na hora".

## [3.26.0] - 2026-10-04
### Adicionado
- **Atendimento automático pelo WhatsApp ativado.** A IA agora interpreta a mensagem do cliente e, através do bot, agenda, remarca, cancela, informa preço de procedimento, confirma presença e avisa quando um pagamento foi informado — reaproveitando sempre a mesma agenda e as mesmas regras de conflito já usadas na tela.
- **Novos ajustes no card "WhatsApp" em Configurações:** profissional padrão oferecida pelo bot, horário do lembrete diário e o texto do lembrete (com variáveis `[nome]`, `[data]`, `[hora]`, `[procedimento]`) — tudo editável pela tela, sem precisar de um novo deploy.

## [3.25.0] - 2026-10-06
### Adicionado
- **API para o bot de WhatsApp agendar de verdade.** Três rotas novas e protegidas (`/api/bot/disponibilidade`, `/api/bot/agendamentos`, com criar/reagendar/cancelar) para o serviço de atendimento via WhatsApp consultar horários livres e criar/alterar agendamentos — sempre com a mesma checagem de conflito e bloqueio que a tela já usa, nunca uma lógica paralela.
- Campo `origem` do agendamento agora aparece no sistema (os vindos do WhatsApp ficam marcados `WHATSAPP_BOT`, o resto continua `ADMIN`), preparando o terreno para medir quantos agendamentos vêm de cada canal.

### Técnico
- A lógica de disponibilidade e conflito de horário, que só existia presa dentro da tela da Agenda, foi extraída para um módulo próprio (`lib/availability.ts`) reaproveitado tanto pela tela quanto pela API nova — elimina o risco de a Agenda e o WhatsApp decidirem coisas diferentes sobre o mesmo horário.

## [3.24.0] - 2026-10-03
### Adicionado
- **Central de Atendimento WhatsApp — infraestrutura (Sprint 1).** Primeira peça de um novo módulo que vai trazer atendimento automático pelo WhatsApp: identificação de clientes, agendamento, reagendamento, cancelamento e avisos para as profissionais. Nesta entrega: as tabelas novas no banco (contatos, conversas, mensagens, histórico de eventos) e um serviço dedicado, separado deste CRM, que fala com a Evolution API — sem duplicar a agenda nem o cadastro de clientes já existentes.
- **Novo card "WhatsApp" em Configurações.** Bot ativo/inativo, mensagem de boas-vindas, mensagem de fora do horário e o horário de atendimento de cada dia da semana agora são editáveis direto pela tela, sem precisar de um novo deploy toda vez que o texto ou o horário mudar. Mostra também o status da conexão da instância (por enquanto "desconectado", até a parte externa do WhatsApp ser configurada).
- Nova coluna `origem` em cada agendamento (preenchida como "ADMIN" para todos os existentes), preparando o terreno para medir, no futuro, quantos agendamentos vêm do WhatsApp.

## [3.23.0] - 2026-09-28
### Adicionado
- **Repetir Agendamento.** O modal de "Novo Agendamento" ganhou um campo para repetir o mesmo procedimento automaticamente — Semanalmente, a cada 2 semanas ou Mensalmente, por até 24 vezes. Útil para tratamentos com sessões recorrentes (ex: "toda terça por 6 semanas"). Cada repetição vira um agendamento comum, editável e excluível individualmente como qualquer outro.
- Se alguma data da série cair num horário já ocupado ou bloqueado, aquela ocorrência é pulada (não trava as demais) e o sistema avisa quais datas ficaram de fora e por quê.

## [3.22.0] - 2026-09-23
### Adicionado
- **Agenda Diária em colunas por profissional.** A visão "Dia" trocou de uma lista única para uma grade com uma coluna por profissional ativo, lado a lado, no estilo de sistemas de agenda de clínicas com equipe — igual em qualquer tamanho de tela, com rolagem horizontal por toque no celular. Clicar num horário vazio já pré-marca a profissional daquela coluna.
- Cada coluna ganhou uma cor de identificação própria no cabeçalho; os cards de agendamento continuam coloridos por procedimento, como já era.

### Corrigido
- **Conflito de horário e bloqueio agora são por profissional.** Antes, marcar um horário com uma profissional podia impedir marcar o mesmo horário com outra (o sistema tratava a agenda como um recurso só). Agora cada profissional tem sua própria checagem de conflito e de bloqueio — necessário para a grade em colunas fazer sentido.
- **Nome de profissional inconsistente nos agendamentos.** Um valor padrão errado no formulário ("Gabi Almeida", sem o "ela") vinha gravando agendamentos com um nome que não batia com o cadastro de usuário ("Gabriela Almeida") — 139 agendamentos antigos tinham esse valor e outros 118 estavam com o campo vazio. Corrigido o valor padrão e normalizados os registros antigos.

## [3.21.0] - 2026-09-20
### Adicionado
- **Bloqueio de horários na Agenda.** Agora dá para marcar um período em que a profissional não está disponível (folga, workshop, consulta médica) — parcial ou dia inteiro. O bloqueio aparece na timeline diária com um visual hachurado distinto dos agendamentos e some qualquer tentativa de marcar cliente em cima dele, tanto pelo clique no horário quanto editando a data/hora manualmente no formulário. Duas novas tabelas no banco (`bloqueios_agenda`, já nascendo com o mesmo acesso restrito a usuário autenticado adotado desde a v3.20.0).
- **Lista de Espera.** Novo painel para guardar clientes que não encontraram horário disponível (nome, telefone, procedimento e profissional desejados, observações). Cada entrada pode virar agendamento com um toque (pré-preenche o formulário de Novo Agendamento) ou ser removida da lista.
- **Menu de ações rápidas na Agenda (FAB).** No celular, o botão flutuante da Agenda agora expande em 3 ações — Novo Agendamento, Novo Bloqueio e Lista de Espera — em vez de abrir direto o formulário de agendamento. No computador, as mesmas três ações ganharam botões próprios ao lado do cabeçalho da Agenda.
- Preparado o layout da Agenda para respeitar a área segura do iPhone (notch/Dynamic Island e barra de gestos), para o novo menu de ações não ficar colado na borda da tela.

## [3.20.0] - 2026-09-15
### Segurança
- **CRÍTICO: fechado o acesso público ao banco de dados.** A migration `20260823000000_rls_authenticated.sql` (preparada desde a v3.12.0, nunca aplicada) ficava pendente de um pré-requisito que nunca foi feito: configurar `SUPABASE_JWT_SECRET` em produção. Até aqui, qualquer pessoa na internet com a chave anônima (pública, embutida no site) conseguia ler e gravar em todas as 11 tabelas do banco, incluindo `password_hash` da tabela `users` — exposição real de dados de cliente/paciente. Configurados em produção `SUPABASE_JWT_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` (esta última também obrigatória: sem ela o login inteiro dependia do fallback para a chave anônima) e aplicada a migration. Acesso ao banco agora exige o token assinado pelo servidor para quem tem sessão válida.
- **Corrigido bug que reabria a exposição mesmo após a migration acima.** Um `GRANT` de tabela inteira sempre vence um `REVOKE` de coluna feito depois no Postgres — por isso o `REVOKE` de `password_hash` da migration anterior nunca teve efeito de verdade. Nova migration `20260915000000_fix_users_password_hash_grant.sql` revoga tudo e regarante só as colunas seguras (mesma lista de `USER_PUBLIC_COLUMNS`). De caminho, restringe o `UPDATE` direto via REST às colunas que o app de fato usa (`status`, `commission_rate`), fechando uma via de auto-promoção a admin que reabriria o escalonamento de privilégio já corrigido na API pela v3.15.0.
- `POST /api/auth/seed` agora exige o header `x-setup-token` (comparado com `timingSafeEqual`, variável `SETUP_TOKEN`) e gera uma senha aleatória forte em vez da senha fixa `admin123`, devolvida uma única vez na resposta.

## [3.19.0] - 2026-08-24
### Adicionado
- **Motor genérico de Anamnese, expandido de 3 para 10 modelos.** Além de Limpeza de Pele e Microagulhamento (agora com listas de perguntas revisadas e ampliadas), entram Design de Sobrancelha com Henna, Acne, Clareamento de Manchas, Rejuvenescimento Facial, Depilação, Maquiagem, Manicure e Pedicure, e Reconstrução de Sobrancelhas. As 3 fichas antigas (cada uma um componente inteiro quase duplicado, cada uma reimplementando sua própria captura de assinatura) foram substituídas por um único formulário guiado por um registro central de modelos (`lib/anamneseTemplates.ts`) — inclusive a ficha "Microagulhamento Completo", retirada e substituída pela nova lista simples de Microagulhamento.
- **Toda pergunta Sim/Não ganhou uma caixa de observação sempre visível** — antes só aparecia condicionalmente quando a resposta era "Sim", e olhe lá só em 2 das 3 fichas antigas. Corrigido também um bug relacionado: uma ficha sem nenhuma descrição preenchida não deixava rastro no Histórico; agora toda ficha salva sempre vira um Protocolo.
- **Novo seletor de modelos agrupado por categoria** (Rosto & Pele, Sobrancelhas, Procedimentos Avançados, Corpo & Depilação, Beleza & Estética), substituindo os 3 botões fixos que não escalariam para 10 opções. Continua sendo possível preencher quantas fichas o cliente precisar ao longo do tempo — cada procedimento pode ter sua própria anamnese.
- **Assinatura da Anamnese vinculada ao Histórico do prontuário**, mesmo padrão já entregue para as sessões de tratamento: cada ficha salva mostra um link "Ver assinatura" no Protocolo correspondente, com o horário do aceite eletrônico.

### Corrigido
- Removido o selo de segurança falso "Documento autenticado via ICP-Brasil" que ainda existia no visualizador de documentos.
- Um documento de Anamnese antigo (ficha "Microagulhamento Completo", já retirada) aparecia em branco no visualizador — agora mostra uma leitura básica das respostas salvas.

### Testes
- 5 arquivos novos (registro de modelos, formulário genérico, visualizador de documentos) e um teste E2E completo: escolhe um modelo no seletor, responde perguntas com observação, desenha uma assinatura real, salva, e confere que ela aparece em Documentos e no Histórico — passando em desktop e iPad.

## [3.18.0] - 2026-08-24
### Adicionado
- **Assinatura vinculada ao Histórico do prontuário.** A assinatura de cada sessão (v3.17.0) ficava salva no banco mas invisível na consulta — só aparecia a assinatura da primeira ficha de anamnese. Agora, toda sessão registrada vira um Protocolo no Histórico com um link "Ver assinatura" (abre a imagem ampliada) ou, quando dispensada, o motivo registrado visível diretamente no card — mesmo sessões sem descrição (antes, uma sessão só com assinatura e sem descrição não gerava Protocolo nenhum).
- **Assinatura na exportação em PDF.** O PDF do plano de tratamento (Exportar PDF) ganhou uma seção "Sessões Realizadas": data, descrição, profissional responsável e a imagem da assinatura do cliente (ou o motivo da dispensa) de cada sessão, para consulta fora do sistema. A exportação agora busca as sessões sob demanda quando necessário, garantindo que o PDF sempre saia completo mesmo exportando direto da listagem.

### Corrigido
- Uma sessão registrada sem descrição (só com foto e/ou assinatura) não deixava nenhum rastro no Histórico do cliente. Agora todo fechamento de sessão gera um Protocolo, auditável com ou sem texto.

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
