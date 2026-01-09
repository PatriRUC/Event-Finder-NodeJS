require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ Missing MONGODB_URI environment variable");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB || "HW3"); 
    console.log(`✅ MongoDB connected: ${process.env.MONGODB_DB}`);
  }
  return db;
}

module.exports = { connectDB };
