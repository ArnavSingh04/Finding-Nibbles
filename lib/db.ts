import { Db, MongoClient } from "mongodb";

/**
 * A single shared MongoClient promise, created lazily on first use and reused
 * across hot reloads (dev) and serverless invocations (prod). This replaces
 * Meteor's built-in Mongo driver.
 *
 * The client is created lazily (not at module load) so that `next build`,
 * which imports route modules for static analysis, never opens a connection.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Copy .env.example to .env.local and set it."
    );
  }
  return new MongoClient(uri).connect();
}

function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    // Reuse the connection across HMR reloads to avoid exhausting connections.
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = connect();
    }
    return global._mongoClientPromise;
  }
  if (!clientPromise) {
    clientPromise = connect();
  }
  return clientPromise;
}

export async function getClient(): Promise<MongoClient> {
  return getClientPromise();
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB || "finding-nibbles");
}
