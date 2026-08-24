export type AnamneseTemplateId =
  | 'limpeza-pele'
  | 'microagulhamento'
  | 'sobrancelha-henna'
  | 'acne'
  | 'clareamento-manchas'
  | 'rejuvenescimento-facial'
  | 'depilacao'
  | 'maquiagem'
  | 'manicure-pedicure'
  | 'reconstrucao-sobrancelhas';

export interface AnamneseQuestion {
  /** Estavel, atribuido na transcricao -- nunca derivado do texto do label (renomear o label nao pode orfanizar dado ja salvo). */
  id: string;
  label: string;
  /** 'texto' pra perguntas abertas (ex: "qual o motivo?") que nao cabem em Sim/Nao. Ausente = Sim/Nao (padrao). */
  tipo?: 'texto';
}

export interface RadioGroupConfig {
  key: string;
  label: string;
  options: string[];
}

export interface MultiSelectConfig {
  key: string;
  label: string;
  options: string[];
}

export interface AnamneseTemplate {
  id: AnamneseTemplateId;
  titulo: string;
  questions: AnamneseQuestion[];
  /** So limpeza-pele e microagulhamento -- preserva secao ja existente nessas 2 fichas. */
  diagnosticoFisico?: RadioGroupConfig[];
  /** So limpeza-pele e microagulhamento -- preserva secao ja existente nessas 2 fichas. */
  lesoesPele?: MultiSelectConfig;
  observacoesLabel: string;
  observacoesPlaceholder?: string;
  termoTitulo: string;
  termoTexto: string;
  termoCheckboxLabel: string;
}

const OBS_GERAIS_LABEL_PADRAO = 'Observações gerais';
const OBS_SAUDE_LABEL_PADRAO = 'Existe algum outro problema de saúde relevante que julgue necessário informar?';
const OBS_SAUDE_PLACEHOLDER_PADRAO = 'Ex: Doença autoimune leve, asma, rinite crônica...';

