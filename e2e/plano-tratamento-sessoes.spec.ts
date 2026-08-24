import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

/**
 * Verificacao de ponta a ponta da feature de sessoes do Plano de Tratamento:
 * cria um plano com 1 item de 2 sessoes, aprova, inicia o tratamento,
 * registra as 2 sessoes (a 1a assinada de verdade no canvas, a 2a dispensada
 * com motivo) e confere que:
 *  - as descricoes viraram Protocolos no prontuario do cliente
 *  - as fotos foram para a Galeria de Acompanhamento
 *  - a assinatura desenhada foi salva (url + timestamp + termo), sem selo
 *    de seguranca falso
 *  - dispensar a assinatura grava o motivo, sem assinatura_url
 *  - a 2a sessao (ultima contratada) auto-completa o item e o plano
 *  - a barra de estatisticas do prontuario reflete os dados reais
 *
 * Cria um cliente descartavel e apaga tudo ao final (cascade cuida do resto).
 */

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const chave = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cabecalhos = () => ({
  apikey: chave(),
  Authorization: `Bearer ${chave()}`,
  'Content-Type': 'application/json',
});

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAOUlEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvg1PoAABuYzUZQAAAABJRU5ErkJggg==';

let clienteId: string | null = null;
let servicoId: string | null = null;
let servicoNome = '';
let servicoCriadoAqui = false;

test.beforeAll(async () => {
  const nomeCliente = `AAA TESTE PLANO ${Math.random().toString(36).slice(2, 8).toUpperCase()} (apagar)`;
  const cr = await fetch(`${base()}/rest/v1/clientes`, {
    method: 'POST',
    headers: { ...cabecalhos(), Prefer: 'return=representation' },
    body: JSON.stringify({ nome: nomeCliente }),
  });
  const [cliente] = await cr.json();
  expect(cr.ok, `falha ao criar cliente de teste: ${JSON.stringify(cliente)}`).toBeTruthy();
  clienteId = cliente.id;

  const rs = await fetch(`${base()}/rest/v1/servicos?select=id,nome&limit=1`, { headers: cabecalhos() });
  const [servico] = await rs.json();
  if (servico) {
    servicoId = servico.id;
    servicoNome = servico.nome;
  } else {
    const cs = await fetch(`${base()}/rest/v1/servicos`, {
      method: 'POST',
      headers: { ...cabecalhos(), Prefer: 'return=representation' },
      body: JSON.stringify({ nome: 'ZZ Serviço de Teste', preco: 100, duracao: 30, categoria: 'Teste' }),
    });
    const [novo] = await cs.json();
    servicoId = novo.id;
    servicoNome = novo.nome;
    servicoCriadoAqui = true;
  }
});

test.afterAll(async () => {
  if (clienteId) {
    await fetch(`${base()}/rest/v1/clientes?id=eq.${clienteId}`, { method: 'DELETE', headers: cabecalhos() });
  }
  if (servicoCriadoAqui && servicoId) {
    await fetch(`${base()}/rest/v1/servicos?id=eq.${servicoId}`, { method: 'DELETE', headers: cabecalhos() });
  }
});

/** Fecha o alerta modal global que o app mostra apos quase toda acao (showAlert). */
async function fecharAlerta(page: import('@playwright/test').Page) {
  const ok = page.getByRole('button', { name: 'OK', exact: true });
  await ok.waitFor({ state: 'visible', timeout: 15_000 });
  await ok.click();
  await ok.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
}

// O objetivo aqui e verificar o fluxo de dados (sessao -> Protocolos/Galeria
// -> auto-conclusao), nao responsividade. Em telas estreitas o menu fica
// atras do hamburguer e a navegacao ate a lista de clientes muda de forma
// (mesmo criterio ja usado em prontuario-fotos.spec.ts).
test.skip(({ viewport }) => (viewport?.width ?? 0) < 700, 'Fluxo de telefone e diferente');

