import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

/**
 * Verificacao de ponta a ponta do motor generico de Anamnese (10 modelos):
 * abre o seletor agrupado, escolhe um modelo, responde algumas perguntas
 * Sim/Não com observacao, desenha uma assinatura de verdade em canvas real,
 * salva e confere que:
 *  - o documento aparece na aba Documentos
 *  - a assinatura foi de fato salva (url + timestamp), sem selo de
 *    seguranca falso
 *  - o Protocolo correspondente aparece no Historico com a assinatura
 *    vinculada (link "Ver assinatura" abrindo o lightbox), nao so na aba
 *    Documentos
 *
 * Cria um cliente descartavel e apaga tudo ao final.
 */

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const chave = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cabecalhos = () => ({
  apikey: chave(),
  Authorization: `Bearer ${chave()}`,
  'Content-Type': 'application/json',
});

let clienteId: string | null = null;

test.beforeAll(async () => {
  const nomeCliente = `AAA TESTE ANAMNESE ${Math.random().toString(36).slice(2, 8).toUpperCase()} (apagar)`;
  const cr = await fetch(`${base()}/rest/v1/clientes`, {
    method: 'POST',
    headers: { ...cabecalhos(), Prefer: 'return=representation' },
    body: JSON.stringify({ nome: nomeCliente }),
  });
  const [cliente] = await cr.json();
  expect(cr.ok, `falha ao criar cliente de teste: ${JSON.stringify(cliente)}`).toBeTruthy();
  clienteId = cliente.id;
});

test.afterAll(async () => {
  if (clienteId) {
    await fetch(`${base()}/rest/v1/clientes?id=eq.${clienteId}`, { method: 'DELETE', headers: cabecalhos() });
  }
});

/** Fecha o alerta modal global que o app mostra apos quase toda acao (showAlert). */
async function fecharAlerta(page: import('@playwright/test').Page) {
  const ok = page.getByRole('button', { name: 'OK', exact: true });
  await ok.waitFor({ state: 'visible', timeout: 15_000 });
  await ok.click();
  await ok.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
}

// Fluxo de telefone abre o menu de forma diferente -- mesmo criterio ja
// usado em plano-tratamento-sessoes.spec.ts / prontuario-fotos.spec.ts.
test.skip(({ viewport }) => (viewport?.width ?? 0) < 700, 'Fluxo de telefone é diferente');

