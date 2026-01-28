import { GoogleGenAI, Type } from "@google/genai";
import { QuizConfig, QuizResult, QuestionType, ApiKeyEntry, SubjectCategory } from "../types";

/**
 * GENERATOR SVG DINAMIS (Fallback)
 */
const generateFallbackSVG = (prompt: string): string => {
  const title = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
  const svg = `
    <svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fff7ed;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffedd5;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#bgGrad)" rx="24"/>
      <circle cx="530" cy="70" r="100" fill="#fb923c" opacity="0.1" />
      <rect x="250" y="80" width="100" height="100" rx="20" fill="white" opacity="0.5" />
      <text x="50%" y="240" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="22" fill="#1e293b">ILUSTRASI MATERI</text>
      <text x="50%" y="280" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="500" font-size="16" fill="#64748b" font-style="italic">"${title}"</text>
      <rect x="230" y="330" width="140" height="30" rx="15" fill="#f97316" />
      <text x="50%" y="350" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="white">AI QUIZ GENERATOR</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

export const getRotatingApiKey = (apiKeys: ApiKeyEntry[]): ApiKeyEntry | null => {
  const activeKeys = apiKeys.filter(k => k.status === 'active');
  if (activeKeys.length === 0) return null;
  
  // Sort by usage count (lowest first) then by last used time
  return [...activeKeys].sort((a, b) => {
    if (a.usageCount !== b.usageCount) return a.usageCount - b.usageCount;
    return (a.lastUsedAt || 0) - (b.lastUsedAt || 0);
  })[0];
};

export const generateQuizPrompt = (config: QuizConfig): string => {
  const { subject, category, grade, topic, subTopic, learningGoal, summaryText, questionType, optionsCount, difficulty, cognitiveLevel, totalQuestions, imageCount, imageOptionCount } = config;

  let precisionInstruction = "";
  const subLower = subject.toLowerCase();

  if (subLower.includes('matematika') || subLower.includes('fisika') || subLower.includes('kimia')) {
    precisionInstruction = `
    INSTRUKSI SAINS/MATEMATIKA:
    - Gunakan LaTeX ($...$ untuk inline, $$...$$ untuk baris baru).
    - Pastikan satuan internasional (SI) akurat.`;
  } else if (subLower.includes('arab')) {
    precisionInstruction = `
    INSTRUKSI BAHASA ARAB:
    - WAJIB gunakan Harakat lengkap.
    - Fokus pada kaidah Nahwu/Shorof.`;
  }

  let typeInstruction = "";
  if (questionType === QuestionType.PG || questionType === QuestionType.PGK) {
    typeInstruction = `- Tipe: ${questionType}. WAJIB sertakan tepat ${optionsCount} pilihan jawaban (options).`;
    if (questionType === QuestionType.PGK) {
      typeInstruction += " Jawaban benar bisa > 1. Berikan array string pada 'correctAnswer'.";
    }
  } else if (questionType === QuestionType.BS) {
    typeInstruction = "- Tipe Benar/Salah: 'options' berisi ['Benar', 'Salah'].";
  }

  return `
    Anda Pakar Kurikulum Merdeka SMA.
    Mapel: ${subject}. Topik: ${topic}.
    Grade: ${grade}. Jumlah Soal: ${totalQuestions}.
    Level: ${cognitiveLevel}, Kesulitan: ${difficulty}.
    ${typeInstruction}
    ${precisionInstruction}

    WAJIB: Jika ada rumus atau simbol matematika/sains, GUNAKAN LaTeX ($...$ atau $$...$$) baik di teks soal, opsi, maupun pada bagian 'explanation' (pembahasan).
    
    VISUAL:
    - Berikan 'imagePrompt' untuk ${imageCount} soal pertama.
    - Berikan array 'optionImagePrompts' untuk ${imageOptionCount} soal pertama.

    ${summaryText ? `MATERI: ${summaryText}` : ''}
    OUTPUT: JSON murni { "questions": [...] }.
  `;
};

export async function generateImageWithGemini(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `Clear educational illustration: ${prompt}. Minimalist, white background.`,
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : generateFallbackSVG(prompt);
  } catch {
    return generateFallbackSVG(prompt);
  }
}

export async function generateQuizWithGemini(config: QuizConfig, selectedKey: ApiKeyEntry): Promise<QuizResult> {
  const ai = new GoogleGenAI({ apiKey: selectedKey.key });
  
  const parts: any[] = [{ text: generateQuizPrompt(config) }];
  if (config.referenceImage) {
    parts.push({
      inlineData: {
        data: config.referenceImage.data.split(',')[1],
        mimeType: config.referenceImage.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                questionText: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                imagePrompt: { type: Type.STRING },
                optionImagePrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING },
                cognitiveLevel: { type: Type.STRING }
              },
              required: ["id", "questionText", "correctAnswer", "explanation"]
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text) as QuizResult;
}