
import { GoogleGenAI } from "@google/genai";
import { Instrument, Level } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getPedagogicalSuggestion = async (instrument: Instrument, level: Level, topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um assistente pedagógico para professores de música. 
      O aluno toca ${instrument} e está no nível ${level}. 
      O tema da aula hoje é: ${topic}.
      Sugira 3 exercícios práticos, uma variação para desafio e um conceito teórico rápido para explicar. 
      Responda de forma sucinta e profissional em Português do Brasil.`,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, não consegui gerar sugestões agora. Tente novamente em instantes.";
  }
};
