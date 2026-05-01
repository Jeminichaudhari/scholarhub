import mongoose from "mongoose";

const DATABASE_URI = process.env.DATABASE_URI!;

if (!DATABASE_URI && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URI environment variable is not defined");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const isAtlas = DATABASE_URI.includes("mongodb+srv");
    cached.promise = mongoose
      .connect(DATABASE_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        ...(isAtlas ? {} : { family: 4 }),
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
