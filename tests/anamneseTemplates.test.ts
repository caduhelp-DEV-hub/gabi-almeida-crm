import { describe, it, expect } from 'vitest';
import {
  ANAMNESE_TEMPLATES,
  ANAMNESE_CATEGORIAS,
  validarAnamneseTemplates,
  type AnamneseTemplateId,
} from '../lib/anamneseTemplates';

describe('ANAMNESE_TEMPLATES', () => {
  it('nao acusa nenhum erro de validacao no registro real', () => {
    expect(validarAnamneseTemplates()).toEqual([]);
  });

  it('tem os 10 modelos esperados', () => {
    const ids = Object.keys(ANAMNESE_TEMPLATES).sort();
    expect(ids).toEqual([
      'acne',
      'clareamento-manchas',
      'depilacao',
      'limpeza-pele',
      'manicure-pedicure',
      'maquiagem',
      'microagulhamento',
      'reconstrucao-sobrancelhas',
      'rejuvenescimento-facial',
      'sobrancelha-henna',
    ]);
  });

  it('contagem de perguntas bate com o que foi transcrito', () => {
    const contagens: Record<AnamneseTemplateId, number> = {
      'limpeza-pele': 26,
      microagulhamento: 16,
      'sobrancelha-henna': 11,
      acne: 21,
      'clareamento-manchas': 15,
      'rejuvenescimento-facial': 15,
      depilacao: 18,
      maquiagem: 12,
      'manicure-pedicure': 10,
      'reconstrucao-sobrancelhas': 13,
    };
    for (const [id, esperado] of Object.entries(contagens)) {
      expect(ANAMNESE_TEMPLATES[id as AnamneseTemplateId].questions.length, id).toBe(esperado);
    }
  });

  it('so limpeza-pele e microagulhamento tem diagnostico fisico e lesoes de pele', () => {
    const comSecoesExtras: AnamneseTemplateId[] = ['limpeza-pele', 'microagulhamento'];
    for (const id of Object.keys(ANAMNESE_TEMPLATES) as AnamneseTemplateId[]) {
      const template = ANAMNESE_TEMPLATES[id];
      if (comSecoesExtras.includes(id)) {
        expect(template.diagnosticoFisico, id).toBeDefined();
        expect(template.lesoesPele, id).toBeDefined();
      } else {
        expect(template.diagnosticoFisico, id).toBeUndefined();
        expect(template.lesoesPele, id).toBeUndefined();
      }
    }
  });

  it('nenhum id de pergunta se repete dentro do mesmo modelo', () => {
    for (const template of Object.values(ANAMNESE_TEMPLATES)) {
      const ids = template.questions.map(q => q.id);
      expect(new Set(ids).size, template.id).toBe(ids.length);
    }
  });

  it('detecta pergunta com label vazio', () => {
    const quebrado = {
      ...ANAMNESE_TEMPLATES,
      acne: { ...ANAMNESE_TEMPLATES.acne, questions: [{ id: 'q1', label: '' }] },
    };
    expect(validarAnamneseTemplates(quebrado)).toContain('acne: pergunta q1 com label vazio');
  });

  it('detecta id de pergunta duplicado', () => {
    const quebrado = {
      ...ANAMNESE_TEMPLATES,
      acne: { ...ANAMNESE_TEMPLATES.acne, questions: [{ id: 'q1', label: 'a' }, { id: 'q1', label: 'b' }] },
    };
    expect(validarAnamneseTemplates(quebrado)).toContain('acne: id de pergunta duplicado (q1)');
  });
});

describe('ANAMNESE_CATEGORIAS', () => {
  it('todo modelo aparece em exatamente 1 categoria', () => {
    const contagem = new Map<string, number>();
    for (const cat of ANAMNESE_CATEGORIAS) {
      for (const id of cat.templateIds) contagem.set(id, (contagem.get(id) || 0) + 1);
    }
    for (const id of Object.keys(ANAMNESE_TEMPLATES)) {
      expect(contagem.get(id), id).toBe(1);
    }
  });

  it('detecta modelo faltando em alguma categoria', () => {
    const categoriasQuebradas = ANAMNESE_CATEGORIAS.map(c => ({ ...c, templateIds: c.templateIds.filter(id => id !== 'acne') }));
    expect(validarAnamneseTemplates(ANAMNESE_TEMPLATES, categoriasQuebradas)).toContain('acne: aparece em 0 categorias (esperado 1)');
  });
});
