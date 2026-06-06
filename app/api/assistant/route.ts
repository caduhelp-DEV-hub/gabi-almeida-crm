import {NextResponse} from 'next/server';
import {GoogleGenAI} from '@google/genai';

export async function POST(request: Request) {
  try {
    const {message, context} = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {error: 'A API Key do Gemini não está configurada nos Secrets da aplicação.'},
        {status: 500}
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `
      Você é a "Dica Gabi Almeida AI", uma assistente de Inteligência Artificial de elite para a clínica de estética avançada "Gabi Almeida Estética Avançada".
      O usuário é a Dra. Gabi Almeida ou um membro de sua equipe de estética premium (como a Dra. Isabella Rose ou Dr. Ricardo Silva).
      
      Você tem acesso ao seguinte contexto atual do CRM:
      - Profissionais Ativos: Dra. Isabella Rose (Master Injector), Dra. Camila Santos, Dr. André Luiz, Dra. Elen Costa, Dr. Fabio e Dra. Helena.
      - Paciente em Foco: Isabella Albuquerque (Paciente Premium, desde Out 2022, gastou R$12.450 em 8 procedimentos. Fez bioestimulador de colágeno e preenchedor hialurônico, possui alergia à Lidocaína, e usa Puran T4 50mg).
      - Meta de Faturamento Mensal do CRM: R$ 170.000 (atual em 82%, faltando R$ 27.420).
      - Pacientes com interesse em Bioestimuladores hoje: 3.
      - Alertas Críticos: Estoque de toxina botulínica baixo (apenas 3 frascos), e retornos pendentes de 15 dias (como Luísa Costa).
      
      Instruções de Estilo:
      1. Responda em português brasileiro profissional, caloroso, refinado e focado em resultados de estética médica (como contorno facial, rejuvenescimento, toxina botulínica, peelings e preenchedores).
      2. Mantenha as respostas concisas, diretas ao ponto, com dicas práticas acionáveis de 2 a 4 frases, ideais para leitura rápida no painel lateral de um CRM clínico ocupado.
      3. Seja elegante e use termos refinados de estética como "estimulação de colágeno", "harmonia facial", "fidelização de pacientes premium", "protocolos personalizados de tratamento".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: message || 'Dê uma sugestão de fidelização baseada nos dados de hoje.',
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text || 'Não consegui gerar uma resposta no momento.';
    return NextResponse.json({response: text});
  } catch (error: any) {
    console.error('Gemini error:', error);
    return NextResponse.json(
      {error: 'Erro ao processar requisição do assistente.'},
      {status: 500}
    );
  }
}
