
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateRecipe = async (ingredients: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `다음 재료들을 활용한 맛있는 요리 레시피를 추천해주세요: ${ingredients}. 
               답변은 반드시 JSON 형식으로 해주세요. 
               형식: { "title": "요리 제목", "content": "상세 레시피 내용(마크다운 형식)" }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
        },
        required: ["title", "content"],
      },
    },
  });
  
  return JSON.parse(response.text || '{}');
};

export const generateFoodImage = async (dishName: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `A professional, high-quality food photography of ${dishName}. Beautiful lighting, wooden table background, appetizing presentation.` },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const editFoodImage = async (base64Image: string, editPrompt: string) => {
  const ai = getAI();
  // Remove data:image/png;base64, prefix
  const imageData = base64Image.split(',')[1];
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: imageData,
            mimeType: 'image/png',
          },
        },
        { text: editPrompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
