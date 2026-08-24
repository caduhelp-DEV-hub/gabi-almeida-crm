import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Devolve a data no formato AAAA-MM-DD usando o fuso do aparelho.
 *
 * NAO use `toISOString().split('T')[0]` para isso: o toISOString converte para
 * UTC e, no Brasil (UTC-3), qualquer horario a partir das 21h vira o dia
 * seguinte — agendamentos e despesas caiam no dia errado no fim do expediente.
 *
 * A montagem e manual de proposito, para nao depender de locale do sistema.
 */
export function dataLocalISO(data: Date = new Date()): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}
