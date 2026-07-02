import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Cliente, PlanoTratamento } from '../types';

interface CompanyData {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
}

export function gerarPdfPlano(plano: PlanoTratamento, cliente: Cliente | undefined, companyData: CompanyData) {
  const doc = new jsPDF();
  const margemEsquerda = 14;
  let y = 18;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyData.nome, margemEsquerda, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${companyData.endereco}  |  ${companyData.telefone}  |  CNPJ: ${companyData.cnpj}`, margemEsquerda, y);
  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Orçamento de Tratamento — ${plano.id.slice(0, 8).toUpperCase()}`, margemEsquerda, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${cliente?.nome || plano.clienteNome || '—'}`, margemEsquerda, y);
  y += 5;
  if (cliente?.cpf) {
    doc.text(`CPF: ${cliente.cpf}`, margemEsquerda, y);
    y += 5;
  }
  if (cliente?.telefone) {
    doc.text(`Telefone: ${cliente.telefone}`, margemEsquerda, y);
    y += 5;
  }
  if (plano.titulo) {
    doc.text(`Objetivo: ${plano.titulo}`, margemEsquerda, y);
    y += 5;
  }
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [['Serviço', 'Qtde', 'Preço Unit.', 'Desconto', 'Subtotal']],
    body: plano.itens.map(item => [
      item.servicoNome,
      String(item.quantidade),
      `R$ ${item.precoUnitario.toFixed(2)}`,
      `R$ ${item.desconto.toFixed(2)}`,
      `R$ ${item.subtotal.toFixed(2)}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [80, 60, 55] },
    margin: { left: margemEsquerda, right: margemEsquerda }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFontSize(10);
  doc.text(`Desconto total: R$ ${plano.descontoTotal.toFixed(2)}`, margemEsquerda, finalY);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Valor Total: R$ ${plano.valorTotal.toFixed(2)}`, margemEsquerda, finalY + 8);

  let y2 = finalY + 18;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (plano.validadeOrcamento) {
    doc.text(`Validade do orçamento: ${new Date(plano.validadeOrcamento).toLocaleDateString('pt-BR')}`, margemEsquerda, y2);
    y2 += 6;
  }
  doc.text(`Status atual: ${plano.status}`, margemEsquerda, y2);
  y2 += 6;

  if (plano.observacoes) {
    doc.text('Observações:', margemEsquerda, y2);
    y2 += 5;
    const linhas = doc.splitTextToSize(plano.observacoes, 180);
    doc.text(linhas, margemEsquerda, y2);
    y2 += linhas.length * 5;
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Emitido em ${new Date().toLocaleDateString('pt-BR')}`, margemEsquerda, 285);

  doc.save(`orcamento-${(cliente?.nome || 'cliente').replace(/\s+/g, '-').toLowerCase()}-${plano.id.slice(0, 8)}.pdf`);
}
