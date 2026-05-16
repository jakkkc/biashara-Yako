import { useState } from 'react';
import toast from 'react-hot-toast';

export const useAI = () => {
  const [loading, setLoading] = useState(false);

  const askGemini = async (prompt: string, model: string = 'gemini-2.0-flash') => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.text;
    } catch (error: any) {
      console.error('AI Error:', error);
      toast.error('AI is currently unavailable');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getBusinessInsights = async (businessData: any) => {
    const prompt = `
      You are an expert business consultant specialized in East African SMEs.
      Analyze the following business data and provide 3 actionable, high-impact insights to improve profitability and efficiency.
      Data: ${JSON.stringify(businessData)}
      Keep insights concise, practical, and formatted as a numbered list.
    `;
    return askGemini(prompt);
  };

  const getProductOptimization = async (productData: any) => {
    const prompt = `
      Analyze this product's performance and inventory levels: ${JSON.stringify(productData)}.
      Suggest price adjustments or restocking strategies based on current market trends in East Africa.
    `;
    return askGemini(prompt);
  };

  return {
    loading,
    askGemini,
    getBusinessInsights,
    getProductOptimization
  };
};
