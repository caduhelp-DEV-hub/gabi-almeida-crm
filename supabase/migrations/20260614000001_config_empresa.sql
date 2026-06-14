-- A tabela já existe com id = uuid
-- Inserir registro inicial caso não exista
INSERT INTO public.configuracoes_empresa (id, nome, cnpj, endereco, telefone) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Gabi Almeida Estética Avançada', '00.000.000/0001-00', 'São Paulo - SP', '(11) 99999-9999')
ON CONFLICT (id) DO NOTHING;
