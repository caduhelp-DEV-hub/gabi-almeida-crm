import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import DocumentViewerModal from '../components/DocumentViewerModal';
import type { PatientDocument } from '../lib/types';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

afterEach(() => cleanup());

function docBase(overrides: Partial<PatientDocument>): PatientDocument {
  return {
    id: 'doc1',
    name: 'Ficha Anamnese - Teste',
    type: 'Anamnese',
    date: '24/08/2026',
    size: '0.1 MB',
    signed: true,
    ...overrides,
  };
}

describe('DocumentViewerModal', () => {
  it('renderiza o formato novo (motor generico) com pergunta, resposta e observação', () => {
    const doc = docBase({
      content: {
        templateId: 'acne',
        respostas: { q1: { valor: true, observacao: 'Usa lentes gelatinosas.' } },
        autorizaFotos: true,
      },
    });
    render(<DocumentViewerModal document={doc} onClose={() => {}} />);
    expect(screen.getByText('Utiliza lentes de contato?')).toBeInTheDocument();
    expect(screen.getByText('SIM')).toBeInTheDocument();
    expect(screen.getByText('"Usa lentes gelatinosas."')).toBeInTheDocument();
  });

  it('mostra diagnóstico físico e lesões de pele quando o modelo os define', () => {
    const doc = docBase({
      content: {
        templateId: 'limpeza-pele',
        respostas: {},
        diagnosticoFisico: { oleosidade: 'Normal' },
        lesoesPele: ['Millium', 'Rugas'],
        autorizaFotos: false,
      },
    });
    render(<DocumentViewerModal document={doc} onClose={() => {}} />);
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Millium')).toBeInTheDocument();
    expect(screen.getByText('Rugas')).toBeInTheDocument();
  });

  it('continua renderizando documentos antigos das 2 fichas simples retiradas (formato healthToggles)', () => {
    const doc = docBase({
      content: {
        healthToggles: { 'Utiliza lentes de contato?': true },
        healthDetails: {},
        oleosidade: 'Seborreica',
        selectedSkinProblems: ['Comedão'],
      },
    });
    render(<DocumentViewerModal document={doc} onClose={() => {}} />);
    expect(screen.getByText('Utiliza lentes de contato?')).toBeInTheDocument();
    expect(screen.getByText('Seborreica')).toBeInTheDocument();
    expect(screen.getByText('Comedão')).toBeInTheDocument();
  });

  it('não mostra em branco um documento antigo da ficha "Microagulhamento Completo" já retirada', () => {
    const doc = docBase({
      content: {
        saude: { doenca: true, alergias: false },
        dermato: { acneAtiva: true },
      },
    });
    render(<DocumentViewerModal document={doc} onClose={() => {}} />);
    expect(screen.getByText('doenca')).toBeInTheDocument();
    expect(screen.getByText('alergias')).toBeInTheDocument();
    expect(screen.getByText('acneAtiva')).toBeInTheDocument();
  });

  it('nunca mostra o selo falso de certificação ICP-Brasil, em nenhum formato', () => {
    const formatos: PatientDocument[] = [
      docBase({ content: { templateId: 'acne', respostas: {}, autorizaFotos: false }, signatureBase64: 'data:image/png;base64,abc' }),
      docBase({ content: { healthToggles: {} } }),
      docBase({ content: { saude: {} } }),
      docBase({ type: 'Contrato', content: undefined }),
    ];
    for (const doc of formatos) {
      const { unmount } = render(<DocumentViewerModal document={doc} onClose={() => {}} />);
      expect(screen.queryByText(/ICP-Brasil/i)).not.toBeInTheDocument();
      unmount();
    }
  });
});
