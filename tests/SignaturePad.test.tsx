import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import React, { createRef } from 'react';
import SignaturePad, { type SignaturePadHandle } from '../components/ui/SignaturePad';

/**
 * jsdom nao implementa HTMLCanvasElement.getContext('2d') sem o pacote
 * "canvas" (nao instalado neste projeto de proposito, para nao adicionar
 * dependencia so por causa de teste). Os handlers do componente ja tratam
 * ctx === null com um `return` cedo, entao esses testes cobrem o que da pra
 * verificar honestamente neste ambiente: renderizacao, a API exposta via ref,
 * e que simular eventos de ponteiro nao quebra o componente -- nao testam o
 * traco em si sendo desenhado (isso exigiria canvas real, testado manualmente
 * e via Playwright, que roda em navegador de verdade).
 */

// jsdom nao implementa ResizeObserver; o componente usa um so pra reagir a
// mudanca de tamanho do container, que nao acontece em nenhum teste aqui.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

afterEach(() => cleanup());

describe('SignaturePad', () => {
  it('renderiza com a dica de "assine aqui" antes de qualquer traço', () => {
    render(<SignaturePad />);
    expect(screen.getByText(/Assine aqui/i)).toBeInTheDocument();
  });

  it('toDataURL() devolve null quando nada foi desenhado', () => {
    const ref = createRef<SignaturePadHandle>();
    render(<SignaturePad ref={ref} />);
    expect(ref.current?.toDataURL()).toBeNull();
  });

  it('clear() nao lança erro mesmo sem contexto de canvas real (jsdom)', () => {
    const ref = createRef<SignaturePadHandle>();
    render(<SignaturePad ref={ref} />);
    expect(() => ref.current?.clear()).not.toThrow();
  });

  it('nao quebra ao simular eventos de ponteiro (mouse/toque/caneta)', () => {
    const onDrawnChange = vi.fn();
    const { container } = render(<SignaturePad onDrawnChange={onDrawnChange} />);
    const canvas = container.querySelector('canvas')!;

    // jsdom nao implementa setPointerCapture/releasePointerCapture; simula
    // como um elemento real faria, sem lancar.
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    expect(() => {
      fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
      fireEvent.pointerMove(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
      fireEvent.pointerUp(canvas, { pointerId: 1 });
    }).not.toThrow();
  });

  it('aceita uma altura customizada', () => {
    const { container } = render(<SignaturePad height={200} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.height).toBe('200px');
  });
});
