const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'signatures';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Erro: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

if (SERVICE_ROLE_KEY === 'COLE_AQUI_SUA_SERVICE_ROLE_KEY') {
  console.error('Erro: substitua o placeholder SUPABASE_SERVICE_ROLE_KEY no .env pela sua service role key real.');
  console.error('Obtenha em: Supabase Dashboard → Project Settings → API → service_role');
  process.exit(1);
}

async function main() {
  const listRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY }
  });

  if (!listRes.ok) {
    console.error('Erro ao listar buckets:', listRes.status, await listRes.text());
    process.exit(1);
  }

  const buckets = await listRes.json();
  const exists = buckets.find((b) => b.name === BUCKET_NAME);

  if (exists) {
    console.log(`Bucket "${BUCKET_NAME}" já existe.`);
    if (!exists.public) {
      console.log('Atualizando para público...');
      const updateRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET_NAME}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ public: true })
      });
      if (!updateRes.ok) {
        console.error('Erro ao atualizar bucket:', updateRes.status, await updateRes.text());
        process.exit(1);
      }
      console.log('Bucket atualizado para público.');
    }
    return;
  }

  const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: BUCKET_NAME, public: true })
  });

  if (!createRes.ok) {
    console.error('Erro ao criar bucket:', createRes.status, await createRes.text());
    process.exit(1);
  }

  console.log(`Bucket "${BUCKET_NAME}" criado com sucesso (público).`);
}

main().catch((err) => {
  console.error('Erro inesperado:', err);
  process.exit(1);
});
