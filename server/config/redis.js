import Redis from "ioredis";

const url = process.env.REDIS_URL;

let redis;

if (url) {
  // `family: 0` lets ioredis work with both IPv4/IPv6 hosts (e.g. Upstash).
  redis = new Redis(url, { maxRetriesPerRequest: null, family: 0 });
  redis.on("connect", () => console.log("Redis connected"));
  redis.on("error", (err) => console.error("Redis error:", err.message));
} else {
  // Redis is only used by the email-OTP / password-reset flow. Don't crash the
  // whole server at startup when it's missing — that lets local testing with
  // DISABLE_OTP=true run without a Redis instance. Instead, fail loudly only if
  // a Redis-backed feature is actually invoked.
  console.warn(
    "REDIS_URL is not set — OTP & password-reset are unavailable. " +
      "Set REDIS_URL in server/.env to enable them (fine to ignore if DISABLE_OTP=true)."
  );
  const notConfigured = () => {
    throw new Error(
      "REDIS_URL is not set. Add a Redis URL to server/.env to use OTP/password-reset."
    );
  };
  // Any redis.<method>(...) call throws the helpful error above rather than
  // dereferencing undefined.
  redis = new Proxy({}, { get: () => notConfigured });
}

export default redis;
