# 📰 NewsBot Backend

This is the backend service for **NewsBot**, a chatbot that answers user queries by retrieving top-k matching news articles and generating responses using **Gemini LLM**.  

It fetches RSS feeds, generates embeddings with **Jina AI**, stores them in **Supabase**, and uses **Redis** for session + cache management.

---

## 🚀 Tech Stack
- **Node.js + Express** – API server  
- **Supabase** – Vector database for storing embeddings  
- **Jina AI Embeddings API** – To generate embeddings  
- **Google Gemini** – LLM for response generation  
- **Redis** – For session history & caching  
- **RSS Parser** – To extract news articles  

---

## 📂 Project Structure
```
backend/
│── data/                  # Extracted articles
│   └── articles.json
│── fetchRSS.js            # Script to fetch & save articles from RSS feeds
│── embedAndStore.js       # Script to embed & store articles in Supabase
│── index.js               # Express server entry point
│── geminiLLM.js           # Gemini API wrapper
│── embedding.js           # Embedding helper functions
│── redisClient.js         # Redis client setup
│── supabaseClient.js      # Supabase client setup
│── package.json
```

---

## ⚙️ Setup & Installation

1. **Clone the repo**
   ```bash
   git clone <your-backend-repo-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**  
   Create a `.env` file in the root:
   ```env
   PORT=5000

   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key

   # Jina AI
   JINA_API_KEY=your_jina_api_key

   # Google Gemini
   GEMINI_API_KEY=your_gemini_api_key

   # Redis
   REDIS_URL=your_redis_url
   ```

4. **Fetch RSS articles**
   ```bash
   node fetchRSS.js
   ```
   → Saves extracted articles to `data/articles.json`.

5. **Generate embeddings & store in Supabase**
   ```bash
   node embedAndStore.js
   ```

6. **Start backend server**
   ```bash
   npm start
   ```
   Server will run at `http://localhost:5000`.

---

## API Endpoints

### 1. Create a new session

**POST** `/session`

* Description: Generates a new session and stores an empty history in Redis with a 1-hour TTL.
* Response:

```json
{
  "sessionId": "uuid-generated-session-id"
}
```

---

### 2. Chat with bot

**POST** `/chat`

* Description: Sends a user message, fetches relevant articles from Supabase (with Redis caching), generates a bot response, and updates session history.
* Request Body:

```json
{
  "sessionId": "uuid-generated-session-id",
  "message": "Your message here"
}
```

* Response:

```json
{
  "message": "Bot's response text",
  "articles": [
    {
      "id": "article-id",
      "title": "Article title",
      "link": "https://article-link.com",
      "description": "Article description",
      "pub_date": "2025-09-20T00:00:00Z"
    }
  ]
}
```

---

### 3. Fetch session history

**GET** `/history/:sessionId`

* Description: Retrieves the full conversation history for a given session.
* Response:

```json
[
  { "role": "user", "text": "User message" },
  { "role": "bot", "text": "Bot response" }
]
```

---

### 4. Clear session

**POST** `/session/:sessionId`

* Description: Deletes session history from Redis.
* Response:

```json
{
  "message": "Session cleared"
}
```



---

## 🧠 How It Works

1. **RSS Fetching** – `fetchRSS.js` scrapes top articles from Times of India feeds.  
2. **Embeddings** – `embedAndStore.js` generates **768-dim embeddings** with Jina and stores them in Supabase.  
3. **Query Flow**  
   - User message → backend retrieves top-k similar articles from Supabase (vector similarity).  
   - Context is built (titles + descriptions + links).  
   - Passed to **Gemini LLM** for final answer.  
4. **Redis** – Stores session history and caches frequent queries for faster responses.  

---

## 🔄 TTLs & Cache Warming
- **Redis TTLs** can be configured for session keys (e.g., expire after `24h`).  
- **Cache warming**: Run `fetchRSS.js` + `embedAndStore.js` periodically (e.g., daily CRON) to refresh embeddings with the latest news.  

---

## 🌐 Deployment
- Works with **Vercel**, **Render**, or similar Node hosting.  
- Ensure `.env` values are set in the hosting platform.  
- Example `package.json`:
```json
"scripts": {
  "start": "node index.js"
},
"engines": {
  "node": "22.x"
}
```

## Deployed Link : https://newsbot-backend.vercel.app/
