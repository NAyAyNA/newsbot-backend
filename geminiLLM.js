import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function askGemini(userQuery, articles, history = []) {
  // Build context string from top-k results
  const context = articles.map(
    (a, i) => `${i + 1}. Title: ${a.title}
  Description: ${a.description}
  URL: ${a.link}`
  ).join("\n\n");

  // Include last 5 turns of conversation
  const historyStr = history
    .slice(-10)
    .map(h => `${h.role === "user" ? "User" : "Bot"}: ${h.text}`)
    .join("\n");

  // Prompt to send to LLM
  const prompt = `
    You are a helpful assistant.
    Use ONLY the context below to answer the user's question. 
    If the context is insufficient, say you don't know.

    Format the answer as:
    - Bullet points (each news item on a new line, starting with "-")
    - At the end of each bullet point, include the source link (if present) in parentheses.

    Here is the conversation so far:
    ${historyStr}
    
    The user just asked: "${userQuery}"
    
    Here are relevant articles:
    ${context}
    
    Based on the above, provide a clear and concise answer.
  `;
  

  // Call Gemini
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export default askGemini;
