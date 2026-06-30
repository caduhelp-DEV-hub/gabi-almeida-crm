// Aplica um único arquivo .sql de supabase/migrations/ no projeto via Management API.
// Uso: node --env-file=.env scripts/apply-migration.js supabase/migrations/<arquivo>.sql
const fs = require('fs');
const path = require('path');

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const migrationArg = process.argv[2];

if (!migrationArg) {
  console.error('Uso: node --env-file=.env scripts/apply-migration.js <caminho-do-arquivo.sql>');
  process.exit(1);
}

if (!ACCESS_TOKEN) {
  console.error('Erro: defina SUPABASE_ACCESS_TOKEN no .env');
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error('Erro: defina NEXT_PUBLIC_SUPABASE_URL no .env');
  process.exit(1);
}

const projectRefMatch = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/);
if (!projectRefMatch) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL inválida. Esperado formato https://<ref>.supabase.co');
  process.exit(1);
}

const projectRef = projectRefMatch[1];
const SQL_FILE = path.resolve(migrationArg);

if (!fs.existsSync(SQL_FILE)) {
  console.error(`Erro: arquivo SQL não encontrado em ${SQL_FILE}`);
  process.exit(1);
}

const query = fs.readFileSync(SQL_FILE, 'utf8');

async function main() {
  console.log(`Aplicando ${path.basename(SQL_FILE)} ao projeto ${projectRef}...`);

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Erro ao aplicar migration:', res.status, text);
    process.exit(1);
  }

  const result = await res.json();
  console.log('Migration aplicada com sucesso.');
  if (result && result.message) {
    console.log('Mensagem:', result.message);
  }
}

main().catch((err) => {
  console.error('Erro inesperado:', err);
  process.exit(1);
});
