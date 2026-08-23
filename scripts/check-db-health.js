// Diagnostico do banco: exposicao publica, volume de dados e atividade.
// Uso: npm run db:check
//
// Nao imprime nenhum dado de paciente. Apenas contagens e sim/nao.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Erro: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

// Tabelas que o frontend usa. `users` e a mais sensivel: guarda password_hash.
const TABELAS = [
  'users',
  'clientes',
  'agendamentos',
  'cobrancas',
  'servicos',
  'inventory',
  'despesas',
  'configuracoes_empresa',
  'mensagens_predefinidas',
  'planos_tratamento',
  'planos_tratamento_itens',
];

function headers(key) {
  return { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' };
}

/** Tenta ler 1 linha da tabela com a chave informada. */
async function tentarLer(tabela, key) {
  const url = `${SUPABASE_URL}/rest/v1/${tabela}?select=*&limit=1`;
  try {
    const res = await fetch(url, { headers: headers(key) });
    return { status: res.status, ok: res.ok, linhas: res.ok ? (await res.json()).length : 0 };
  } catch (err) {
    return { status: 0, ok: false, erro: err.message };
  }
}

/** Conta linhas sem trazer os dados (header Prefer: count=exact). */
async function contar(tabela, key) {
  const url = `${SUPABASE_URL}/rest/v1/${tabela}?select=*&limit=0`;
  try {
    const res = await fetch(url, { headers: { ...headers(key), Prefer: 'count=exact' } });
    if (!res.ok) return null;
    const range = res.headers.get('content-range'); // formato: 0-0/123
    const total = range && range.includes('/') ? range.split('/')[1] : null;
    return total === '*' ? null : Number(total);
  } catch {
    return null;
  }
}

async function main() {
  console.log(`\nProjeto: ${SUPABASE_URL}\n`);

  // ---------------------------------------------------------------
  console.log('== EXPOSICAO PUBLICA ==');
  console.log('O que a chave publica (visivel no codigo do site) consegue ler:\n');

  let expostas = 0;
  const senhaExposta = { valor: false };

  for (const tabela of TABELAS) {
    const r = await tentarLer(tabela, ANON_KEY);

    if (r.ok) {
      expostas++;
      console.log(`  [ABERTA]    ${tabela}`);

      if (tabela === 'users') {
        // Confere especificamente se o hash de senha vaza.
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=password_hash&limit=1`, {
          headers: headers(ANON_KEY),
        });
        if (res.ok) senhaExposta.valor = true;
      }
    } else if (r.status === 401 || r.status === 403 || r.status === 404) {
      console.log(`  [protegida] ${tabela}`);
    } else {
      console.log(`  [?]         ${tabela} (HTTP ${r.status}${r.erro ? ' - ' + r.erro : ''})`);
    }
  }

  console.log('');
  if (expostas === 0) {
    console.log(`  OK: nenhuma das ${TABELAS.length} tabelas responde a chave publica.`);
  } else {
    console.log(`  ATENCAO: ${expostas} de ${TABELAS.length} tabelas estao abertas ao publico.`);
  }
  if (senhaExposta.valor) {
    console.log('  CRITICO: a coluna password_hash da tabela users e legivel publicamente.');
  }

  // ---------------------------------------------------------------
  if (!SERVICE_KEY) {
    console.log('\n(SUPABASE_SERVICE_ROLE_KEY ausente - pulando volume e atividade)\n');
    return;
  }

  console.log('\n== VOLUME DE DADOS ==\n');
  for (const tabela of TABELAS) {
    const total = await contar(tabela, SERVICE_KEY);
    const rotulo = total === null ? 'indisponivel' : `${total} registro(s)`;
    console.log(`  ${tabela.padEnd(24)} ${rotulo}`);
  }

  // ---------------------------------------------------------------
  console.log('\n== ATIVIDADE DO BANCO ==\n');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/_heartbeat?select=pinged_at&limit=1`, {
      headers: headers(SERVICE_KEY),
    });
    if (res.ok) {
      const linhas = await res.json();
      if (linhas.length > 0 && linhas[0].pinged_at) {
        const ultimo = new Date(linhas[0].pinged_at);
        const dias = (Date.now() - ultimo.getTime()) / 86400000;
        console.log(`  Ultimo keepalive: ${ultimo.toLocaleString('pt-BR')} (${dias.toFixed(1)} dia(s) atras)`);
        if (dias > 6.5) {
          console.log('  ATENCAO: o cron de keepalive parece parado. Risco de pausa por inatividade.');
        }
      } else {
        console.log('  Tabela _heartbeat vazia.');
      }
    } else {
      console.log(`  Nao foi possivel ler _heartbeat (HTTP ${res.status}).`);
    }
  } catch (err) {
    console.log(`  Erro ao ler _heartbeat: ${err.message}`);
  }

  console.log('');
}

main().catch((err) => {
  console.error('Erro inesperado:', err);
  process.exit(1);
});
