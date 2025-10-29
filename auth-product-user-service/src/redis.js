import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => console.log("🧠 Connected to Redis"));
redis.on("error", (err) => console.error("❌ Redis Error:", err));

export async function saveLog(log) {
  const logString = JSON.stringify(log);
  await redis.lpush("logs", logString); // thêm log mới vào đầu danh sách
  await redis.ltrim("logs", 0, 99); // chỉ giữ 100 log gần nhất
}

export async function getLogs() {
  const logs = await redis.lrange("logs", 0, -1);
  return logs.map((l) => JSON.parse(l));
}
