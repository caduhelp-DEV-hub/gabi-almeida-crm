import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import RegistrarSessaoModal from '../components/modals/RegistrarSessaoModal';
import type { PlanoTratamentoItem } from '../lib/types';

// next/image nao roda no jsdom; troca por <img> simples.
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

// SignaturePad usa canvas real, que o jsdom nao implementa (ver
// tests/SignaturePad.test.tsx para os testes dedicados a ele). Aqui so
// precisamos que o passo 2 renderize sem quebrar; a interacao de desenhar de
// fato e testada separadamente e manualmente/via Playwright.
vi.mock('../components/ui/SignaturePad', () => ({
  default: () => <div data-testid="signature-pad-mock" />,
}));

const ITEM: PlanoTratamentoItem = {
  id: 'i1',
  planoId: 'p1',
  servicoNome: 'Microagulhamento',
  precoUnitario: 200,
  quantidade: 5,
  desconto: 0,
  subtotal: 1000,
  status: 'Em andamento',
  ordem: 0,
};

const campoData = () => screen.getByLabelText(/Data do atendimento/i);
const campoDescricao = () => screen.getByLabelText(/Descrição do atendimento/i);
const campoProfissional = () => screen.getByLabelText(/Realizado por/i);
const botaoAvancar = () => screen.getByRole('button', { name: /Avançar para Assinatura/i });
const botaoConfirmarAssinatura = () => screen.getByRole('button', { name: /Confirmar Assinatura/i });

/** Vai do passo 1 (dados) para o passo 2 (assinatura). */
function avancarParaAssinatura() {
  fireEvent.click(botaoAvancar());
}

/** Passo 2: dispensa a assinatura informando um motivo, e confirma. */
function registrarSemAssinatura(motivo = 'Cliente já foi embora') {
  fireEvent.click(screen.getByRole('button', { name: /não está presente/i }));
  fireEvent.change(screen.getByLabelText(/Motivo/i), { target: { value: motivo } });
  fireEvent.click(screen.getByRole('button', { name: /Registrar sem Assinatura/i }));
}

afterEach(() => cleanup());

describe('RegistrarSessaoModal', () => {
  it('nao renderiza nada quando nao ha item selecionado', () => {
    const { container } = render(
      <RegistrarSessaoModal item={null} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra o servico e a numeracao da sessao no cabecalho', () => {
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={3} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={() => {}} />
    );
    expect(screen.getByText('Microagulhamento — Sessão 3/5')).toBeInTheDocument();
  });

  it('pre-preenche a data de hoje e o profissional padrao', () => {
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="Dra. Gabi" onClose={() => {}} onSalvar={() => {}} />
    );
    const hoje = new Date();
    const esperado = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    expect(campoData()).toHaveValue(esperado);
    expect(campoProfissional()).toHaveValue('Dra. Gabi');
  });

  it('sempre avança para a tela de assinatura antes de poder registrar', () => {
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={() => {}} />
    );
    // No passo 1 nao existe nenhum botao de "registrar" direto -- so avancar.
    expect(screen.queryByRole('button', { name: /Registrar Sessão$/i })).not.toBeInTheDocument();

    avancarParaAssinatura();
    expect(screen.getByRole('heading', { name: 'Assinatura do Cliente' })).toBeInTheDocument();
    expect(screen.getByTestId('signature-pad-mock')).toBeInTheDocument();
  });

  it('botao Confirmar Assinatura fica desabilitado sem nenhum traço desenhado', () => {
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={() => {}} />
    );
    avancarParaAssinatura();
    expect(botaoConfirmarAssinatura()).toBeDisabled();
  });

  it('exige um motivo para registrar sem assinatura', () => {
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={() => {}} />
    );
    avancarParaAssinatura();
    fireEvent.click(screen.getByRole('button', { name: /não está presente/i }));

    const botaoDispensar = screen.getByRole('button', { name: /Registrar sem Assinatura/i });
    expect(botaoDispensar).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Motivo/i), { target: { value: 'Cliente já foi embora' } });
    expect(botaoDispensar).toBeEnabled();
  });

  it('registra sem assinatura e envia o motivo, sem assinaturaBase64', async () => {
    const onSalvar = vi.fn();
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={onSalvar} />
    );
    avancarParaAssinatura();
    registrarSemAssinatura('Cliente já foi embora, atendimento registrado depois.');

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1));
    const dados = onSalvar.mock.calls[0][0];
    expect(dados.assinaturaDispensadaMotivo).toBe('Cliente já foi embora, atendimento registrado depois.');
    expect(dados.assinaturaBase64).toBeUndefined();
    expect(dados.descricao).toBe('');
    expect(dados.fotos).toEqual([]);
  });

  it('envia a descricao sem espacos nas pontas', async () => {
    const onSalvar = vi.fn();
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={onSalvar} />
    );
    fireEvent.change(campoDescricao(), { target: { value: '  Aplicação de botox, 20 unidades  ' } });
    avancarParaAssinatura();
    registrarSemAssinatura();

    await waitFor(() => expect(onSalvar).toHaveBeenCalled());
    expect(onSalvar.mock.calls[0][0].descricao).toBe('Aplicação de botox, 20 unidades');
  });

  it('permite trocar quem realizou o atendimento', async () => {
    const onSalvar = vi.fn();
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="Dra. Gabi" onClose={() => {}} onSalvar={onSalvar} />
    );
    fireEvent.change(campoProfissional(), { target: { value: 'Enfermeira Ana' } });
    avancarParaAssinatura();
    registrarSemAssinatura();

    await waitFor(() => expect(onSalvar).toHaveBeenCalled());
    expect(onSalvar.mock.calls[0][0].realizadoPor).toBe('Enfermeira Ana');
  });

  it('Voltar retorna ao passo 1 preservando os dados preenchidos', () => {
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={() => {}} />
    );
    fireEvent.change(campoDescricao(), { target: { value: 'Descrição preservada' } });
    avancarParaAssinatura();

    fireEvent.click(screen.getByRole('button', { name: /Voltar/i }));

    expect(campoDescricao()).toHaveValue('Descrição preservada');
  });

  it('fecha ao clicar em Cancelar no passo 1', () => {
    const onClose = vi.fn();
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={onClose} onSalvar={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('nao dispara dois envios em cliques repetidos ao dispensar a assinatura', async () => {
    let liberar: () => void = () => {};
    const onSalvar = vi.fn(() => new Promise<void>((r) => { liberar = r; }));
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={onSalvar} />
    );
    avancarParaAssinatura();
    fireEvent.click(screen.getByRole('button', { name: /não está presente/i }));
    fireEvent.change(screen.getByLabelText(/Motivo/i), { target: { value: 'Motivo qualquer' } });

    const botaoDispensar = screen.getByRole('button', { name: /Registrar sem Assinatura/i });
    fireEvent.click(botaoDispensar);
    fireEvent.click(botaoDispensar);

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1));
    liberar();
  });

  it('reseta os campos e volta ao passo 1 ao trocar de item', () => {
    const { rerender } = render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={() => {}} />
    );
    fireEvent.change(campoDescricao(), { target: { value: 'texto que nao deve sobreviver' } });
    avancarParaAssinatura();

    const outroItem: PlanoTratamentoItem = { ...ITEM, id: 'i2', servicoNome: 'Peeling' };
    rerender(
      <RegistrarSessaoModal item={outroItem} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={() => {}} />
    );

    // Voltou pro passo 1 (o campo de descricao so existe la) e resetado.
    expect(campoDescricao()).toHaveValue('');
  });
});
