/**
 * Seed a demo user. Run with: npm run seed
 * Uses SEED_USERNAME / SEED_PASSWORD from the environment (defaults: test/test).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  const dbName = process.env.MONGODB_DB || "finding-nibbles";
  const username = process.env.SEED_USERNAME || "test";
  const password = process.env.SEED_PASSWORD || "test";

  const client = await new MongoClient(uri).connect();
  try {
    const db = client.db(dbName);
    const users = db.collection("users");
    await users.createIndex({ username: 1 }, { unique: true });

    const existing = await users.findOne({ username });
    if (existing) {
      console.log(`Seed user "${username}" already exists.`);
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await users.insertOne({
      _id: cryptoRandomId(),
      username,
      passwordHash,
      profile: { name: "Test User", preferences: ["Vegetarian"] },
      createdAt: new Date(),
    } as any);
    console.log(`Seed user "${username}" created.`);
  } finally {
    await client.close();
  }
}

function cryptoRandomId(length = 17): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < length; i++) id += chars[bytes[i] % chars.length];
  return id;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
