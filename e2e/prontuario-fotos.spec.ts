import { test, expect, Page, BrowserContext } from '@playwright/test';
import jwt from 'jsonwebtoken';

/**
 * Fotos do prontuario em aparelho de toque.
 *
 * Regressao do bug do iPad: as acoes de editar/apagar ficavam num overlay
 * `opacity-0 group-hover:opacity-100`. No Tailwind 4 o `hover:` so vale onde
 * existe mouse, entao no iPad elas nunca apareciam.
 *
 * Cria um paciente descartavel, testa nele e apaga no final. Nunca toca em
 * dados de paciente real.
 */

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const chave = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cabecalhos = () => ({
  apikey: chave(),
  Authorization: `Bearer ${chave()}`,
  'Content-Type': 'application/json',
});

// PNG 100x100 solido, suficiente para renderizar o cartao.
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAOUlEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvg1PoAABuYzUZQAAAABJRU5ErkJggg==';

// Prefixo AAA para o paciente cair no topo da lista ordenada por nome.
// O sufixo aleatorio evita que execucoes em paralelo se confundam.
let NOME_TESTE = '';
let pacienteId: string | null = null;

// Em telefone o prontuario tem um fluxo de navegacao proprio; o alvo aqui e tablet/desktop.
test.skip(({ viewport }) => (viewport?.width ?? 0) < 700, 'Fluxo de telefone e diferente');

test.beforeEach(async () => {
  NOME_TESTE = `AAA TESTE ${Math.random().toString(36).slice(2, 8).toUpperCase()} (apagar)`;
  const res = await fetch(`${base()}/rest/v1/clientes`, {
    method: 'POST',
    headers: { ...cabecalhos(), Prefer: 'return=representation' },
    body: JSON.stringify({
      nome: NOME_TESTE,
      fotos_evolucao: [{ id: 'teste-1', url: PIXEL, date: '01/01/2026', type: 'Evolução' }],
    }),
  });
  const corpo = await res.json();
  expect(res.ok, `falha ao criar paciente de teste: ${JSON.stringify(corpo)}`).toBeTruthy();
  pacienteId = corpo[0].id;
});

test.afterEach(async () => {
  if (!pacienteId) return;
  await fetch(`${base()}/rest/v1/clientes?id=eq.${pacienteId}`, {
    method: 'DELETE',
    headers: cabecalhos(),
  });
  pacienteId = null;
});

async function abrirProntuarioDeTeste(page: Page, context: BrowserContext) {
  const r = await fetch(`${base()}/rest/v1/users?select=id,username,role&role=eq.admin&limit=1`, {
    headers: cabecalhos(),
  });
  const [user] = await r.json();
  const cookie = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '30m' }
  );
  await context.addCookies([{ name: 'app_session', value: cookie, domain: 'localhost', path: '/' }]);

  await page.goto('/');
  await page.waitForSelector('aside.sidebar', { timeout: 60_000 });

  // Abaixo de 1024px o menu fica atras do hamburguer.
  const menu = page.locator('button[aria-label="Abrir menu"]').first();
  if (await menu.isVisible().catch(() => false)) {
    await menu.click();
    await page.waitForTimeout(600);
  }
  await page.locator('#nav-clientes').click();
  await page.waitForTimeout(2500);

  const linha = page.locator('div.cursor-pointer').filter({ hasText: NOME_TESTE }).first();
  await linha.scrollIntoViewIfNeeded();
  const caixa = await linha.boundingBox();

  // Atencao: o NOME do paciente tem clique proprio (abre o menu rapido de
  // contato). Clicamos sobre o avatar, na ponta esquerda da linha.
  await page.mouse.click(caixa!.x + 30, caixa!.y + caixa!.height / 2);

  await expect(page.locator('h4', { hasText: 'Galeria de Acompanhamento' })).toBeVisible({ timeout: 30_000 });
}

/** scrollIntoViewIfNeeded nao alcanca containers internos; este alcanca. */
async function trazerParaVista(page: Page, seletor: string) {
  await page.locator(seletor).first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
}

test('acoes da foto ficam visiveis e alcancaveis sem hover', async ({ page, context }) => {
  await abrirProntuarioDeTeste(page, context);

  const editar = page.locator('button[aria-label="Editar data e observação da foto"]').first();
  const apagar = page.locator('button[aria-label="Apagar foto"]').first();

  await expect(editar).toBeVisible();
  await expect(apagar).toBeVisible();

  // O bug era exatamente este: opacidade 0 sem hover.
  for (const botao of [editar, apagar]) {
    const opacidade = await botao.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacidade, 'o botao nao pode estar transparente').toBeGreaterThan(0.9);
    const caixa = await botao.boundingBox();
    expect(caixa!.width, 'alvo de toque muito pequeno').toBeGreaterThanOrEqual(28);
    expect(caixa!.height, 'alvo de toque muito pequeno').toBeGreaterThanOrEqual(28);
  }
});

test('edita data, classificacao e observacao da foto', async ({ page, context }) => {
  await abrirProntuarioDeTeste(page, context);

  await trazerParaVista(page, 'button[aria-label="Editar data e observação da foto"]');
  await page.locator('button[aria-label="Editar data e observação da foto"]').first().click();
  await expect(page.getByRole('heading', { name: 'Editar Foto' })).toBeVisible();

  // A pagina tem outros formularios; tudo aqui e escopado ao modal.
  const modal = page.locator('div.fixed.inset-0').filter({ hasText: 'Editar Foto' }).last();
  await modal.locator('#foto-data').fill('2026-03-15');
  await modal.locator('#foto-obs').fill('Sessao de teste automatizado');
  await modal.getByRole('button', { name: 'Antes', exact: true }).click();

  // Em telas baixas o proprio modal rola; garante que o Salvar esta a vista.
  const salvar = modal.locator('button[type="submit"]');
  await salvar.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await salvar.click();

  // Confirma que gravou no banco no formato certo.
  await expect
    .poll(
      async () => {
        const res = await fetch(
          `${base()}/rest/v1/clientes?id=eq.${pacienteId}&select=fotos_evolucao`,
          { headers: cabecalhos() }
        );
        const [registro] = await res.json();
        return registro?.fotos_evolucao?.[0];
      },
      { timeout: 20_000 }
    )
    .toMatchObject({
      date: '15/03/2026',
      type: 'Antes',
      observacao: 'Sessao de teste automatizado',
    });
});

test('apaga a foto da galeria', async ({ page, context }) => {
  await abrirProntuarioDeTeste(page, context);

  await trazerParaVista(page, 'button[aria-label="Apagar foto"]');
  await page.locator('button[aria-label="Apagar foto"]').first().click();

  // A confirmacao do app e um modal proprio. Existe mais de um botao
  // "Confirmar" no DOM (outros modais fechados), entao pegamos so o visivel.
  const dialogo = page.locator('div.fixed.inset-0.z-50').last();
  const confirmar = dialogo.getByRole('button', { name: 'Confirmar', exact: true });
  await confirmar.click();

  await expect
    .poll(
      async () => {
        const res = await fetch(
          `${base()}/rest/v1/clientes?id=eq.${pacienteId}&select=fotos_evolucao`,
          { headers: cabecalhos() }
        );
        const [registro] = await res.json();
        return registro?.fotos_evolucao?.length ?? -1;
      },
      { timeout: 20_000 }
    )
    .toBe(0);
});
