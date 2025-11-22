import clientPromise from "../../lib/mongo";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { parsed, raw, meta } = req.body;
    const client = await clientPromise;
    const db = client.db("loopreturns");

    const now = new Date().toISOString();

    const doc = {
      date: now,
      parsed: { ...parsed, date: now },
      raw,
      meta
    };

    await db.collection("stores").insertOne(doc);

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}
