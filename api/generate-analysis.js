const { GoogleGenerativeAI } = require("@google/generative-ai");

// This function handles the API request.
module.exports = async (req, res) => {
    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { financialData } = req.body;
        const apiKey = req.body.apiKey || process.env.GEMINI_API_KEY;

        // Validate inputs
        if (!financialData || !financialData.yearlyData || !financialData.quarterlyData) {
            return res.status(400).json({ error: 'Missing or invalid financialData payload.' });
        }
        if (!apiKey) {
            return res.status(400).json({ error: 'API key is missing.' });
        }

        // Initialize the Generative AI client
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Create a structured prompt from the financial data
        const prompt = createPrompt(financialData);
        
        // Generate content
        const result = await model.generateContent(prompt);
        const response = result.response;
        const analysisText = response.text();
        
        // Send the successful response
        res.status(200).json({ analysis: analysisText });

    } catch (error) {
        console.error('Error in generate-analysis function:', error);
        
        // Provide specific feedback for invalid API key errors
        if (error.message && error.message.includes('API key not valid')) {
             return res.status(401).json({ error: 'Invalid API Key. Please check the key in your extension settings.' });
        }

        // Generic server error for other issues
        res.status(500).json({
            error: 'An internal server error occurred while generating the analysis.',
            details: error.message
        });
    }
};

/**
 * Creates a detailed prompt for the AI model based on financial data.
 * @param {object} data - The financial data object.
 * @returns {string} A formatted string to be used as the prompt.
 */
function createPrompt({ companyName, yearlyData, quarterlyData }) {
    // Helper to format a data series
    const formatSeries = (label, headers, rowData) => {
        if (!rowData || rowData.length === 0) return '';
        const series = headers.map((h, i) => `${h}: ${rowData[i] || 'N/A'}`).join(', ');
        return `${label}: [${series}]`;
    };

    // Extract key yearly data
    const yearlySales = formatSeries('Sales (Cr)', yearlyData.headers, yearlyData.rows['sales']);
    const yearlyNetProfit = formatSeries('Net Profit (Cr)', yearlyData.headers, yearlyData.rows['net profit']);
    
    // Extract key quarterly data
    const quarterlySales = formatSeries('Sales (Cr)', quarterlyData.headers, quarterlyData.rows['sales']);
    const quarterlyNetProfit = formatSeries('Net Profit (Cr)', quarterlyData.headers, quarterlyData.rows['net profit']);

    return `
        Analyze the financial performance of the company "${companyName}" based on the following data from Screener.in.

        **Role**: You are a sharp, insightful financial analyst. Your analysis should be clear, concise, and aimed at an investor.

        **Instructions**:
        1.  Start with a brief, 1-2 sentence summary of the company's overall performance trend.
        2.  Analyze the **Yearly Performance**, focusing on the sales and profit trajectory over the years. Is there consistent growth, stagnation, or volatility?
        3.  Analyze the **Quarterly Performance**, looking at the most recent trends. How does the latest quarter compare to previous ones?
        4.  Identify 1-2 key **Strengths** (e.g., consistent profit growth, margin expansion).
        5.  Identify 1-2 key **Risks or Weaknesses** (e.g., declining sales, volatile profits).
        6.  Conclude with a neutral, forward-looking statement. Do not give financial advice.
        7.  Keep the entire analysis under 250 words. Use bullet points for strengths and risks.

        **Financial Data:**

        **Yearly Data:**
        - ${yearlySales}
        - ${yearlyNetProfit}

        **Quarterly Data (recent):**
        - ${quarterlySales}
        - ${quarterlyNetProfit}

        Begin the analysis now.
    `;
}