test('preenche uma ficha de anamnese, assina de verdade, e ela fica visível em Documentos e no Histórico', async ({ page }) => {
  const r = await fetch(`${base()}/rest/v1/users?select=id,username,role&role=eq.admin&limit=1`, { headers: cabecalhos() });
  const [user] = await r.json();
  const cookie = jwt.sign({ userId: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '30m' });
  await page.context().addCookies([{ name: 'app_session', value: cookie, domain: 'localhost', path: '/' }]);

  await page.goto('/');
  await page.waitForSelector('aside.sidebar', { timeout: 60_000 });

  const menu = page.locator('button[aria-label="Abrir menu"]').first();
  if (await menu.isVisible().catch(() => false)) {
    await menu.click();
    await page.waitForTimeout(600);
  }

  // 1. Abre o prontuario do cliente de teste.
  await page.locator('#nav-clientes').click();
  await page.waitForTimeout(1500);
  const linhaCliente = page.locator('div.cursor-pointer').filter({ hasText: 'AAA TESTE ANAMNESE' }).first();
  const caixaLinha = await linhaCliente.boundingBox();
  await page.mouse.click(caixaLinha!.x + 30, caixaLinha!.y + caixaLinha!.height / 2);
  await page.waitForTimeout(1000);

  // 2. Aba Anamnese: sem ficha ainda, abre o seletor agrupado.
  await page.getByRole('button', { name: 'Anamnese', exact: true }).click();
  await page.getByRole('button', { name: 'Escolher Modelo' }).click();
  await expect(page.getByRole('heading', { name: 'Escolher Modelo de Anamnese' })).toBeVisible();

  // Modelo com diagnostico/lesoes de pele preservado -- cobre o caminho mais completo.
  await page.getByRole('button', { name: /Limpeza de Pele/ }).click();
  await expect(page.getByRole('heading', { name: 'Limpeza de Pele' })).toBeVisible();

  // 3. Responde 2 perguntas Sim/Não com observação -- confere que a caixa
  // de observação já está visível antes de qualquer clique (pedido do
  // usuário: nunca mais condicionada a SIM).
  const primeiraPergunta = page.getByText('Utiliza lentes de contato?').locator('..').locator('..');
  await expect(primeiraPergunta.getByPlaceholder('Observação (opcional)')).toBeVisible();
  await primeiraPergunta.getByRole('button', { name: 'SIM' }).click();
  await primeiraPergunta.getByPlaceholder('Observação (opcional)').fill('Usa lentes gelatinosas.');

  const segundaPergunta = page.getByText('Fuma (tabagismo)?').locator('..').locator('..');
  await segundaPergunta.getByRole('button', { name: 'NÃO' }).click();

  // 4. Consentimento + assinatura real em canvas.
  await page.getByRole('checkbox', { name: /Confirmo o termo de limpeza de pele/i }).click();
  const canvas = page.locator('canvas');
  const caixaCanvas = await canvas.boundingBox();
  await page.mouse.move(caixaCanvas!.x + 20, caixaCanvas!.y + 20);
  await page.mouse.down();
  await page.mouse.move(caixaCanvas!.x + 80, caixaCanvas!.y + 60, { steps: 5 });
  await page.mouse.move(caixaCanvas!.x + 40, caixaCanvas!.y + 90, { steps: 5 });
  await page.mouse.up();

  const botaoSalvar = page.getByRole('button', { name: /Salvar Ficha de/i });
  await expect(botaoSalvar).toBeEnabled();
  await botaoSalvar.click();
  await fecharAlerta(page); // "Ficha de anamnese salva com sucesso!"

  // 5. Confere no banco: documento salvo com o formato novo e a assinatura de verdade.
  await expect.poll(async () => {
    const resp = await fetch(`${base()}/rest/v1/clientes?id=eq.${clienteId}&select=documents,historico`, { headers: cabecalhos() });
    const [reg] = await resp.json();
    return reg.documents?.length || 0;
  }, { timeout: 10_000 }).toBeGreaterThan(0);

  const check = await fetch(`${base()}/rest/v1/clientes?id=eq.${clienteId}&select=documents,historico`, { headers: cabecalhos() });
  const [reg] = await check.json();

  const doc = reg.documents.find((d: any) => d.type === 'Anamnese');
  expect(doc, 'documento de anamnese deveria ter sido salvo').toBeTruthy();
  expect(doc.content.templateId).toBe('limpeza-pele');
  expect(doc.content.respostas.q1).toEqual({ valor: true, observacao: 'Usa lentes gelatinosas.' });
  expect(doc.signed).toBe(true);
  expect(doc.signatureBase64, 'assinatura deveria ter sido salva').toBeTruthy();

  const protocolo = reg.historico.find((h: any) => h.title === 'Anamnese Preenchida');
  expect(protocolo, 'deveria ter criado um Protocolo no historico').toBeTruthy();
  expect(protocolo.assinaturaUrl, 'protocolo do historico deveria estar vinculado a assinatura').toBeTruthy();
  expect(protocolo.assinaturaAceiteEm).toBeTruthy();

  // 6. UI: aparece na aba Documentos.
  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
  await expect(page.getByText(/Ficha Anamnese - Limpeza de Pele/)).toBeVisible({ timeout: 10_000 });

  // 7. UI: aparece no Histórico com a assinatura vinculada (link + lightbox),
  // nao so na aba Documentos.
  await page.getByRole('button', { name: 'Histórico & Evolução' }).click();
  const cardProtocolo = page.locator('#protocolos-section div.relative.flex.gap-6.items-start')
    .filter({ hasText: 'Anamnese Preenchida' }).first();
  await expect(cardProtocolo.getByRole('button', { name: /Ver assinatura/i })).toBeVisible({ timeout: 10_000 });
  await cardProtocolo.getByRole('button', { name: /Ver assinatura/i }).click();
  await expect(page.getByAltText('Visualização ampliada')).toBeVisible({ timeout: 10_000 });
});
