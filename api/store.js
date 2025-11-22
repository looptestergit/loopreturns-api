import clientPromise from "../lib/mongo.js";

export default async function handler(req, res) {
  // Allow Chrome extension + all sites (dev convenience)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Require API key
  if (req.headers["x-api-key"] !== process.env.API_KEY_WRITE) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("loopreturns");
    const stores = db.collection("stores");

    await stores.insertOne({
      createdAt: new Date(),
      ...req.body
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "DB error" });
  }
}
