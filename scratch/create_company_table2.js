import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('configuracoes_empresa').select('*').limit(1);
  
  if (error && error.code === '42P01') {
    console.log("CREATE TABLE sql command:");
    console.log(`
CREATE TABLE public.configuracoes_empresa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT 'Gabi Almeida Estética Avançada',
  cnpj TEXT NOT NULL DEFAULT '00.000.000/0001-00',
  endereco TEXT NOT NULL DEFAULT 'São Paulo - SP',
  telefone TEXT NOT NULL DEFAULT '(11) 99999-9999'
);

INSERT INTO public.configuracoes_empresa (nome, cnpj, endereco, telefone) 
VALUES ('Gabi Almeida Estética Avançada', '00.000.000/0001-00', 'São Paulo - SP', '(11) 99999-9999');

ALTER TABLE public.configuracoes_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated access" ON public.configuracoes_empresa FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow public read" ON public.configuracoes_empresa FOR SELECT TO anon USING (true);
    `);
  } else if (!error) {
    console.log("Tabela já existe.", data);
  } else {
    console.error("Erro ao checar tabela:", error);
  }
}

run();
