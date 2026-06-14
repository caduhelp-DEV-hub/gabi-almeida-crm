require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Fallback to .env if .env.local doesn't have it
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  require('dotenv').config({ path: '.env' });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function testCompany() {
  console.log('Fetching configuracoes_empresa...');
  let { data, error } = await supabase.from('configuracoes_empresa').select('*');
  console.log('Fetch Result:', data, error);

  if (data && data.length > 0) {
    console.log('Trying to update id:', data[0].id);
    const updateRes = await supabase.from('configuracoes_empresa').update({ nome: 'Gabi Almeida Estética Teste' }).eq('id', data[0].id);
    console.log('Update Result:', updateRes.data, updateRes.error);
  } else {
    console.log('No data found, attempting insert...');
    const insertRes = await supabase.from('configuracoes_empresa').insert({
      nome: 'Gabi Almeida Estética Avançada',
      cnpj: '00.000.000/0001-00',
      endereco: 'São Paulo - SP',
      telefone: '(11) 99999-9999'
    }).select();
    console.log('Insert Result:', insertRes.data, insertRes.error);
  }
}

testCompany();
