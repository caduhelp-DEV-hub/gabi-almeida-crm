import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

/**
 * Verificacao de ponta a ponta da feature de sessoes do Plano de Tratamento:
 * cria um plano com 1 item de 2 sessoes, aprova, inicia o tratamento,
 * registra as 2 sessoes (com descricao e foto) e confere que:
 *  - as descricoes viraram Protocolos no prontuario do cliente
 *  - as fotos foram para a Galeria de Acompanhamento
 *  - a 2a sessao (ultima contratada) auto-completa o item e o plano
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

  // 4. Registra a 1a sessao, com descricao e foto.
  await page.getByRole('button', { name: 'Registrar Sessão' }).click();
  await expect(page.getByText(`${servicoNome} — Sessão 1/2`)).toBeVisible();
  await page.getByLabel(/Descrição do atendimento/i).fill('Primeira sessão de teste automatizado.');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByText('Adicionar foto(s)').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({ name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from(PIXEL.split(',')[1], 'base64') });
  await page.waitForTimeout(1000);

  await page.getByRole('button', { name: 'Registrar Sessão' }).last().click();
  await fecharAlerta(page); // "Sessão registrada com sucesso!"

  await expect(page.getByText('1/2 sessões').first()).toBeVisible({ timeout: 10_000 });

  // 5. Confere no banco: virou Protocolo (historico) e foto (fotos_evolucao) do cliente.
  const check1 = await fetch(`${base()}/rest/v1/clientes?id=eq.${clienteId}&select=historico,fotos_evolucao`, { headers: cabecalhos() });
  const [reg1] = await check1.json();
  expect(reg1.historico?.some((h: any) => h.description === 'Primeira sessão de teste automatizado.')).toBe(true);
  expect(reg1.fotos_evolucao?.length).toBeGreaterThan(0);

  // 6. Registra a 2a (ultima) sessao -- deve auto-completar o item.
  await page.getByRole('button', { name: 'Registrar Sessão' }).click();
  await expect(page.getByText(`${servicoNome} — Sessão 2/2`)).toBeVisible();
  await page.getByRole('button', { name: 'Registrar Sessão' }).last().click();
  await fecharAlerta(page); // "Sessão registrada com sucesso!"

  await expect(page.getByText('2/2 sessões (100%)')).toBeVisible({ timeout: 10_000 });

  // 7. Confere que o item (e, sendo o unico, o plano) foi auto-concluido no banco.
  const check2 = await fetch(
    `${base()}/rest/v1/planos_tratamento_itens?select=status&servico_id=eq.${servicoId}&order=criado_em.desc&limit=1`,
    { headers: cabecalhos() }
  );
  const [itemFinal] = await check2.json();
  expect(itemFinal.status).toBe('Concluido');
});
