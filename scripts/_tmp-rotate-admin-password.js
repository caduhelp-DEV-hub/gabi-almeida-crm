const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

async function main() {
  const newPassword = crypto.randomBytes(24).toString('base64url');
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ password_hash: passwordHash, status: 'active' })
    .eq('username', 'admin')
    .select('id, username, status');

  if (error) {
    console.error('Erro ao atualizar senha:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error('Nenhum usuario "admin" encontrado para atualizar.');
    process.exit(1);
  }

  console.log('Senha do admin trocada com sucesso.');
  console.log('Usuario:', data[0].username, '| status:', data[0].status);
  console.log('NOVA SENHA (copie agora, nao sera exibida de novo):', newPassword);
}

main().catch(err => {
  console.error('Falha inesperada:', err);
  process.exit(1);
});
