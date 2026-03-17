
import { GoogleGenAI } from "@google/genai";
import { Instrument, Level } from "../types";

// O Vite define 'process.env.GEMINI_API_KEY' via config.define
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAMvLPGQen1L1JgBiiIB2BqcbI2grTjehI";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getPedagogicalSuggestion = async (instrument: Instrument, level: Level, topic: string) => {
  if (!API_KEY || API_KEY === "PLACEHOLDER_API_KEY") {
    return "Nota: A chave de API do Gemini não foi configurada no arquivo .env.local.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Voltando para o modelo 2.0 que foi reconhecido
      contents: [
        {
          role: 'user',
          parts: [{
            text: `Você é um assistente pedagógico de elite para professores de música da MusiClass.
            
Contexto do Aluno:
- Instrumento: ${instrument}
- Nível: ${level}
- Tema da Aula: ${topic}

Tarefa:
1. Sugira 3 exercícios práticos específicos para este instrumento e nível.
2. Sugira uma variação de desafio para o aluno.
3. Explique um conceito teórico rápido relacionado ao tema.

Responda em Português do Brasil, com tom profissional, encorajador e formatado para fácil leitura.`
          }]
        }
      ],
      config: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    });

    if (!response.text) {
      throw new Error("Resposta vazia da IA");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("API key")) {
      return "Erro: Chave de API inválida. Verifique suas configurações no Google AI Studio.";
    }
    return "Desculpe, não consegui gerar sugestões no momento. Verifique sua conexão ou tente novamente mais tarde.";
  }
};

/**
 * Usa IA para transformar um texto bruto de questionário em JSON estruturado.
 */
export const parseQuizFromText = async (rawText: string) => {
  if (!API_KEY || API_KEY === "PLACEHOLDER_API_KEY") {
    throw new Error("API Key não configurada.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [{
            text: `Analise o texto abaixo e extraia um questionário musical em formato JSON.
            O JSON deve ser um array de objetos, onde cada objeto tem:
            - question: a pergunta (string)
            - options: um array de 4 opções (strings)
            - correctIndex: o índice (0 a 3) da opção correta baseada no texto.

            Texto do Questionário:
            ${rawText}

            Retorne APENAS o JSON puro, sem blocos de código ou explicações.`
          }]
        }
      ],
      config: {
        temperature: 0.1, // Baixa temperatura para extração fiel
        responseMimeType: "application/json"
      }
    });

    const content = response.text || "[]";
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Gemini Quiz Parse Error:", error);
    throw error;
  }
};
