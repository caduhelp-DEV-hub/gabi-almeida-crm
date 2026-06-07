-- Migration script to adapt schema to Portuguese

-- Rename Patients
ALTER TABLE IF EXISTS public.patients RENAME TO clientes;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN name TO nome;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN details_avatar TO foto_detalhes;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN last_visit TO ultima_visita;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN total_spent TO total_gasto;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN procedures_count TO qtde_procedimentos;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN last_photo_date TO data_ultima_foto;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN allergies TO alergias;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN medications TO medicacoes;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN previous_procedures TO procedimentos_anteriores;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN evolution_notes TO notas_evolucao;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN before_photo TO foto_antes;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN after_photo TO foto_depois;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN evolution_photos TO fotos_evolucao;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN timeline TO historico;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN pronoun TO pronome;
ALTER TABLE IF EXISTS public.clientes RENAME COLUMN phone TO telefone;

-- Rename Appointments
ALTER TABLE IF EXISTS public.appointments RENAME TO agendamentos;
ALTER TABLE IF EXISTS public.agendamentos RENAME COLUMN patient_id TO cliente_id;
ALTER TABLE IF EXISTS public.agendamentos RENAME COLUMN patient_name TO cliente_nome;
ALTER TABLE IF EXISTS public.agendamentos RENAME COLUMN patient_avatar TO cliente_avatar;
ALTER TABLE IF EXISTS public.agendamentos RENAME COLUMN procedure TO procedimento;
ALTER TABLE IF EXISTS public.agendamentos RENAME COLUMN professional TO profissional;
ALTER TABLE IF EXISTS public.agendamentos RENAME COLUMN category TO categoria;
ALTER TABLE IF EXISTS public.agendamentos RENAME COLUMN notes TO notas;
ALTER TABLE IF EXISTS public.agendamentos RENAME COLUMN date TO data;
ALTER TABLE IF EXISTS public.agendamentos RENAME COLUMN time TO hora;

-- Rename Services
ALTER TABLE IF EXISTS public.services RENAME TO servicos;
ALTER TABLE IF EXISTS public.servicos RENAME COLUMN name TO nome;
ALTER TABLE IF EXISTS public.servicos RENAME COLUMN price TO preco;
ALTER TABLE IF EXISTS public.servicos RENAME COLUMN duration TO duracao;
ALTER TABLE IF EXISTS public.servicos RENAME COLUMN category TO categoria;

-- Rename Transactions to Cobrancas
ALTER TABLE IF EXISTS public.transactions RENAME TO cobrancas;
ALTER TABLE IF EXISTS public.cobrancas RENAME COLUMN date TO data;
ALTER TABLE IF EXISTS public.cobrancas RENAME COLUMN description TO descricao;
ALTER TABLE IF EXISTS public.cobrancas RENAME COLUMN category TO categoria;
ALTER TABLE IF EXISTS public.cobrancas RENAME COLUMN value TO valor;

-- Create Despesas table
CREATE TABLE IF NOT EXISTS public.despesas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  data text,
  descricao text,
  categoria text,
  status text,
  valor numeric,
  criado_em timestamp with time zone DEFAULT now()
);

-- Create Mensagens Pre-definidas table
CREATE TABLE IF NOT EXISTS public.mensagens_pre_definidas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text,
  conteudo text,
  gatilho text,
  criado_em timestamp with time zone DEFAULT now()
);
