require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data } = await supabase.from('agendamentos').select('*').limit(10);
  console.log(data.map(d => ({ data: d.data, hora: d.hora })));
}
test();
