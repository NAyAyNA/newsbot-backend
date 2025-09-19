import express from "express";
import cors from "cors";
import "dotenv/config";
import { supabase } from "./supabaseClient.js";
import { generateQueryEmbedding } from "./embedding.js";
import { v4 as uuidv4 } from "uuid";
import redis from "./redisClient.js"; 
import askGemini from "./geminiLLM.js";

const app = express();
app.use(cors());
app.use(express.json());

// Generate new session
app.post("/session", async (req, res) => {
  const sessionId = uuidv4();

  // Store empty history in Redis
  await redis.set(sessionId, JSON.stringify([]), "EX", 3600); // 1h TTL

  res.json({ sessionId });
});

// Chat endpoint
app.post("/chat", async (req, res) => {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: "Missing sessionId or message" });
    }
  
    try {
      // Get session history 
      const historyRaw = await redis.get(sessionId);
      const history = historyRaw ? JSON.parse(historyRaw) : [];
  
      // Save user message
      history.push({ role: "user", text: message });
  
      // Check cache for articles
      const cacheKey = `articles:${message}`;
      let cached = await redis.get(cacheKey);
  
      let articles;
      if (cached) {
        console.log("✅ Cache hit for:", message);
        articles = JSON.parse(cached);
      } else {
        console.log("❌ Cache miss, querying Supabase...");
  
        // Generate query embedding
        const queryEmbedding = await generateQueryEmbedding(message);
  
        // Query Supabase
        const { data, error } = await supabase.rpc("match_articles", {
          query_array: queryEmbedding,
          match_count: 5,
        });
  
        if (error) {
          console.error(error);
          return res.status(500).json({ error: "Failed to fetch articles" });
        }
  
        articles = data;
  
        // Store in cache for 10 minutes
        await redis.set(cacheKey, JSON.stringify(articles), "EX", 600);
      }
  
      // Generate Bot response and save it
      const botResponse = await askGemini(message, articles, history);

      history.push({ role: "bot", text: botResponse });
  
      // Update session history in Redis (1h TTL)
      await redis.set(sessionId, JSON.stringify(history), "EX", 3600);
  
      res.json({ message: botResponse, articles });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Chat failed" });
    }
  });
  

// Fetch session history
app.get("/history/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const historyRaw = await redis.get(sessionId);
  const history = historyRaw ? JSON.parse(historyRaw) : [];
  res.json(history);
});

// Clear session
app.post("/session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  await redis.del(sessionId);
  res.json({ message: "Session cleared" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
