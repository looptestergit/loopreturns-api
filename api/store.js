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
function validateLoopPayload(body) {
  if (!body || typeof body !== "object") return false;

  const { parsed, raw, userInfo } = body;
  if (!parsed || typeof parsed !== "object") return false;
  if (!raw || typeof raw !== "object") return false;
  if (!userInfo || typeof userInfo !== "object") return false;

  // Required parsed fields
  const requiredParsed = {
    name: "string",
    url: "string",
    returns: "string",
    rDelay: "number",
    exchanges: "string",
    eDelay: "number",
    gc: "string",
    gDelay: "number",
    keepItem: "boolean",
    keepItemAmnt: "number",
    bypassReview: "boolean",
  };

  for (const [key, type] of Object.entries(requiredParsed)) {
    if (!(key in parsed)) return false;
    if (typeof parsed[key] !== type) return false;
  }

  // URL format
  if (parsed.url.length < 8) return false;
  if (!/^https?:\/\//.test(parsed.url)) return false;

  // Store name length
  if (parsed.name.length < 2 || parsed.name.length > 120) return false;

  // Allowed status values
  const validEvents = [
    "delivered",
    "in_transit",
    "in-transit",
    "out_for_delivery",
    "out-for-delivery",
    "pending",
    "none",
    "N/A",
  ];

  if (!validEvents.includes(parsed.returns)) return false;
  if (!validEvents.includes(parsed.exchanges)) return false;
  if (!validEvents.includes(parsed.gc)) return false;

  // Raw must contain return policy
  if (!raw.return_policy || typeof raw.return_policy !== "object") return false;

  // User info
  if (!userInfo.url || typeof userInfo.url !== "string") return false;
  if (!/^https?:\/\//.test(userInfo.url)) return false;

  if (!userInfo.collectedAt || isNaN(Date.parse(userInfo.collectedAt))) {
    return false;
  }

  return true;
}

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

  if (req.method !== "POST") {
    return res.status(200).end();
  }

  // --- RATE LIMIT PER IP ---
  const { allowed, ip } = rateLimitIP(req);
  if (!allowed) {
    return res.status(429).json({ error: "Too many requests, wait 5s", ip });
  }

  // --- VALIDATE PAYLOAD ---
  if (!validateLoopPayload(req.body)) {
    return res.status(400).json({ error: "Invalid LoopReturns payload" });
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
