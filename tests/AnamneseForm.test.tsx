import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import AnamneseForm from '../components/AnamneseForm';
import { ANAMNESE_TEMPLATES } from '../lib/anamneseTemplates';

// SignaturePad usa canvas real, que o jsdom nao implementa (ver
// tests/SignaturePad.test.tsx). Aqui simulamos uma assinatura ja desenhada
// (onDrawnChange dispara true ao montar) pra poder testar o fluxo completo
// de salvar sem depender de canvas de verdade.
vi.mock('../components/ui/SignaturePad', () => ({
  default: React.forwardRef(function SignaturePadMock({ onDrawnChange }: any, ref: any) {
    React.useImperativeHandle(ref, () => ({
      toDataURL: () => 'data:image/png;base64,mock',
      clear: () => {},
    }));
    React.useEffect(() => { onDrawnChange?.(true); }, [onDrawnChange]);
    return <div data-testid="signature-pad-mock" />;
  }),
}));

afterEach(() => cleanup());

const botaoSalvar = () => screen.getByRole('button', { name: /Salvar Ficha de/i });

function darConsentimento() {
  fireEvent.click(screen.getByRole('checkbox', { name: ANAMNESE_TEMPLATES.acne.termoCheckboxLabel }));
}

describe('AnamneseForm', () => {
  it('toda pergunta Sim/Não já mostra a caixa de observação, mesmo sem clicar em nada', () => {
    render(<AnamneseForm templateId="acne" patientName="Maria" onCancel={() => {}} onSave={() => {}} />);
    const simNaoQuestions = ANAMNESE_TEMPLATES.acne.questions.filter(q => q.tipo !== 'texto');
    const caixasObservacao = screen.getAllByPlaceholderText('Observação (opcional)');
    expect(caixasObservacao.length).toBe(simNaoQuestions.length);
    caixasObservacao.forEach(caixa => expect(caixa).toBeEnabled());
  });

  it('pergunta do tipo texto não mostra botões SIM/NÃO, só um campo de resposta', () => {
    render(<AnamneseForm templateId="acne" patientName="Maria" onCancel={() => {}} onSave={() => {}} />);
    const perguntaAberta = ANAMNESE_TEMPLATES.acne.questions.find(q => q.tipo === 'texto')!;
    const linha = screen.getByText(perguntaAberta.label).closest('div')!;
    expect(within(linha).queryByRole('button', { name: 'SIM' })).not.toBeInTheDocument();
    expect(within(linha).getByPlaceholderText('Resposta (opcional)')).toBeInTheDocument();
  });

  it('mostra as perguntas do modelo escolhido', () => {
    render(<AnamneseForm templateId="limpeza-pele" patientName="Maria" onCancel={() => {}} onSave={() => {}} />);
    expect(screen.getByText(ANAMNESE_TEMPLATES['limpeza-pele'].questions[0].label)).toBeInTheDocument();
    // pergunta exclusiva do modelo Acne (perguntas iniciais coincidem entre varios modelos)
    expect(screen.queryByText('A acne piora em determinados períodos, como antes ou durante o ciclo menstrual? (Fator hormonal importante)')).not.toBeInTheDocument();
  });

  it('mostra diagnóstico físico e lesões de pele só para limpeza-pele/microagulhamento', () => {
    const { unmount } = render(<AnamneseForm templateId="limpeza-pele" patientName="Maria" onCancel={() => {}} onSave={() => {}} />);
    expect(screen.getByText('Diagnóstico Físico da Pele')).toBeInTheDocument();
    unmount();

    render(<AnamneseForm templateId="acne" patientName="Maria" onCancel={() => {}} onSave={() => {}} />);
    expect(screen.queryByText('Diagnóstico Físico da Pele')).not.toBeInTheDocument();
  });

  it('botão Salvar fica desabilitado até dar o consentimento', () => {
    render(<AnamneseForm templateId="acne" patientName="Maria" onCancel={() => {}} onSave={() => {}} />);
    expect(botaoSalvar()).toBeDisabled();
    darConsentimento();
    expect(botaoSalvar()).toBeEnabled();
  });

  it('salva com as respostas e a assinatura preenchidas', async () => {
    const onSave = vi.fn();
    render(<AnamneseForm templateId="acne" patientName="Maria" onCancel={() => {}} onSave={onSave} />);

    const primeiraPergunta = ANAMNESE_TEMPLATES.acne.questions[0];
    const linha = screen.getByText(primeiraPergunta.label).closest('div')!.parentElement!;
    fireEvent.click(within(linha).getByRole('button', { name: 'SIM' }));
    fireEvent.change(within(linha).getByPlaceholderText('Observação (opcional)'), { target: { value: 'Detalhe do teste' } });

    darConsentimento();
    fireEvent.click(botaoSalvar());

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const payload = onSave.mock.calls[0][0];
    expect(payload.respostas[primeiraPergunta.id]).toEqual({ valor: true, observacao: 'Detalhe do teste' });
    expect(payload.signatureBase64).toBe('data:image/png;base64,mock');
    expect(payload.diagnosticoFisico).toBeUndefined();
  });

  it('fecha ao clicar em Cancelar', () => {
    const onCancel = vi.fn();
    render(<AnamneseForm templateId="acne" patientName="Maria" onCancel={onCancel} onSave={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
