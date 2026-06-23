# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

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
