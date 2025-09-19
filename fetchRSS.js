import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser();

// Times of India RSS feeds
const feeds = [
  "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
  "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms" 
];

async function fetchArticles() {
  let articles = [];

  for (const url of feeds) {
    console.log(`Fetching from: ${url}`);
    const feed = await parser.parseURL(url);

    const feedArticles = feed.items.slice(0, 30).map((item, idx) => ({
      id: `${url}-${idx}`,
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      description: item.description || item.content || ""
    }));

    articles = articles.concat(feedArticles);
  }

  fs.writeFileSync("articles.json", JSON.stringify(articles, null, 2));
  console.log(`✅ Saved ${articles.length} articles`); // Saved 50 articles
}

fetchArticles();
