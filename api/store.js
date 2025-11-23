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
    return res.status(200).end();
  }

  // Store IP → timestamp
const ipHits = {};

function rateLimitIP(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();

  if (!ipHits[ip]) {
    ipHits[ip] = now;
    return true;
  }

  // 5 seconds = 5000 ms
  if (now - ipHits[ip] < 5000) {
    return false; // too fast
  }

  ipHits[ip] = now;
  return true;
}


if (!rateLimitIP(req)) {
  return res.status(429).json({
    error: "Too many requests — wait 5 seconds."
  });
}

  function validateLoopPayload(body) {
  if (!body || typeof body !== "object") return false;

  const { parsed, raw, userInfo } = body;
  if (!parsed || typeof parsed !== "object") return false;
  if (!raw || typeof raw !== "object") return false;
  if (!userInfo || typeof userInfo !== "object") return false;

  // Required parsed fields (soft check)
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
    bypassReview: "boolean"
  };

  for (const [key, type] of Object.entries(requiredParsed)) {
    if (!(key in parsed)) return false;
    if (typeof parsed[key] !== type) return false;
  }

  // Soft URL check (no strict domain)
  if (typeof parsed.url !== "string" || parsed.url.length < 8) return false;

  // Store name must not be garbage
  if (parsed.name.length < 2 || parsed.name.length > 120) return false;

  // Keep simple allowed status values
  const validEvents = [
    "delivered",
    "in_transit",
    "in-transit",
    "out_for_delivery",
    "out-for-delivery",
    "pending",
    "none",
    "N/A"
  ];

  if (!validEvents.includes(parsed.returns)) return false;
  if (!validEvents.includes(parsed.exchanges)) return false;
  if (!validEvents.includes(parsed.gc)) return false;

  // Raw must contain basic LoopReturns structure but no strict matching
  if (!raw.order || typeof raw.order !== "object") return false;
  if (!raw.return_policy || typeof raw.return_policy !== "object") return false;

  // UserInfo soft validation
  if (!userInfo.url || typeof userInfo.url !== "string") return false;
  if (!userInfo.collectedAt || isNaN(Date.parse(userInfo.collectedAt))) return false;

  return true;
}


  if (!validateLoopPayload(req.body)) {
  return res.status(400).json({ error: "" });
}


  // Require API key
  if (req.headers["x-api-key"] !== process.env.API_KEY_WRITE) {
    return res.status(200).end();
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