test('sessao registrada vira Protocolo e foto na Galeria, e auto-completa o item', async ({ page, context }) => {
  const r = await fetch(`${base()}/rest/v1/users?select=id,username,role&role=eq.admin&limit=1`, { headers: cabecalhos() });
  const [user] = await r.json();
  const cookie = jwt.sign({ userId: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '30m' });
  await context.addCookies([{ name: 'app_session', value: cookie, domain: 'localhost', path: '/' }]);

  await page.goto('/');
  await page.waitForSelector('aside.sidebar', { timeout: 60_000 });

  // Abaixo de 1024px (ex.: iPad) o menu fica atras do hamburguer.
  const menu = page.locator('button[aria-label="Abrir menu"]').first();
  if (await menu.isVisible().catch(() => false)) {
    await menu.click();
    await page.waitForTimeout(600);
  }
  await page.locator('#nav-planos-tratamento').click();
  await page.getByRole('button', { name: 'Novo Plano' }).click();

  // 1. Formulario: seleciona cliente e servico, quantidade = 2.
  // Escopado ao card "2. Serviços do plano" -- a sidebar tem outro botao com
  // o mesmo icone "add" ("Novo Agendamento") sempre visivel na tela.
  const cardServicos = page.locator('div').filter({ hasText: '2. Serviços do plano' }).last();
  await page.locator('select').first().selectOption(clienteId!);
  await cardServicos.locator('select').selectOption(servicoId!);
  await cardServicos.locator('button').click();

  const campoQtde = page.locator('table input[type="number"]').first();
  await campoQtde.fill('2');
  await page.getByRole('button', { name: 'Salvar Plano' }).click();
  await fecharAlerta(page); // "Plano de tratamento criado com sucesso!"

  // 2. Abre o plano recem-criado (primeira linha da lista, mais recente).
  await page.locator('table tbody tr').first().locator('button[title="Visualizar"]').click();
  await expect(page.getByRole('heading', { name: /Plano de Tratamento/i })).toBeVisible({ timeout: 10_000 });

  // 3. Aprova e inicia o tratamento.
  await page.getByRole('button', { name: 'Aprovar' }).click();
  await fecharAlerta(page); // "Plano marcado como Aprovado."
  await page.getByRole('button', { name: 'Iniciar Tratamento' }).click();
  await fecharAlerta(page); // "Plano marcado como Em tratamento."

  await expect(page.getByText('0/2 sessões').first()).toBeVisible();

  // 4. Registra a 1a sessao: dados + foto, avanca, DESENHA a assinatura de
  // verdade (Playwright roda em navegador real, com canvas de verdade -- ao
  // contrario do jsdom usado pelos testes unitarios).
  await page.getByRole('button', { name: 'Registrar Sessão' }).click();
  await expect(page.getByText(`${servicoNome} — Sessão 1/2`)).toBeVisible();
  await page.getByLabel(/Descrição do atendimento/i).fill('Primeira sessão de teste automatizado.');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByText('Adicionar foto(s)').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({ name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from(PIXEL.split(',')[1], 'base64') });
  await page.waitForTimeout(1000);

  await page.getByRole('button', { name: 'Avançar para Assinatura' }).click();
  await expect(page.getByRole('heading', { name: 'Assinatura do Cliente' })).toBeVisible();

  const botaoConfirmarAssinatura = page.getByRole('button', { name: 'Confirmar Assinatura' });
  await expect(botaoConfirmarAssinatura).toBeDisabled();

  const canvas = page.locator('canvas');
  const caixaCanvas = await canvas.boundingBox();
  await page.mouse.move(caixaCanvas!.x + 20, caixaCanvas!.y + 20);
  await page.mouse.down();
  await page.mouse.move(caixaCanvas!.x + 80, caixaCanvas!.y + 60, { steps: 5 });
  await page.mouse.move(caixaCanvas!.x + 40, caixaCanvas!.y + 90, { steps: 5 });
  await page.mouse.up();

  await expect(botaoConfirmarAssinatura).toBeEnabled();
  await botaoConfirmarAssinatura.click();
  await fecharAlerta(page); // "Sessão registrada com sucesso!"

  await expect(page.getByText('1/2 sessões').first()).toBeVisible({ timeout: 10_000 });

  // 5. Confere no banco: virou Protocolo (historico), foto (fotos_evolucao),
  // e a assinatura foi de fato salva -- com dado real, sem selo de seguranca
  // falso (o card antigo "ICP-Brasil / IP fixo" foi removido).
  const check1 = await fetch(`${base()}/rest/v1/clientes?id=eq.${clienteId}&select=historico,fotos_evolucao`, { headers: cabecalhos() });
  const [reg1] = await check1.json();
  expect(reg1.historico?.some((h: any) => h.description === 'Primeira sessão de teste automatizado.')).toBe(true);
  expect(reg1.fotos_evolucao?.length).toBeGreaterThan(0);

  const itemResp = await fetch(
    `${base()}/rest/v1/planos_tratamento_itens?select=id&servico_id=eq.${servicoId}&order=criado_em.desc&limit=1`,
    { headers: cabecalhos() }
  );
  const [itemDoTeste] = await itemResp.json();

  const sessao1Check = await fetch(
    `${base()}/rest/v1/planos_tratamento_sessoes?select=assinatura_url,assinatura_aceite_em,assinatura_termo,assinatura_dispensada_motivo&item_id=eq.${itemDoTeste.id}&numero_sessao=eq.1`,
    { headers: cabecalhos() }
  );
  const [sessao1] = await sessao1Check.json();
  expect(sessao1.assinatura_url, 'a assinatura desenhada deveria ter sido salva').toBeTruthy();
  expect(sessao1.assinatura_aceite_em).toBeTruthy();
  expect(sessao1.assinatura_termo).toContain(servicoNome);
  expect(sessao1.assinatura_dispensada_motivo).toBeNull();

  // 6. Registra a 2a (ultima) sessao dispensando a assinatura com motivo --
  // deve auto-completar o item mesmo sem assinatura.
  await page.getByRole('button', { name: 'Registrar Sessão' }).click();
  await expect(page.getByText(`${servicoNome} — Sessão 2/2`)).toBeVisible();
  await page.getByRole('button', { name: 'Avançar para Assinatura' }).click();
  await page.getByRole('button', { name: /não está presente/i }).click();
  await page.getByLabel(/Motivo/i).fill('Cliente já foi embora, atendimento registrado depois (teste automatizado).');
  await page.getByRole('button', { name: 'Registrar sem Assinatura' }).click();
  await fecharAlerta(page); // "Sessão registrada com sucesso!"

  await expect(page.getByText('2/2 sessões (100%)')).toBeVisible({ timeout: 10_000 });

  // 7. Confere que o item (e, sendo o unico, o plano) foi auto-concluido no banco.
  const itemId = (await (await fetch(
    `${base()}/rest/v1/planos_tratamento_itens?select=id,status&servico_id=eq.${servicoId}&order=criado_em.desc&limit=1`,
    { headers: cabecalhos() }
  )).json())[0];
  expect(itemId.status).toBe('Concluido');

  const sessao2Check = await fetch(
    `${base()}/rest/v1/planos_tratamento_sessoes?select=assinatura_url,assinatura_dispensada_motivo&item_id=eq.${itemId.id}&numero_sessao=eq.2`,
    { headers: cabecalhos() }
  );
  const [sessao2] = await sessao2Check.json();
  expect(sessao2.assinatura_url).toBeNull();
  expect(sessao2.assinatura_dispensada_motivo).toContain('teste automatizado');

  // 8. Barra de estatisticas do prontuario: abre o cliente e confere que os
  // 4 valores refletem o que acabou de acontecer (2 sessoes reais, plano
  // aprovado/em tratamento/concluido conta como investido, "Status" mostra
  // o status do plano em vez do antigo "Standard" fixo).
  const menu2 = page.locator('button[aria-label="Abrir menu"]').first();
  if (await menu2.isVisible().catch(() => false)) {
    await menu2.click();
    await page.waitForTimeout(600);
  }
  await page.locator('#nav-clientes').click();
  await page.waitForTimeout(1500);
  // O cliente ja fica selecionado desde a criacao do plano (onPlanoCriado
  // navega direto pro prontuario dele). Em telas < xl a lista some e o
  // detalhe ja aparece sozinho -- so clica na linha se ela estiver visivel
  // (telas largas, onde lista e detalhe convivem lado a lado).
  const linhaCliente = page.locator('div.cursor-pointer').filter({ hasText: 'AAA TESTE PLANO' }).first();
  if (await linhaCliente.isVisible().catch(() => false)) {
    const caixaLinha = await linhaCliente.boundingBox();
    await page.mouse.click(caixaLinha!.x + 30, caixaLinha!.y + caixaLinha!.height / 2);
  }
  await page.waitForTimeout(2000);

  // Cards da barra de estatisticas: escopados ao proprio card, ja que "02"
  // tambem aparece na data (24/08/2026) e "Concluido" aparece em <option> do
  // select de lancamento de procedimento.
  const cardProcedimentos = page.locator('div.bg-surface.rounded-xl.p-3').filter({ hasText: 'Procedimentos' });
  await expect(cardProcedimentos.getByText('Procedimentos', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(cardProcedimentos.getByText('02', { exact: true })).toBeVisible(); // 2 sessoes registradas

  const cardStatus = page.locator('div.bg-surface.rounded-xl.p-3').filter({ hasText: 'Status' });
  await expect(cardStatus.getByText('Status', { exact: true })).toBeVisible();
  await expect(cardStatus.getByText('Concluido')).toBeVisible();
});
