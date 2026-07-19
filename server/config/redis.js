import Redis from "ioredis";

const url = process.env.REDIS_URL;
if (!url) {
  throw new Error("REDIS_URL is not set. Point it at a local Redis or an Upstash/Redis Cloud URL in server/.env");
}

// `family: 0` lets ioredis work with both IPv4/IPv6 hosts (e.g. Upstash).
const redis = new Redis(url, { maxRetriesPerRequest: null, family: 0 });

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err.message));

export default redis;
