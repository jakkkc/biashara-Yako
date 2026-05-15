export const aiService = {
  async generateInsights(prompt: string) {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("AI request failed");
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("AI Service Error:", error);
      return "Unable to generate AI insights at this time.";
    }
  },

  async askData(question: string, context: string) {
    const prompt = `
      You are an AI assistant for a POS system called Biashara Yako.
      Here is the context of the business data:
      ${context}

      User Question: ${question}
      
      Provide a concise, helpful answer based on the data.
    `;
    return this.generateInsights(prompt);
  }
};
