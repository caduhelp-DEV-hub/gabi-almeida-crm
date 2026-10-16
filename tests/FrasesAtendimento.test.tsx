import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import FrasesAtendimento, { InterruptorFrase } from '../components/FrasesAtendimento';
import type { DefMensagemTela, MensagemFluxoConfig } from '../lib/types';

const catalogo: DefMensagemTela[] = [
  { chave: 'rodape_menu', grupo: 'Saudação e menu', rotulo: 'Rodapé das listas', padrao: 'Digite *0* para voltar ao menu.', variaveis: [], obrigatorias: [], opcional: true, legado: false },
  { chave: 'agendar_pergunta_servico', grupo: 'Agendar', rotulo: 'Pergunta do procedimento', padrao: 'Qual procedimento?\n[lista]', variaveis: ['lista'], obrigatorias: ['lista'], opcional: false, legado: false },
  { chave: 'boas_vindas', grupo: 'Saudação e menu', rotulo: 'Boas-vindas', padrao: 'Olá!', variaveis: [], obrigatorias: [], opcional: true, legado: true }
];

function Harness({ inicial = {} as Record<string, MensagemFluxoConfig>, onMudou }: { inicial?: Record<string, MensagemFluxoConfig>; onMudou?: (m: Record<string, MensagemFluxoConfig>) => void }) {
  const [valor, setValor] = useState(inicial);
  return (
    <FrasesAtendimento
      catalogo={catalogo}
      valor={valor}
      onChange={(m) => {
        setValor(m);
        onMudou?.(m);
      }}
    />
  );
}

describe('FrasesAtendimento', () => {
  it('lista as frases por grupo, sem as que têm campo próprio na tela (legado)', () => {
    render(<Harness />);
    expect(screen.getByText('Rodapé das listas')).toBeTruthy();
    expect(screen.getByText('Pergunta do procedimento')).toBeTruthy();
    expect(screen.queryByText('Boas-vindas')).toBeNull();
  });

  it('só frases opcionais têm interruptor; as essenciais mostram "só editar"', () => {
    render(<Harness />);
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
    expect(screen.getByText('essencial (só editar)')).toBeTruthy();
  });

  it('desligar uma frase opcional grava ativo:false e desabilita o texto', () => {
    let ultimo: Record<string, MensagemFluxoConfig> = {};
    render(<Harness onMudou={(m) => (ultimo = m)} />);
    fireEvent.click(screen.getByRole('button', { pressed: true }));
    expect(ultimo).toEqual({ rodape_menu: { ativo: false } });
    expect(screen.getByText('Desligada')).toBeTruthy();
    const area = screen.getByDisplayValue('Digite *0* para voltar ao menu.') as HTMLTextAreaElement;
    expect(area.disabled).toBe(true);
  });

  it('editar o texto grava só o que difere; "Restaurar texto padrão" volta ao padrão', () => {
    let ultimo: Record<string, MensagemFluxoConfig> = {};
    render(<Harness onMudou={(m) => (ultimo = m)} />);
    fireEvent.change(screen.getByDisplayValue('Digite *0* para voltar ao menu.'), { target: { value: 'Quer voltar? Digite 0' } });
    expect(ultimo).toEqual({ rodape_menu: { texto: 'Quer voltar? Digite 0' } });
    fireEvent.click(screen.getByText('Restaurar texto padrão'));
    expect(ultimo).toEqual({});
    expect(screen.getByDisplayValue('Digite *0* para voltar ao menu.')).toBeTruthy();
  });

  it('avisa quando o texto editado perde uma variável obrigatória', () => {
    render(<Harness inicial={{ agendar_pergunta_servico: { texto: 'Qual procedimento?' } }} />);
    expect(screen.getByText(/Falta \[lista\] neste texto/)).toBeTruthy();
  });

  it('sem catálogo publicado mostra o aviso em vez de uma lista vazia', () => {
    render(<FrasesAtendimento catalogo={[]} valor={{}} onChange={() => {}} />);
    expect(screen.getByText(/ainda não foi publicada pelo robô/)).toBeTruthy();
  });
});

describe('InterruptorFrase (frases com campo próprio)', () => {
  it('liga por padrão e desliga ao clicar', () => {
    let ultimo: Record<string, MensagemFluxoConfig> = {};
    const { container } = render(<InterruptorFrase chave="boas_vindas" valor={{}} onChange={(m) => (ultimo = m)} />);
    const botao = within(container).getByRole('button');
    expect(botao.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(botao);
    expect(ultimo).toEqual({ boas_vindas: { ativo: false } });
  });
});
