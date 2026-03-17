
import { GoogleGenAI } from "@google/genai";
import { StorageService } from "./storage.ts";
import { NewsArticle, Document, Message } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  /**
   * Helper: Get Relevant Context (RAG)
   */
  getRelevantContext: (query: string, docs: Document[]) => {
    if (!docs.length) return "NENHUM DADO REAL FORNECIDO.";

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\W+/).filter(w => w.length > 3);
    
    const dreKeywords = ['lucro', 'receita', 'despesa', 'ebitda', 'margem', 'faturamento', 'custo'];
    const isDreQuery = dreKeywords.some(kw => queryLower.includes(kw));

    const rankedDocs = docs.map(doc => {
      let score = 0;
      const contentLower = doc.content.toLowerCase();
      const nameLower = doc.name.toLowerCase();
      
      queryWords.forEach(word => {
        if (contentLower.includes(word)) score += 1;
        if (nameLower.includes(word)) score += 2;
      });

      if (isDreQuery) {
        const isDreDoc = contentLower.includes('dre') || contentLower.includes('demonstração de resultado') || nameLower.includes('dre');
        if (isDreDoc) score += 10;
      }

      return { doc, score };
    }).sort((a, b) => b.score - a.score);

    let contextStr = "BASE DE DADOS REAL DO USUÁRIO:\n";
    let currentLength = 0;
    const MAX_CONTEXT_CHARS = 20000;

    for (const item of rankedDocs) {
      if (item.score === 0 && rankedDocs.length > 5) continue; 
      const docEntry = `[ID: ${item.doc.id}] [NOME: ${item.doc.name}]\nCONTEÚDO: ${item.doc.content}\n\n`;
      if (currentLength + docEntry.length > MAX_CONTEXT_CHARS) break;
      contextStr += docEntry;
      currentLength += docEntry.length;
    }
    return contextStr;
  },

  generateTitle: async (firstMessage: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere um título curto (max 4 palavras), profissional e em MAIÚSCULAS para: "${firstMessage}". Responda APENAS o título.`,
      });
      return response.text?.trim().replace(/['"]+/g, '') || 'NOVA SESSÃO';
    } catch (e) {
      return 'NOVA SESSÃO';
    }
  },

  fetchLatestNews: async (): Promise<NewsArticle[]> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Encontre 4 notícias financeiras importantes de hoje para Brasil e Global. Retorne um array JSON com: title (PT-BR), summary (PT-BR), source, sentiment (BULLISH/BEARISH/NEUTRAL), time.`,
        config: { tools: [{ googleSearch: {} }] }
      });

      let text = response.text || "[]";
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (e) {
      return [];
    }
  },

  getMarketIntelligence: async (query: string) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise como Especialista Financeiro Sênior: "${query}".`,
        config: { tools: [{ googleSearch: {} }] }
      });

      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web?.uri ? { uri: chunk.web.uri, title: chunk.web.title } : null)
        .filter(Boolean) || [];

      return { text: response.text || "Sem dados.", sources };
    } catch (e) {
      return { text: "Erro na consulta.", sources: [] };
    }
  },

  /**
   * IA CONTÁBIL (Auditor Agent) - Suporte Multimodal para Notas e Recibos
   */
  generateChatResponseStream: async (
    currentMessage: string, 
    history: Message[], 
    onChunk: (text: string) => void,
    docs: Document[],
    imageAttachment?: { data: string; mimeType: string }
  ): Promise<string> => {
    const context = GeminiService.getRelevantContext(currentMessage, docs);
    const systemInstruction = `VOCÊ É O FINAIGPT, AUDITOR SÊNIOR ESPECIALISTA EM IFRS/CPC. 
    Use o contexto RAG para responder sobre documentos. 
    Se o usuário enviar uma imagem (LENS), identifique valores, CNPJs, impostos e erros contábeis na foto.
    IMPORTANTE: Não use notação LaTeX (como $...$ ou [...]). Use formatação Markdown simples ou texto puro para fórmulas matemáticas (ex: Use * para multiplicação).
    
    CONTEXTO RAG ATUAL:
    ${context}`;

    const contents = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [
        { text: m.content },
        ...(m.image ? [{ inlineData: { data: m.image.data, mimeType: m.image.mimeType } }] : [])
      ]
    }));

    const currentParts: any[] = [{ text: currentMessage || "Analise esta imagem." }];
    if (imageAttachment) {
      currentParts.push({ inlineData: { data: imageAttachment.data, mimeType: imageAttachment.mimeType } });
    }
    contents.push({ role: 'user', parts: currentParts });

    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents,
      config: { systemInstruction }
    });
    
    let fullText = '';
    for await (const chunk of result) {
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(fullText);
      }
    }
    return fullText;
  },

  /**
   * IA FINANCEIRA (CFA Agent) - Suporte Multimodal para Gráficos
   */
  generateFinancialAnalysisStream: async (
    currentMessage: string, 
    history: Message[], 
    onChunk: (text: string) => void,
    imageAttachment?: { data: string; mimeType: string }
  ): Promise<string> => {
    const systemInstruction = `VOCÊ É UM ANALISTA FINANCEIRO CFA. 
    Use Google Search para dados em tempo real. 
    Se o usuário enviar imagens de gráficos ou home broker (LENS), analise candles, indicadores e tendências técnicas.
    IMPORTANTE: Não use notação LaTeX. Use símbolos matemáticos padrão em texto simples ou Markdown.`;

    const contents = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [
        { text: m.content },
        ...(m.image ? [{ inlineData: { data: m.image.data, mimeType: m.image.mimeType } }] : [])
      ]
    }));

    const currentParts: any[] = [{ text: currentMessage || "Analise este gráfico." }];
    if (imageAttachment) {
      currentParts.push({ inlineData: { data: imageAttachment.data, mimeType: imageAttachment.mimeType } });
    }
    contents.push({ role: 'user', parts: currentParts });

    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents,
      config: { 
        systemInstruction,
        tools: [{ googleSearch: {} }] 
      }
    });
    
    let fullText = '';
    for await (const chunk of result) {
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(fullText);
      }
    }
    return fullText;
  },

  /**
   * ÁREA DO ALUNO (Tutor)
   */
  generateStudentResponseStream: async (
    currentMessage: string, 
    history: Message[], 
    onChunk: (text: string) => void
  ): Promise<string> => {
    const systemInstruction = `VOCÊ É UM PROFESSOR UNIVERSITÁRIO DE CONTABILIDADE. Explique conceitos de forma didática e técnica.
    IMPORTANTE: Ao escrever fórmulas, use texto simples ou Markdown (ex: Ativo = Passivo + PL). Não use LaTeX ($...$) pois o sistema não renderiza.`;
    const contents = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: currentMessage }] });

    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents,
      config: { systemInstruction }
    });
    
    let fullText = '';
    for await (const chunk of result) {
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(fullText);
      }
    }
    return fullText;
  }
};
