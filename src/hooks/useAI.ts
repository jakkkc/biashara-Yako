import { useState } from 'react';
import toast from 'react-hot-toast';

export function useAI() {
  const [loading, setLoading] = useState(false);

  const callProxy = async (prompt: string): Promise<string> => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'gemini-2.0-flash' })
      });
      
      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }
      
      const data = await res.json();
      return data.text || 'No insights returned.';
    } catch (err: any) {
      console.error('AI Proxy request failed:', err);
      toast.error('An error occurred while generating AI insights. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 1. Business Insights (Dashboard)
   */
  const getBusinessInsights = async (sales: any[], expenses: any[], products: any[]) => {
    const prompt = `
      You are an expert AI business strategist specialized in the East African market.
      Analyze the following 30-day transactional snapshot for a retail business and output a brief narrative of performance trends, followed by exactly 3 tactical, highly actionable recommendations.
      
      TRANSACTIONS AND LOGS:
      - Total Purchases/Sales Count: ${sales.length}
      - Sales Breakdown: ${JSON.stringify(sales.slice(0, 20).map(s => ({ total: s.total, status: s.status, mtd: s.paymentMethod })))}
      - Expenses logged: ${JSON.stringify(expenses.slice(0, 20).map(e => ({ amount: e.amount, cat: e.category, desc: e.description })))}
      - Product stock levels: ${JSON.stringify(products.slice(0, 20).map(p => ({ name: p.name, quantity: p.quantity, limit: p.lowStockAlert })))}
      
      Please format your response in professional markdown with:
      - A bold, punchy headline in English and Swahili translation
      - A 1-paragraph trend summary ("Hali ya Biashara")
      - Three clearly labeled recommendations (1, 2, 3) formatted as cards or bullet points, each with a brief justification.
    `;
    return callProxy(prompt);
  };

  /**
   * 2. Platform Overview (Super Admin)
   */
  const getPlatformOverview = async (businesses: any[], users: any[]) => {
    const prompt = `
      You are the Master AI Systems Auditor for Biashara Yako POS SaaS platform.
      Review the current multi-tenant application telemetry and generate a brief SaaS Platform Health report.
      
      SaaS TELEMETRY:
      - Total Registered Businesses: ${businesses.length}
      - Business Telemetry: ${JSON.stringify(businesses.map(b => ({ name: b.name, status: b.status, type: b.businessType })))}
      - Total Cloud Users: ${users.length}
      
      Format the output with:
      - A high-level assessment of platform usage and health in clear English and Swahili.
      - 2 core insights regarding business sign-ups or sector growth in East Africa.
    `;
    return callProxy(prompt);
  };

  /**
   * 3. P&L Narration (Reports)
   */
  const getPLNarration = async (pl: { revenue: number, expenses: number, cogs: number, netProfit: number, currency: string }) => {
    const prompt = `
      You are an elite, approachable chartered accountant.
      Translate the following Profit & Loss balance sheet metrics into a simple, natural language explanation designed for a small business owner who does not know accounting jargon.
      
      P&L METRICS:
      - Total Revenue (Mauzo ya Jumla): ${pl.currency} ${pl.revenue.toLocaleString()}
      - Cost of Goods Sold (Dhamana ya Bidhaa): ${pl.currency} ${pl.cogs.toLocaleString()}
      - Total General Expenses (Matumizi): ${pl.currency} ${pl.expenses.toLocaleString()}
      - Net Profit (Ladha safi ya Faida/Hasara): ${pl.currency} ${pl.netProfit.toLocaleString()}
      
      Structure your narrative with:
      - A warm, direct financial diagnosis (whether they are making a healthy margin, overspending on COGS, or running tight).
      - Explanation of where the leakages might be (ratio of expenses to revenue).
      - Add Swahili friendly encouraging phrases.
    `;
    return callProxy(prompt);
  };

  /**
   * 4. Low Stock Suggestions (Inventory)
   */
  const getLowStockSuggestions = async (lowStockProducts: any[]) => {
    const prompt = `
      You are a smart inventory and logistics AI coordinator.
      Look at this list of products that have fallen below their safety stock thresholds (low stock alert) and suggest a smart reordering scheme.
      
      COMPROMISED PRODUCTS list:
      ${JSON.stringify(lowStockProducts.map(p => ({ name: p.name, sku: p.sku, qty: p.quantity, minAlert: p.lowStockAlert, category: p.category, unit: p.unit })))}
      
      Recommend reorder quantities based on rational sizing (e.g., standard retail cartons) and brief storage strategies for low stock risks in East African retail supply chain.
    `;
    return callProxy(prompt);
  };

  /**
   * 5. AI Receipt Validator / Expense Suggestion (Expenses)
   */
  const suggestExpenseCategory = async (description: string) => {
    const prompt = `
      You are an automated corporate expense compliance scanner.
      Analyze this user expense description: "${description}"
      and reply ONLY with a JSON containing a suggested category and confidence level.
      The categories must be strictly one of these values: "rent", "utilities", "salaries", "supplies", "other".
      
      Response Format:
      {
        "category": "rent" | "utilities" | "salaries" | "supplies" | "other",
        "reason": "Brief explanation in English and Swahili of why this is classified under this category",
        "confidence": 0.0 to 1.0
      }
    `;
    return callProxy(prompt);
  };

  return {
    loading,
    getBusinessInsights,
    getPlatformOverview,
    getPLNarration,
    getLowStockSuggestions,
    suggestExpenseCategory
  };
}
