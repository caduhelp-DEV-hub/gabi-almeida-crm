import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import EditarFotoModal from '../components/modals/EditarFotoModal';
import type { EvolutionPhoto } from '../lib/types';

// next/image nao roda no jsdom; troca por <img> simples.
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

const FOTO: EvolutionPhoto = {
  id: 'f1',
  url: 'data:image/png;base64,AAA',
  date: '05/02/2026',
  type: 'Evolução',
};

const campoData = () => screen.getByLabelText(/Data da foto/i);
const campoObs = () => screen.getByLabelText(/Observação/i);
const botaoSalvar = () => screen.getByRole('button', { name: /Salvar/i });

afterEach(() => cleanup());

describe('EditarFotoModal', () => {
  it('nao renderiza nada quando nao ha foto selecionada', () => {
    const { container } = render(<EditarFotoModal foto={null} onClose={() => {}} onSalvar={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('carrega a data existente convertida para o formato do campo', () => {
    render(<EditarFotoModal foto={FOTO} onClose={() => {}} onSalvar={() => {}} />);
    // DD/MM/AAAA na base -> AAAA-MM-DD no <input type="date">
    expect(campoData()).toHaveValue('2026-02-05');
  });

  it('devolve a data em DD/MM/AAAA ao salvar', async () => {
    const onSalvar = vi.fn();
    render(<EditarFotoModal foto={FOTO} onClose={() => {}} onSalvar={onSalvar} />);

    fireEvent.change(campoData(), { target: { value: '2026-03-15' } });
    fireEvent.click(botaoSalvar());

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1));
    expect(onSalvar.mock.calls[0][0].date).toBe('15/03/2026');
  });

  it('salva a observacao digitada, sem espacos nas pontas', async () => {
    const onSalvar = vi.fn();
    render(<EditarFotoModal foto={FOTO} onClose={() => {}} onSalvar={onSalvar} />);

    fireEvent.change(campoObs(), { target: { value: '  3a sessao de microagulhamento  ' } });
    fireEvent.click(botaoSalvar());

    await waitFor(() => expect(onSalvar).toHaveBeenCalled());
    expect(onSalvar.mock.calls[0][0].observacao).toBe('3a sessao de microagulhamento');
  });

  it('permite trocar a classificacao da foto', async () => {
    const onSalvar = vi.fn();
    render(<EditarFotoModal foto={FOTO} onClose={() => {}} onSalvar={onSalvar} />);

    fireEvent.click(screen.getByRole('button', { name: 'Antes' }));
    fireEvent.click(botaoSalvar());

    await waitFor(() => expect(onSalvar).toHaveBeenCalled());
    expect(onSalvar.mock.calls[0][0].type).toBe('Antes');
  });

  it('mantem a data original quando o campo e esvaziado', async () => {
    const onSalvar = vi.fn();
    render(<EditarFotoModal foto={FOTO} onClose={() => {}} onSalvar={onSalvar} />);

    fireEvent.change(campoData(), { target: { value: '' } });
    fireEvent.click(botaoSalvar());

    await waitFor(() => expect(onSalvar).toHaveBeenCalled());
    expect(onSalvar.mock.calls[0][0].date).toBe('05/02/2026');
  });

  it('mostra a observacao ja gravada ao reabrir', () => {
    render(<EditarFotoModal foto={{ ...FOTO, observacao: 'Area da testa' }} onClose={() => {}} onSalvar={() => {}} />);
    expect(campoObs()).toHaveValue('Area da testa');
  });

  it('fecha ao clicar em Cancelar', () => {
    const onClose = vi.fn();
    render(<EditarFotoModal foto={FOTO} onClose={onClose} onSalvar={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('nao dispara dois salvamentos em cliques repetidos', async () => {
    let liberar: () => void = () => {};
    const onSalvar = vi.fn(() => new Promise<void>((r) => { liberar = r; }));
    const { container } = render(<EditarFotoModal foto={FOTO} onClose={() => {}} onSalvar={onSalvar} />);

    // O rotulo vira "Salvando...", entao buscamos pelo tipo do botao.
    const submit = container.querySelector('button[type="submit"]')!;
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1));
    liberar();
  });
});
