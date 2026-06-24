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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Checking database tables...');
  
  // Check users table
  const { data: users, error: uErr } = await supabase.from('users').select('*');
  console.log('Users count:', users ? users.length : 0, 'Error:', uErr?.message || 'None');
  if (users && users.length > 0) {
    console.log('Users columns:', Object.keys(users[0]));
    console.log('Users data:', users);
  }

  // Check patients table
  const { data: patients, error: pErr } = await supabase.from('patients').select('*');
  console.log('Patients count:', patients ? patients.length : 0, 'Error:', pErr?.message || 'None');
  if (patients && patients.length > 0) {
    console.log('Patients data:', patients);
  }

  // Check appointments table
  const { data: appointments, error: aErr } = await supabase.from('appointments').select('*');
  console.log('Appointments count:', appointments ? appointments.length : 0, 'Error:', aErr?.message || 'None');
  if (appointments && appointments.length > 0) {
    console.log('Appointments columns:', Object.keys(appointments[0]));
    console.log('Appointments data:', appointments);
  }

  // Check transactions table
  const { data: transactions, error: tErr } = await supabase.from('transactions').select('*');
  console.log('Transactions count:', transactions ? transactions.length : 0, 'Error:', tErr?.message || 'None');
  if (transactions && transactions.length > 0) {
    console.log('Transactions data:', transactions);
  }
}

check();
