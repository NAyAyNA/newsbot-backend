import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Load articles.json
const articlesPath = path.resolve("./data/articles.json"); 
const rawData = fs.readFileSync(articlesPath, "utf-8");
const articles = JSON.parse(rawData);

// Generate embeddings from Jina 
async function generateEmbedding(text) {
  const data = {
    model: "jina-embeddings-v3",
    task: "retrieval.passage",
    dimensions: 768,
    input: [text]
  };

  const response = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.JINA_API_KEY}`
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  if (!result.data || !result.data[0]) throw new Error("No embedding returned by Jina");
  return result.data[0].embedding;
}

// Store embedding in Supabase
async function storeEmbedding(article, embedding) {
  const { error } = await supabase.from("articles").insert([
    {
      id: article.id,
      title: article.title,
      link: article.link,
      pub_date: article.pubDate,
      description: article.description,
      embedding
    }
  ]);

  if (error) {
    console.error(`❌ Error inserting ${article.id}:`, error.message);
  } else {
    console.log(`✅ Stored article ${article.id}`);
  }
}

// Clean description of HTML tags
function stripHTML(html) {
    return html.replace(/<[^>]*>/g, '').trim();
}

// Main function
async function main() {
  for (const article of articles) {
    try {
      // Use title + description if description exists, if not only title
      const cleanDescription = stripHTML(article.description || '');
      const textToEmbed = cleanDescription
        ? `${article.title}. ${cleanDescription}`
        : article.title;

      const embedding = await generateEmbedding(textToEmbed);
      await storeEmbedding({
        ...article,
        description: cleanDescription
      }, embedding);
    } catch (err) {
      console.error(`Error processing article ${article.id}:`, err.message);
    }
  }

  console.log("🎉 All articles processed!");
}

main();
