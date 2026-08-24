import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Cliente, PlanoTratamento } from '../types';

interface CompanyData {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
}

/** Converte a URL da assinatura (Storage publico ou base64 inline) em data URI para o jsPDF poder desenhar. */
async function assinaturaParaDataUri(url: string): Promise<string | null> {
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function gerarPdfPlano(plano: PlanoTratamento, cliente: Cliente | undefined, companyData: CompanyData) {
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

  // Sessoes realizadas, cada uma acompanhada da assinatura que fechou o
  // atendimento (ou do motivo registrado quando ela foi dispensada) --
  // e o que torna o atendimento auditavel na exportacao, nao so no app.
  const sessoesComItem = plano.itens.flatMap(item => (item.sessoes || []).map(sessao => ({ item, sessao })));
  if (sessoesComItem.length > 0) {
    y2 += 4;
    if (y2 > 260) { doc.addPage(); y2 = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Sessões Realizadas', margemEsquerda, y2);
    y2 += 7;

    for (const { item, sessao } of sessoesComItem) {
      if (y2 > 255) { doc.addPage(); y2 = 20; }

      const dataSessaoFmt = sessao.dataSessao
        ? new Date(`${sessao.dataSessao}T00:00:00`).toLocaleDateString('pt-BR')
        : '—';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.servicoNome} — Sessão ${sessao.numeroSessao}/${item.quantidade} — ${dataSessaoFmt}`, margemEsquerda, y2);
      y2 += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (sessao.descricao) {
        const linhasDesc = doc.splitTextToSize(sessao.descricao, 180);
        doc.text(linhasDesc, margemEsquerda, y2);
        y2 += linhasDesc.length * 4.5;
      }
      if (sessao.realizadoPor) {
        doc.text(`Realizado por: ${sessao.realizadoPor}`, margemEsquerda, y2);
        y2 += 5;
      }

      if (sessao.assinaturaUrl) {
        const dataUri = await assinaturaParaDataUri(sessao.assinaturaUrl);
        if (y2 > 240) { doc.addPage(); y2 = 20; }
        doc.text('Assinatura do cliente:', margemEsquerda, y2);
        y2 += 3;
        if (dataUri) {
          try {
            doc.addImage(dataUri, 'PNG', margemEsquerda, y2, 50, 20);
            y2 += 22;
          } catch {
            doc.text('(não foi possível carregar a imagem da assinatura)', margemEsquerda, y2);
            y2 += 5;
          }
        } else {
          doc.text('(imagem da assinatura indisponível para exportação)', margemEsquerda, y2);
          y2 += 5;
        }
        if (sessao.assinaturaAceiteEm) {
          doc.setFontSize(8);
          doc.setTextColor(120);
          doc.text(`Aceite eletrônico em ${new Date(sessao.assinaturaAceiteEm).toLocaleString('pt-BR')}`, margemEsquerda, y2);
          doc.setTextColor(0);
          doc.setFontSize(9);
          y2 += 6;
        }
      } else if (sessao.assinaturaDispensadaMotivo) {
        doc.text(`Sem assinatura — Motivo: ${sessao.assinaturaDispensadaMotivo}`, margemEsquerda, y2);
        y2 += 6;
      }

      y2 += 4;
    }
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Emitido em ${new Date().toLocaleDateString('pt-BR')}`, margemEsquerda, 285);

  doc.save(`orcamento-${(cliente?.nome || 'cliente').replace(/\s+/g, '-').toLowerCase()}-${plano.id.slice(0, 8)}.pdf`);
}
