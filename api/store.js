import clientPromise from "./lib/mongo";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // WRITE key required to save data
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== process.env.API_KEY_WRITE) {
      return res.status(401).json({ error: "Invalid Write Key" });
    }

    const body = req.body;
    if (!body) return res.status(400).json({ error: "Missing JSON body" });

    const client = await clientPromise;
    const db = client.db("loopreturns");

    await db.collection("stores").insertOne({
      date: new Date(),
      parsed: body.parsed,
      raw: body.raw,
      userInfo: body.userInfo || null,
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