export const ANAMNESE_TEMPLATES: Record<AnamneseTemplateId, AnamneseTemplate> = {
  'limpeza-pele': {
    id: 'limpeza-pele',
    titulo: 'Limpeza de Pele',
    questions: [
      { id: 'q1', label: 'Utiliza lentes de contato?' },
      { id: 'q2', label: 'O seu intestino funciona regularmente?' },
      { id: 'q3', label: 'Bebe água com frequência?' },
      { id: 'q4', label: 'Costuma se expor muito ao sol?' },
      { id: 'q5', label: 'Mantém uma boa qualidade do sono?' },
      { id: 'q6', label: 'Fuma (tabagismo)?' },
      { id: 'q7', label: 'É portador(a) de marca-passo?' },
      { id: 'q8', label: 'Usa cremes ou loções no rosto?' },
      { id: 'q9', label: 'Toma anticoncepcional?' },
      { id: 'q10', label: 'Considera que tem uma boa alimentação?' },
      { id: 'q11', label: 'Tem epilepsia ou histórico de convulsões?' },
      { id: 'q12', label: 'Já fez algum tratamento facial anterior?' },
      { id: 'q13', label: 'Consome bebida alcoólica com frequência?' },
      { id: 'q14', label: 'Está no período menstrual?' },
      { id: 'q15', label: 'Possui alguma prótese no corpo ou no rosto?' },
      { id: 'q16', label: 'Tem alterações no coração?' },
      { id: 'q17', label: 'Está grávida ou suspeita que esteja?' },
      { id: 'q18', label: 'Pratica alguma atividade física?' },
      { id: 'q19', label: 'Possui algum tipo de alergia?' },
      { id: 'q20', label: 'Tem algum problema de pele diagnosticado?' },
      { id: 'q21', label: 'Já fez algum procedimento estético recente no rosto? (Ex: peeling, laser, microagulhamento, toxina botulínica)' },
      { id: 'q22', label: 'Usa algum ácido ou creme de tratamento na pele atualmente?' },
      { id: 'q23', label: 'Faz uso ou já usou o medicamento Roacutan (isotretinoína)?' },
      { id: 'q24', label: 'Tem histórico de queloides ou facilidade para cicatrizes grossas/saltadas?' },
      { id: 'q25', label: 'Sente a pele muito sensível, com vermelhidão frequente ou tem rosácea?' },
      { id: 'q26', label: 'Tem o hábito de usar protetor solar diariamente?' },
    ],
    diagnosticoFisico: [
      { key: 'oleosidade', label: 'Oleosidade', options: ['Alípica', 'Lipídica', 'Normal', 'Seborreica'] },
      { key: 'acnegrau', label: 'Acne Grau', options: ['I', 'II', 'III', 'IV'] },
      { key: 'espessura', label: 'Espessura', options: ['Espessa', 'Fina', 'Muito Fina'] },
      { key: 'hidratacao', label: 'Hidratação', options: ['Hidratada', 'Normal', 'Desidratada'] },
      { key: 'fototipo', label: 'Fototipo', options: ['I', 'II', 'III', 'IV', 'V', 'VI'] },
    ],
    lesoesPele: {
      key: 'lesoes',
      label: 'Lesões / Problemas de Pele',
      options: [
        'Millium', 'Comedão', 'Pápula', 'Pústula', 'Cistos', 'Rugas', 'Acromia', 'Hipercromia',
        'Foliculite', 'Queratose', 'Cicatriz', 'Atrofia', 'Xantelasma', 'Quelóide', 'Tumor',
        'Nevo Rubi', 'Nevo melanocítico', 'Verruga', 'Papiloma', 'Efélides', 'Bolhas', 'Abscesso',
        'Hirsutismo', 'Nódulos', 'Telangiectasias', 'Hipocromia', 'Marcas', 'Outra',
      ],
    },
    observacoesLabel: OBS_SAUDE_LABEL_PADRAO,
    observacoesPlaceholder: OBS_SAUDE_PLACEHOLDER_PADRAO,
    termoTitulo: 'Termo de Tratamento de Limpeza de Pele',
    termoTexto: 'Declaro que fui informado(a) minuciosamente dos benefícios, riscos e do protocolo previsto para o procedimento de Limpeza de Pele Estética. Autorizo o profissional esteta qualificado a realizar os procedimentos de extração mecânica de comedões, aplicação de loções de higienização, esfoliação e drenagem facial indicada. Relatei fielmente meu histórico de saúde e hábitos diários, aceitando as devidas responsabilidades pelo pós-procedimento.',
    termoCheckboxLabel: 'Confirmo o termo de limpeza de pele e autorizo o procedimento.',
  },

  microagulhamento: {
    id: 'microagulhamento',
    titulo: 'Microagulhamento',
    questions: [
      { id: 'q1', label: 'Utiliza lentes de contato?' },
      { id: 'q2', label: 'Tem epilepsia ou histórico de convulsões?' },
      { id: 'q3', label: 'Possui alguma alteração cardíaca ou é portador(a) de marca-passo?' },
      { id: 'q4', label: 'Possui alguma prótese metálica na face?' },
      { id: 'q5', label: 'Está grávida ou suspeita que esteja?' },
      { id: 'q6', label: 'Possui algum tipo de alergia (especialmente a anestésicos tópicos, metais ou látex)?' },
      { id: 'q7', label: 'Tem histórico de queloides ou facilidade para cicatrizes saltadas?' },
      { id: 'q8', label: 'Apresenta histórico de herpes labial recorrente? (Fundamental, pois o microagulhamento pode ativar o vírus)' },
      { id: 'q9', label: 'Faz uso de medicamentos anticoagulantes ou possui distúrbios de coagulação?' },
      { id: 'q10', label: 'Faz uso de Roacutan (isotretinoína) atualmente ou encerrou o tratamento há menos de 6 meses?' },
      { id: 'q11', label: 'Usa ácidos fortes na rotina de cuidados (ex: ácido retinoico, glicólico) nos últimos dias?' },
      { id: 'q12', label: 'Tem tendência a manchas (melasma ativo ou hiperpigmentação pós-inflamatória)?' },
      { id: 'q13', label: 'Possui alguma doença autoimune ativa ou diabetes descontrolada?' },
      { id: 'q14', label: 'Apresenta alguma infecção, lesão ativa ou acne inflamatória grave na área a ser tratada?' },
      { id: 'q15', label: 'Realizou algum procedimento estético recente na face (ex: laser, peeling profundo, toxina botulínica)?' },
      { id: 'q16', label: 'Tem o hábito rigoroso de utilizar protetor solar diariamente?' },
    ],
    diagnosticoFisico: [
      { key: 'oleosidade', label: 'Oleosidade', options: ['Alípica', 'Lipídica', 'Normal', 'Seborreica'] },
      { key: 'acnegrau', label: 'Acne Grau', options: ['I', 'II', 'III', 'IV'] },
      { key: 'espessura', label: 'Espessura', options: ['Espessa', 'Fina', 'Muito Fina'] },
      { key: 'hidratacao', label: 'Hidratação', options: ['Hidratada', 'Normal', 'Desidratada'] },
      { key: 'fototipo', label: 'Fototipo', options: ['I', 'II', 'III', 'IV', 'V', 'VI'] },
    ],
    lesoesPele: {
      key: 'lesoes',
      label: 'Lesões / Problemas de Pele',
      options: [
        'Millium', 'Comedão', 'Pápula', 'Pústula', 'Cistos', 'Rugas', 'Acromia', 'Hipercromia',
        'Foliculite', 'Queratose', 'Cicatriz', 'Atrofia', 'Xantelasma', 'Quelóide', 'Tumor',
        'Nevo Rubi', 'Nevo melanocítico', 'Verruga', 'Papiloma', 'Efélides', 'Bolhas', 'Abscesso',
        'Hirsutismo', 'Nódulos', 'Telangiectasias', 'Hipocromia', 'Marcas', 'Outra',
      ],
    },
    observacoesLabel: 'Existe algum outro problema de saúde relevante ou uso de medicamento contínuo que julgue necessário informar?',
    observacoesPlaceholder: 'Ex: uso de imunossupressores, corticoide, etc.',
    termoTitulo: 'Termo de Tratamento de Microagulhamento',
    termoTexto: 'Declaro que fui informado(a) minuciosamente dos benefícios, riscos e do protocolo previsto para o procedimento de Microagulhamento Estético. Autorizo o profissional esteta qualificado a realizar a perfuração controlada da pele com equipamento adequado (dermapen/dermaroller) para estímulo de colágeno. Relatei fielmente meu histórico de saúde e hábitos diários, aceitando as devidas responsabilidades pelo pós-procedimento.',
    termoCheckboxLabel: 'Confirmo o termo de microagulhamento e autorizo o procedimento.',
  },

  'sobrancelha-henna': {
    id: 'sobrancelha-henna',
    titulo: 'Design de Sobrancelha com Henna',
    questions: [
      { id: 'q1', label: 'Utiliza lentes de contato?' },
      { id: 'q2', label: 'Possui epilepsia ou histórico de convulsões?' },
      { id: 'q3', label: 'Tem o hábito de usar algum produto ou creme clareador na região da testa e sobrancelhas?' },
      { id: 'q4', label: 'Já realizou o teste de toque (alergia) para tintura ou henna anteriormente?' },
      { id: 'q5', label: 'Possui histórico de alergia a tinturas de cabelo, hennas, tintas temporárias ou colorações em geral?' },
      { id: 'q6', label: 'Já apresentou alguma reação alérgica a cosméticos, látex ou produtos químicos na pele?' },
      { id: 'q7', label: 'Possui pele sensível, dermatite atópica, eczema ou psoríase na região do rosto/sobrancelhas?' },
      { id: 'q8', label: 'Apresenta alguma lesão, corte, inflamação ou acne ativa na região das sobrancelhas?' },
      { id: 'q9', label: 'Faz uso de ácidos fortes no rosto (ex: ácido retinoico, glicólico) próximo à área dos olhos?' },
      { id: 'q10', label: 'Fez algum procedimento químico recente nas sobrancelhas (ex: brow lamination ou alisamento de fios)?' },
      { id: 'q11', label: 'Costuma tomar sol com muita frequência sem proteção solar na região?' },
    ],
    observacoesLabel: OBS_GERAIS_LABEL_PADRAO,
    termoTitulo: 'Termo de Design de Sobrancelha com Henna',
    termoTexto: 'Declaro que fui informado(a) minuciosamente dos benefícios, riscos e do protocolo previsto para o Design de Sobrancelhas com Henna. Autorizo o profissional a realizar a aplicação de henna e o design das sobrancelhas conforme combinado. Relatei fielmente meu histórico de saúde, hábitos e eventuais alergias, aceitando as devidas responsabilidades pelo pós-procedimento.',
    termoCheckboxLabel: 'Confirmo o termo de design de sobrancelha com henna e autorizo o procedimento.',
  },

  acne: {
    id: 'acne',
    titulo: 'Acne',
    questions: [
      { id: 'q1', label: 'Utiliza lentes de contato?' },
      { id: 'q2', label: 'Possui epilepsia ou histórico de convulsões?' },
      { id: 'q3', label: 'O seu intestino funciona regularmente? (A saúde intestinal tem forte ligação com inflamações na pele)' },
      { id: 'q4', label: 'Mantém o hábito de ingerir água com frequência?' },
      { id: 'q5', label: 'Considera que possui uma boa alimentação? (Consumo frequente de açúcar, leite e ultraprocessados)' },
      { id: 'q6', label: 'Costuma se expor muito ao sol?' },
      { id: 'q7', label: 'Fuma (tabagismo)?' },
      { id: 'q8', label: 'Está grávida ou suspeita que esteja?' },
      { id: 'q9', label: 'Toma anticoncepcional ou fez alguma alteração hormonal recente?' },
      { id: 'q10', label: 'Possui algum tipo de alergia (a cosméticos, medicamentos ou substâncias)?' },
      { id: 'q11', label: 'Tem algum problema de pele diagnosticado além da acne?' },
      { id: 'q12', label: 'A acne piora em determinados períodos, como antes ou durante o ciclo menstrual? (Fator hormonal importante)' },
      { id: 'q13', label: 'Qual é o grau predominante da sua acne atualmente? (Ex: cravos e espinhas leves, muitas pústulas inflamadas, ou nódulos/cistos profundos)', tipo: 'texto' },
      { id: 'q14', label: 'Já fez algum tratamento médico ou dermatológico para acne anteriormente? (Se sim, qual?)' },
      { id: 'q15', label: 'Faz uso ou já usou o medicamento Roacutan (isotretinoína)? Quando parou?' },
      { id: 'q16', label: 'Utiliza algum medicamento de uso contínuo (ex: corticoides, anabolizantes, antidepressivos, vitaminas do complexo B)? (Medicamentos que podem desencadear surtos de acne)' },
      { id: 'q17', label: 'Usa algum ácido ou dermocosmético específico para controle da oleosidade e acne na rotina diária?' },
      { id: 'q18', label: 'Costuma mexer, espremer ou cutucar as lesões de acne com frequência?' },
      { id: 'q19', label: 'Usa maquiagem diariamente? Ela é oil-free ou específica para pele acneica?' },
      { id: 'q20', label: 'Tem histórico de manchas escuras (hiperpigmentação) ou cicatrizes e marcas profundas deixadas por espinhas anteriores?' },
      { id: 'q21', label: 'Faz uso diário de protetor solar com toque seco ou específico para pele oleosa/acneica?' },
    ],
    observacoesLabel: 'Existe algum outro problema de saúde relevante, alteração hormonal diagnosticada (ex: SOP - Síndrome dos Ovários Policísticos) ou uso de medicamento que julgue necessário informar?',
    termoTitulo: 'Termo de Tratamento de Acne',
    termoTexto: 'Declaro que fui informado(a) minuciosamente dos benefícios, riscos e do protocolo previsto para o tratamento de Acne. Autorizo o profissional esteta qualificado a realizar os procedimentos indicados para o controle e tratamento da acne. Relatei fielmente meu histórico de saúde e hábitos diários, aceitando as devidas responsabilidades pelo pós-procedimento.',
    termoCheckboxLabel: 'Confirmo o termo de tratamento de acne e autorizo o procedimento.',
  },

  'clareamento-manchas': {
    id: 'clareamento-manchas',
    titulo: 'Clareamento de Manchas',
    questions: [
      { id: 'q1', label: 'Utiliza lentes de contato?' },
      { id: 'q2', label: 'Possui epilepsia ou histórico de convulsões?' },
      { id: 'q3', label: 'Está grávida, amamentando ou suspeita que esteja? (Fator crítico, pois muitas restrições de clareadores se aplicam neste período)' },
      { id: 'q4', label: 'Toma anticoncepcional ou fez alguma reposição hormonal recentemente? (Hormônios são grandes gatilhos para o melasma)' },
      { id: 'q5', label: 'Apresenta algum problema de tireoide ou alterações hormonais diagnosticadas?' },
      { id: 'q6', label: 'Possui histórico de alergias (a cosméticos, ácidos ou substâncias clareadoras)?' },
      { id: 'q7', label: 'Há quanto tempo essas manchas apareceram e qual foi o provável gatilho? (Ex: sol, gravidez, pílula anticoncepcional, acne ou queimadura)', tipo: 'texto' },
      { id: 'q8', label: 'As manchas pioram ou escurecem com o calor, luz visível (lâmpadas, telas) ou exposição ao sol?' },
      { id: 'q9', label: 'Já realizou algum tratamento clareador anterior? (Se sim, quais produtos, ácidos ou procedimentos foram usados e qual foi o resultado?)' },
      { id: 'q10', label: 'Usa algum ácido ou dermocosmético despigmentante na rotina atual? (Ex: hidroquinona, ácido glicólico, kójico, arbutin, Vitamina C)' },
      { id: 'q11', label: 'Costuma usar protetor solar diariamente e reaplicá-lo ao longo do dia? (Fator determinante para o sucesso de qualquer tratamento clareador)' },
      { id: 'q12', label: 'Tem o hábito de utilizar protetor solar com cor (base)? (A cor ajuda a proteger contra a luz visível, muito importante para o melasma)' },
      { id: 'q13', label: 'Trabalha em ambiente muito quente ou com exposição direta ao calor (ex: fogão, forno, luzes intensas)?' },
      { id: 'q14', label: 'Apresenta histórico de irritação ou efeito rebote (a mancha escurecer ainda mais após algum procedimento)?' },
      { id: 'q15', label: 'Fez algum procedimento estético recente na face (peeling, laser, microagulhamento)?' },
    ],
    observacoesLabel: 'Existe algum outro problema de saúde, uso de medicamento contínuo ou fator que julgue importante informar para a avaliação das manchas?',
    termoTitulo: 'Termo de Tratamento de Clareamento de Manchas',
    termoTexto: 'Declaro que fui informado(a) minuciosamente dos benefícios, riscos e do protocolo previsto para o tratamento de Clareamento de Manchas. Autorizo o profissional esteta qualificado a realizar os procedimentos e a aplicação de ativos despigmentantes indicados. Relatei fielmente meu histórico de saúde e hábitos diários, aceitando as devidas responsabilidades pelo pós-procedimento.',
    termoCheckboxLabel: 'Confirmo o termo de clareamento de manchas e autorizo o procedimento.',
  },

  'rejuvenescimento-facial': {
    id: 'rejuvenescimento-facial',
    titulo: 'Rejuvenescimento Facial',
    questions: [
      { id: 'q1', label: 'Utiliza lentes de contato?' },
      { id: 'q2', label: 'Possui epilepsia ou histórico de convulsões?' },
      { id: 'q3', label: 'Possui alguma alteração cardíaca ou é portador(a) de marca-passo?' },
      { id: 'q4', label: 'Está grávida ou suspeita que esteja?' },
      { id: 'q5', label: 'Possui algum tipo de alergia (a cosméticos, látex, metais ou anestésicos)?' },
      { id: 'q6', label: 'Tem algum problema de pele diagnosticado?' },
      { id: 'q7', label: 'Quais são os principais sinais de envelhecimento que mais lhe incomodam atualmente? (Ex: rugas dinâmicas/linhas de expressão, flacidez, perda de volume, rugas estáticas profundas, textura irregular)', tipo: 'texto' },
      { id: 'q8', label: 'Já realizou algum procedimento estético para rejuvenescimento anteriormente? (Se sim, quais? Ex: toxina botulínica, preenchimento, fios de sustentação, lasers, bioestimuladores de colágeno)' },
      { id: 'q9', label: 'Há quanto tempo realizou o último procedimento (principalmente toxina botulínica ou preenchimento)? (Fundamental para planejar novos procedimentos)', tipo: 'texto' },
      { id: 'q10', label: 'Possui alguma prótese metálica ou preenchimento definitivo (como PMMA) na face? (Altamente importante para evitar complicações com alguns aparelhos e técnicas)' },
      { id: 'q11', label: 'Faz uso de cremes, séruns ou ácidos anti-idade na rotina diária? (Ex: retinol, ácido hialurônico, vitamina C, peptídeos)' },
      { id: 'q12', label: 'Tem histórico de cicatrização queloideana ou facilidade para fibroses?' },
      { id: 'q13', label: 'Tem o hábito rigoroso de utilizar protetor solar diariamente?' },
      { id: 'q14', label: 'Fuma (tabagismo)? (O tabaco degrada o colágeno e acelera o envelhecimento da pele)' },
      { id: 'q15', label: 'Faz uso de medicamentos anticoagulantes ou de uso contínuo?' },
    ],
    observacoesLabel: 'Existe algum outro problema de saúde relevante ou uso de medicamento que julgue necessário informar para a nossa avaliação?',
    termoTitulo: 'Termo de Tratamento de Rejuvenescimento Facial',
    termoTexto: 'Declaro que fui informado(a) minuciosamente dos benefícios, riscos e do protocolo previsto para o tratamento de Rejuvenescimento Facial. Autorizo o profissional esteta qualificado a realizar os procedimentos indicados para o rejuvenescimento da pele. Relatei fielmente meu histórico de saúde e hábitos diários, aceitando as devidas responsabilidades pelo pós-procedimento.',
    termoCheckboxLabel: 'Confirmo o termo de rejuvenescimento facial e autorizo o procedimento.',
  },

  depilacao: {
    id: 'depilacao',
    titulo: 'Depilação',
    questions: [
      { id: 'q1', label: 'Utiliza lentes de contato?' },
      { id: 'q2', label: 'Possui epilepsia ou histórico de convulsões?' },
      { id: 'q3', label: 'Tem o hábito de ingerir água com frequência?' },
      { id: 'q4', label: 'Costuma se expor ao sol ou pegar sol na região a ser depilada recentemente?' },
      { id: 'q5', label: 'Fuma (tabagismo)?' },
      { id: 'q6', label: 'É portador(a) de marca-passo ou possui alguma alteração cardíaca?' },
      { id: 'q7', label: 'Está grávida ou suspeita que esteja?' },
      { id: 'q8', label: 'Pratica alguma atividade física?' },
      { id: 'q9', label: 'Possui algum tipo de alergia (a látex, resinas da cera, esparadrapos ou curativos)?' },
      { id: 'q10', label: 'Tem algum problema de pele diagnosticado?' },
      { id: 'q11', label: 'Faz uso de algum ácido (ex: ácido retinoico, glicólico, salicílico) ou clareador na região que será depilada? (Principal causa de arrancamento da pele/skin-peeling na depilação)' },
      { id: 'q12', label: 'Faz uso ou fez uso recente de Roacutan (isotretinoína) nos últimos 6 meses? (Contraindicação absoluta para cera, pois afina e fragiliza a pele)' },
      { id: 'q13', label: 'Utiliza medicamentos que sensibilizam ou afinam a pele (ex: antibióticos de uso contínuo, corticoides tópicos ou orais)?' },
      { id: 'q14', label: 'Apresenta histórico de foliculite grave ou pelos encravados recorrentes na região?' },
      { id: 'q15', label: 'Possui veias varicosas (varizes aparentes), microvasos ou fragilidade capilar acentuada na área do corpo a ser depilada?' },
      { id: 'q16', label: 'Apresenta alguma lesão, ferida, queimadura de sol, irritação ou infecção ativa no local da depilação?' },
      { id: 'q17', label: 'Realizou algum procedimento estético recente na face (ex: peeling, laser, microagulhamento)?' },
      { id: 'q18', label: 'Costuma usar protetor solar diariamente nas áreas expostas que são depiladas (especialmente no rosto)?' },
    ],
    observacoesLabel: 'Existe algum outro problema de saúde relevante ou uso de medicamento que julgue necessário informar para garantir a segurança da depilação?',
    termoTitulo: 'Termo de Depilação com Cera',
    termoTexto: 'Declaro que fui informado(a) minuciosamente dos benefícios, riscos e do protocolo previsto para o procedimento de Depilação com Cera. Autorizo o profissional a realizar a remoção dos pelos na região combinada. Relatei fielmente meu histórico de saúde e hábitos diários, aceitando as devidas responsabilidades pelo pós-procedimento.',
    termoCheckboxLabel: 'Confirmo o termo de depilação e autorizo o procedimento.',
  },

  maquiagem: {
    id: 'maquiagem',
    titulo: 'Maquiagem',
    questions: [
      { id: 'q1', label: 'Utiliza lentes de contato? (Fundamental para planejar a aplicação de produtos na região dos olhos e cílios postiços)' },
      { id: 'q2', label: 'Possui epilepsia ou histórico de convulsões?' },
      { id: 'q3', label: 'Tem a pele muito oleosa, seca, mista ou sensível?' },
      { id: 'q4', label: 'Apresenta algum tipo de alergia a cosméticos, fragrâncias, níquel, látex ou produtos químicos?' },
      { id: 'q5', label: 'Já teve alguma reação alérgica ou irritação com o uso de maquiagens anteriores?' },
      { id: 'q6', label: 'Possui histórico de herpes labial recorrente? (Principalmente para o momento de aplicação de batons e gloss)' },
      { id: 'q7', label: 'Apresenta alguma lesão, acne inflamada, corte ou dermatite ativa no rosto?' },
      { id: 'q8', label: 'Costuma usar protetor solar ou hidratante diariamente antes da maquiagem?' },
      { id: 'q9', label: 'Transpira excessivamente na região do rosto ou possui pele com tendência a rubor/vermelhidão fácil?' },
      { id: 'q10', label: 'Qual é a ocasião ou o evento para o qual a maquiagem será realizada? (Ex: casamento, formatura, festa diurna ou noturna)', tipo: 'texto' },
      { id: 'q11', label: 'Possui preferência por algum acabamento específico? (Ex: alta cobertura, efeito matte, pele glow/luminosa)', tipo: 'texto' },
      { id: 'q12', label: 'Quanto tempo você estima que precisará que a maquiagem dure intacta?', tipo: 'texto' },
    ],
    observacoesLabel: 'Existe algum outro problema de saúde, sensibilidade extrema ou detalhe importante sobre a sua pele que julgue necessário informar para a maquiagem?',
    termoTitulo: 'Termo de Aplicação de Maquiagem',
    termoTexto: 'Declaro que fui informado(a) sobre os produtos e técnicas que serão utilizados na aplicação da maquiagem. Relatei fielmente meu histórico de alergias e sensibilidade de pele, aceitando as devidas responsabilidades por eventuais reações não informadas.',
    termoCheckboxLabel: 'Confirmo o termo de maquiagem e autorizo o procedimento.',
  },

  'manicure-pedicure': {
    id: 'manicure-pedicure',
    titulo: 'Manicure e Pedicure',
    questions: [
      { id: 'q1', label: 'Possui o hábito de roer as unhas ou arrancar as cutículas?' },
      { id: 'q2', label: 'Apresenta algum tipo de alergia a esmaltes, bases, removedores, acetona, látex ou metais (como o alicate)?' },
      { id: 'q3', label: 'Já apresentou alguma reação alérgica a produtos de unhas anteriormente?' },
      { id: 'q4', label: 'Possui diabetes, problemas de circulação sanguínea ou edema (inchaço) nas pernas e pés?' },
      { id: 'q5', label: 'Apresenta histórico de unhas encravadas recorrentes?' },
      { id: 'q6', label: 'Possui alguma infecção, micose (fungos), micoses de unha (onicomicose), verrugas ou lesões ativas nas mãos ou nos pés?' },
      { id: 'q7', label: 'Toma algum medicamento de uso contínuo (especialmente anticoagulantes)?' },
      { id: 'q8', label: 'Costuma hidratar as mãos e os pés com frequência?' },
      { id: 'q9', label: 'Qual é o estado atual das suas unhas? (Ex: quebradiças, fracas, descamando ou saudáveis)', tipo: 'texto' },
      { id: 'q10', label: 'Possui preferência pelo uso de instrumentos tradicionais (alicate) ou prefere técnicas sem remoção total de cutícula?', tipo: 'texto' },
    ],
    observacoesLabel: 'Existe algum outro problema de saúde, sensibilidade ou condição médica relevante nas mãos ou nos pés que julgue necessário informar?',
    termoTitulo: 'Termo de Manicure e Pedicure',
    termoTexto: 'Declaro que fui informado(a) sobre os procedimentos de manicure e pedicure que serão realizados. Relatei fielmente meu histórico de saúde, alergias e condições das unhas e da pele das mãos e pés, aceitando as devidas responsabilidades pelo pós-procedimento.',
    termoCheckboxLabel: 'Confirmo o termo de manicure e pedicure e autorizo o procedimento.',
  },

  'reconstrucao-sobrancelhas': {
    id: 'reconstrucao-sobrancelhas',
    titulo: 'Reconstrução de Sobrancelhas',
    questions: [
      { id: 'q1', label: 'Possui epilepsia ou histórico de convulsões?' },
      { id: 'q2', label: 'Tem o hábito de usar algum produto, tônico ou creme clareador na região da testa e sobrancelhas?' },
      { id: 'q3', label: 'Possui histórico de alergia a tinturas, hennas, tintas temporárias ou colorações em geral?' },
      { id: 'q4', label: 'Já apresentou alguma reação alérgica a cosméticos, látex ou produtos químicos na pele?' },
      { id: 'q5', label: 'Possui pele sensível, dermatite atópica, eczema ou psoríase na região do rosto/sobrancelhas?' },
      { id: 'q6', label: 'Apresenta alguma lesão, corte, inflamação ou acne ativa na região das sobrancelhas?' },
      { id: 'q7', label: 'Faz uso de ácidos fortes no rosto (ex: ácido retinoico, glicólico) próximo à área dos olhos?' },
      { id: 'q8', label: 'Qual é o principal motivo das falhas ou da ausência de pelos nas suas sobrancelhas? (Ex: excesso de depilação com pinça no passado, falha genética, cicatriz, alopecia ou tricotilomania)', tipo: 'texto' },
      { id: 'q9', label: 'Há quanto tempo os pelos da região pararam de crescer ou apresentam falhas?', tipo: 'texto' },
      { id: 'q10', label: 'Tem o hábito de coçar, esfregar ou mexer constantemente nas sobrancelhas?' },
      { id: 'q11', label: 'Fez algum procedimento químico recente na região (ex: brow lamination, alisamento de fios ou micropigmentação)?' },
      { id: 'q12', label: 'Utiliza algum sérum de crescimento, minoxidil ou produto estimulante para os pelos atualmente?' },
      { id: 'q13', label: 'Faz uso de algum medicamento de uso contínuo ou possui alterações hormonais diagnosticadas que possam influenciar na queda de pelos?' },
    ],
    observacoesLabel: 'Existe algum outro problema de saúde, alergia ou uso de medicamento que julgue necessário informar para acompanharmos o tratamento de crescimento dos fios?',
    termoTitulo: 'Termo de Reconstrução de Sobrancelhas',
    termoTexto: 'Declaro que fui informado(a) minuciosamente dos benefícios, riscos e do protocolo previsto para o tratamento de Reconstrução de Sobrancelhas. Autorizo o profissional a realizar os procedimentos indicados para o crescimento e preenchimento visual das sobrancelhas. Relatei fielmente meu histórico de saúde e hábitos diários, aceitando as devidas responsabilidades pelo pós-procedimento.',
    termoCheckboxLabel: 'Confirmo o termo de reconstrução de sobrancelhas e autorizo o procedimento.',
  },
};

