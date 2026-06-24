require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function testDespesas() {
  const { data, error } = await supabase.from('despesas').insert({
    descricao: 'Teste',
    valor: 100,
    data: new Date().toISOString()
  }).select();
  console.log('Despesas Insert:', data, error);
}

testDespesas();
