import 'dotenv/config';

export async function generateQueryEmbedding(query) {
  const data = {
    model: "jina-embeddings-v3",
    task: "retrieval.query",
    dimensions: 768,
    input: [query]
  };

  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.JINA_API_KEY}`
    },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  if (!result.data || !result.data[0]) throw new Error("No embedding returned by Jina");
  return result.data[0].embedding;
}
