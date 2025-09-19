import Redis from "ioredis";

const redis = new Redis(process.env.UPSTASH_REDIS_REST_URL);

redis.on("connect", () => {
  console.log("✅ Connected to Upstash Redis");
});

redis.on("error", (err) => {
  console.error("❌ Redis error", err);
});

export default redis;
