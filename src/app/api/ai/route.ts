import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "A chave da API do Gemini não foi configurada no servidor." }, { status: 500 });
    }

    const body = await request.json();
    const { data, accountName } = body;

    if (!data) {
      return NextResponse.json({ error: "Missing data payload" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel(
      { model: "gemini-flash-latest" },
      { apiVersion: "v1beta" }
    );

    const prompt = `
Você é um Gestor de Tráfego Pago Sênior, especialista em Meta Ads, focado em performance, redução de CPL e otimização de orçamentos.
Abaixo estão os dados reais do painel de controle da conta de anúncios "${accountName}". 

### Dados da Conta
${JSON.stringify({
  Resumo: data.overview,
  Campanhas: data.campaigns,
  Funil: data.funnel,
  Demografia: data.demographics
}, null, 2)}

Sua tarefa:
Analise estes dados profundamente e retorne EXATAMENTE 3 sugestões táticas e acionáveis de ouro.
Não seja genérico ("melhore seus criativos"). Seja extremamente específico baseado nos números (ex: "A campanha X está consumindo 60% da verba mas o CPL está R$20 acima da média. Pause-a.").

Responda OBRIGATORIAMENTE em formato JSON válido, seguindo exatamente esta estrutura:
[
  {
    "title": "Título curto da sugestão (ex: Otimização de Orçamento)",
    "text": "Explicação detalhada e acionável com números reais."
  },
  {
    "title": "...",
    "text": "..."
  },
  {
    "title": "...",
    "text": "..."
  }
]
Não inclua marcadores Markdown de código no retorno, retorne apenas a string json crua.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpar possíveis marcadores Markdown ```json ... ```
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/```/g, '').trim();
    }

    const insights = JSON.parse(cleanJson);

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error("AI Insights Error:", error);
    
    // Tratamento amigável para limites da API (429 Too Many Requests)
    const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many');
    
    if (isRateLimit) {
      return NextResponse.json({ 
        insights: [{
          title: "Limite da Inteligência Artificial Atingido 🚦",
          text: "Como estamos usando a versão gratuita do Google Gemini, existe um limite de quantas análises ele faz por minuto. Você sincronizou várias vezes seguidas. Aguarde 1 ou 2 minutos e tente Sincronizar novamente!"
        }] 
      });
    }

    // Outros erros
    return NextResponse.json({ 
      insights: [{
        title: "Falha de Conexão com a IA ⚠️",
        text: "Ocorreu um erro ao gerar os insights. O Google Gemini pode estar indisponível no momento. Detalhes: " + (error?.message || "Erro desconhecido")
      }] 
    });
  }
}
