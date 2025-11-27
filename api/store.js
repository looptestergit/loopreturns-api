import clientPromise from "../lib/mongo.js";

// --------------------
// GLOBAL (PERSISTENT) IP RATE LIMIT TABLE
// --------------------
const ipHits = {};

function rateLimitIP(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const now = Date.now();

  if (!ipHits[ip]) {
    ipHits[ip] = now;
    return { allowed: true, ip };
  }

  if (now - ipHits[ip] < 5000) {
    return { allowed: false, ip };
  }

  ipHits[ip] = now;
  return { allowed: true, ip };
}

// --------------------
// VALIDATOR (Medium strength)
// --------------------

// --------------------
// MAIN HANDLER
// --------------------
export default async function handler(req, res) {

  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    res.writeHead(302, { Location: "https://t.me/loopreturnsauce" });
    return res.end();
  }

  if (req.method !== "POST") {
    return res.status(200).end();
  }



  // --- RATE LIMIT PER IP ---
  const { allowed, ip } = rateLimitIP(req);
  if (!allowed) {
    return res.status(429).json({ error: "Too many requests, wait 5s", ip });
  }

  // --- API KEY ---
  if (req.headers["x-api-key"] !== process.env.API_KEY_WRITE) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("loopreturns");
    const stores = db.collection("stores");

    // Add IP into userInfo
    const payload = {
      ...req.body,
      userInfo: {
        ...req.body.userInfo,
        ipAddress: ip
      }
    };

    await stores.insertOne({
      createdAt: new Date(),
      ...payload
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ error: "DB error" });
  }
}