export interface AnamneseCategoria {
  id: string;
  label: string;
  templateIds: AnamneseTemplateId[];
}

export const ANAMNESE_CATEGORIAS: AnamneseCategoria[] = [
  { id: 'rosto', label: 'Rosto & Pele', templateIds: ['limpeza-pele', 'acne', 'clareamento-manchas', 'rejuvenescimento-facial'] },
  { id: 'sobrancelhas', label: 'Sobrancelhas', templateIds: ['sobrancelha-henna', 'reconstrucao-sobrancelhas'] },
  { id: 'avancados', label: 'Procedimentos Avançados', templateIds: ['microagulhamento'] },
  { id: 'corpo', label: 'Corpo & Depilação', templateIds: ['depilacao'] },
  { id: 'beleza', label: 'Beleza & Estética', templateIds: ['maquiagem', 'manicure-pedicure'] },
];

/** Validacao pura, testavel: ids duplicados, labels vazios, todo modelo em exatamente 1 categoria. */
export function validarAnamneseTemplates(
  templates: Record<AnamneseTemplateId, AnamneseTemplate> = ANAMNESE_TEMPLATES,
  categorias: AnamneseCategoria[] = ANAMNESE_CATEGORIAS
): string[] {
  const erros: string[] = [];
  const todosIds = Object.keys(templates) as AnamneseTemplateId[];

  for (const id of todosIds) {
    const template = templates[id];
    if (!template.questions.length) {
      erros.push(`${id}: sem nenhuma pergunta`);
      continue;
    }
    const idsVistos = new Set<string>();
    for (const q of template.questions) {
      if (!q.label.trim()) erros.push(`${id}: pergunta ${q.id} com label vazio`);
      if (idsVistos.has(q.id)) erros.push(`${id}: id de pergunta duplicado (${q.id})`);
      idsVistos.add(q.id);
    }
  }

  const contagemPorTemplate = new Map<AnamneseTemplateId, number>();
  for (const cat of categorias) {
    for (const id of cat.templateIds) {
      contagemPorTemplate.set(id, (contagemPorTemplate.get(id) || 0) + 1);
    }
  }
  for (const id of todosIds) {
    const contagem = contagemPorTemplate.get(id) || 0;
    if (contagem !== 1) erros.push(`${id}: aparece em ${contagem} categorias (esperado 1)`);
  }

  return erros;
}
