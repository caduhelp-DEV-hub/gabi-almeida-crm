const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (fs.existsSync('.env')) {
  const envText = fs.readFileSync('.env', 'utf-8');
  envText.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');
      process.env[key] = val;
    }
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  console.log('--- Verificando novas tabelas em Português ---');
  for (const table of ['clientes', 'agendamentos', 'servicos', 'cobrancas', 'despesas', 'mensagens_pre_definidas', 'comandas', 'produtos_estoque', 'funcionarios']) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`Tabela: ${table} | Qtd: ${data ? data.length : 0} | Erro:`, error?.message || 'Nenhum');
  }
}

check();
