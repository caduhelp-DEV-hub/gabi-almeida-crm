const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRefMatch = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/);
const projectRef = projectRefMatch[1];

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  const query = `UPDATE public.users SET password_hash = '${hash}', status = 'active' WHERE username = 'admin';`;
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    console.error('Erro:', res.status, await res.text());
    process.exit(1);
  }
  console.log('Senha do admin resetada para admin123');
}

main().catch(console.error);
