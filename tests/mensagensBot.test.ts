import { describe, it, expect } from 'vitest';
import { atualizarFrase, fraseAtiva, textoDaFrase, variaveisFaltando } from '../lib/mensagensBot';
import type { DefMensagemTela } from '../lib/types';

const def = (o: Partial<DefMensagemTela> = {}): DefMensagemTela => ({
  chave: 'x',
  grupo: 'g',
  rotulo: 'r',
  padrao: 'Padrão [lista]',
  variaveis: ['lista'],
  obrigatorias: ['lista'],
  opcional: false,
  legado: false,
  ...o
});

describe('atualizarFrase', () => {
  it('só guarda o que difere do padrão e remove a entrada quando volta ao padrão', () => {
    let m = atualizarFrase({}, 'a', { texto: 'Novo texto' }, 'Padrão');
    expect(m).toEqual({ a: { texto: 'Novo texto' } });
    m = atualizarFrase(m, 'a', { texto: 'Padrão' }, 'Padrão');
    expect(m).toEqual({});
  });

  it('desligar guarda ativo:false; religar remove', () => {
    let m = atualizarFrase({}, 'a', { ativo: false });
    expect(m).toEqual({ a: { ativo: false } });
    m = atualizarFrase(m, 'a', { ativo: true });
    expect(m).toEqual({});
  });

  it('restaurar padrão (texto undefined) não perde o desligado', () => {
    const m = atualizarFrase({ a: { texto: 'X', ativo: false } }, 'a', { texto: undefined });
    expect(m).toEqual({ a: { ativo: false } });
  });

  it('não altera o objeto original', () => {
    const original = { a: { texto: 'X' } };
    atualizarFrase(original, 'a', { ativo: false });
    expect(original).toEqual({ a: { texto: 'X' } });
  });
});

describe('leitura da frase', () => {
  it('texto mostrado = editado ou padrão', () => {
    expect(textoDaFrase(def())).toBe('Padrão [lista]');
    expect(textoDaFrase(def(), { texto: 'Meu [lista]' })).toBe('Meu [lista]');
  });

  it('frase essencial nunca aparece desligada; opcional respeita ativo:false', () => {
    expect(fraseAtiva(def({ opcional: false }), { ativo: false })).toBe(true);
    expect(fraseAtiva(def({ opcional: true }), { ativo: false })).toBe(false);
    expect(fraseAtiva(def({ opcional: true }))).toBe(true);
  });

  it('avisa as variáveis obrigatórias que faltam', () => {
    expect(variaveisFaltando(def(), 'Sem variável')).toEqual(['lista']);
    expect(variaveisFaltando(def(), 'Com [lista]')).toEqual([]);
  });
});
