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

  // Must be from LoopReturns platform
  if (!/loopreturns/.test(raw?.brand_settings?.api_domain || "")) return false;
  if (!/order\/lookup/.test(userInfo.url || "")) return false;

  // Raw structure
  const requiredRawKeys = [
    "order",
    "return_policy",
    "brand_settings",
    "locale",
    "currency"
  ];
  for (const key of requiredRawKeys) {
    if (!(key in raw)) return false;
  }

  // Parsed schema
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

  // Block extra parsed fields
  const parsedKeys = Object.keys(parsed);
  const allowedKeys = Object.keys(requiredParsed);
  if (parsedKeys.some(k => !allowedKeys.includes(k))) return false;

  // Type checking and anti-spam limits
  for (const [key, type] of Object.entries(requiredParsed)) {
    if (!(key in parsed)) return false;
    if (typeof parsed[key] !== type) return false;
    if (type === "string" && parsed[key].length > 120) return false;
  }

  // URL validation
  if (!/^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/i.test(parsed.url)) return false;
  if (!/^[a-zA-Z0-9 _-]{2,60}$/.test(parsed.name)) return false;

  // Valid states
  const validEvents = [
    "delivered",
    "in_transit",
    "in-transit",
    "out_for_delivery",
    "out-for-delivery",
    "none",
    "N/A"
  ];
  if (!validEvents.includes(parsed.returns)) return false;
  if (!validEvents.includes(parsed.exchanges)) return false;
  if (!validEvents.includes(parsed.gc)) return false;

  // Cross-check parsed <-> raw return policy
  const rp = raw.return_policy;
  if (!rp || typeof rp !== "object") return false;

  if (parsed.rDelay !== (rp.refund_event_delay_hours || 0)) return false;
  if (parsed.eDelay !== (rp.exchange_event_delay_hours || 0)) return false;
  if (parsed.gDelay !== (rp.gift_card_event_delay_hours || 0)) return false;

  if (parsed.returns !== (rp.refund_event || "N/A")) return false;
  if (parsed.exchanges !== (rp.exchange_event || "N/A")) return false;
  if (parsed.gc !== (rp.gift_card_event || "N/A")) return false;

  if (parsed.keepItem !== !!rp.keep_item_enabled) return false;
  if (parsed.keepItemAmnt !== (rp.keep_item_threshold || 0)) return false;
  if (parsed.bypassReview !== !!rp.bypass_review) return false;

  // User info validation
  if (!userInfo.userAgent || userInfo.userAgent.length > 300) return false;
  if (!/^https?:\/\//.test(userInfo.url)) return false;
  if (!userInfo.collectedAt || isNaN(Date.parse(userInfo.collectedAt))) {
    return false;
  }

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
