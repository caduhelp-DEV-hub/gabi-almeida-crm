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
const botaoSalvar = () => screen.getByRole('button', { name: /Registrar Sessão/i });

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

  it('permite registrar so com a data, sem descricao nem foto', async () => {
    const onSalvar = vi.fn();
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={onSalvar} />
    );
    fireEvent.click(botaoSalvar());

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1));
    expect(onSalvar.mock.calls[0][0].descricao).toBe('');
    expect(onSalvar.mock.calls[0][0].fotos).toEqual([]);
  });

  it('envia a descricao sem espacos nas pontas', async () => {
    const onSalvar = vi.fn();
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={onSalvar} />
    );

    fireEvent.change(campoDescricao(), { target: { value: '  Aplicação de botox, 20 unidades  ' } });
    fireEvent.click(botaoSalvar());

    await waitFor(() => expect(onSalvar).toHaveBeenCalled());
    expect(onSalvar.mock.calls[0][0].descricao).toBe('Aplicação de botox, 20 unidades');
  });

  it('permite trocar quem realizou o atendimento', async () => {
    const onSalvar = vi.fn();
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="Dra. Gabi" onClose={() => {}} onSalvar={onSalvar} />
    );

    fireEvent.change(campoProfissional(), { target: { value: 'Enfermeira Ana' } });
    fireEvent.click(botaoSalvar());

    await waitFor(() => expect(onSalvar).toHaveBeenCalled());
    expect(onSalvar.mock.calls[0][0].realizadoPor).toBe('Enfermeira Ana');
  });

  it('fecha ao clicar em Cancelar', () => {
    const onClose = vi.fn();
    render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={onClose} onSalvar={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('nao dispara dois envios em cliques repetidos', async () => {
    let liberar: () => void = () => {};
    const onSalvar = vi.fn(() => new Promise<void>((r) => { liberar = r; }));
    const { container } = render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={onSalvar} />
    );

    const submit = container.querySelector('button[type="submit"]')!;
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1));
    liberar();
  });

  it('reseta os campos ao trocar de item', () => {
    const { rerender } = render(
      <RegistrarSessaoModal item={ITEM} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={() => {}} />
    );
    fireEvent.change(campoDescricao(), { target: { value: 'texto que nao deve sobreviver' } });

    const outroItem: PlanoTratamentoItem = { ...ITEM, id: 'i2', servicoNome: 'Peeling' };
    rerender(
      <RegistrarSessaoModal item={outroItem} numeroSessao={1} nomeProfissionalPadrao="" onClose={() => {}} onSalvar={() => {}} />
    );

    expect(campoDescricao()).toHaveValue('');
  });
});
