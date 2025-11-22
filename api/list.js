import clientPromise from "../../lib/mongo";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("loopreturns");
    const docs = await db.collection("stores").find({}).sort({ date: -1 }).toArray();
    return res.status(200).json(docs);
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}
