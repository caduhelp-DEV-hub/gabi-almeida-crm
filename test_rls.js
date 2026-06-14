require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function testUpdate() {
  const { data, error } = await supabase.from('configuracoes_empresa').update({ nome: 'Gabi Almeida Estética Teste RLS' }).eq('id', '280bea15-992e-4fa4-a745-2430f281e3d2').select();
  console.log('Update Result:', data, error);
}

testUpdate();
