import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Variáveis de ambiente não encontradas.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Criando tabela configuracoes_empresa...");
  
  // Create table via rpc or pure sql if possible. If not, maybe use postgres node or REST.
  // Actually, we can use supabase.rpc if a query executor exists, but typically we might just 
  // try to create the table using standard methods or assume we can insert if it doesn't exist?
  // Let's check if the table exists by trying to select from it.
  const { data, error } = await supabase.from('configuracoes_empresa').select('*').limit(1);
  
  if (error && error.code === '42P01') {
    console.log("Tabela não existe. Criar a tabela no Supabase via SQL interface é recomendado.");
    console.log(`
CREATE TABLE IF NOT EXISTS public.configuracoes_empresa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT 'Gabi Almeida Estética Avançada',
  cnpj TEXT NOT NULL DEFAULT '00.000.000/0001-00',
  endereco TEXT NOT NULL DEFAULT 'São Paulo - SP',
  telefone TEXT NOT NULL DEFAULT '(11) 99999-9999',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert initial row
INSERT INTO public.configuracoes_empresa (nome, cnpj, endereco, telefone) 
VALUES ('Gabi Almeida Estética Avançada', '00.000.000/0001-00', 'São Paulo - SP', '(11) 99999-9999')
ON CONFLICT DO NOTHING;
    `);
  } else if (!error) {
    console.log("Tabela já existe.", data);
  } else {
    console.error("Erro ao checar tabela:", error);
  }
}

run();
