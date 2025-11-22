import clientPromise from "./lib/mongo";

export default async function handler(req, res) {
  try {
    // READ key required to view data
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== process.env.API_KEY_READ) {
      return res.status(401).json({ error: "Invalid Read Key" });
    }

    const client = await clientPromise;
    const db = client.db("loopreturns");

    const stores = await db
      .collection("stores")
      .find({})
      .sort({ date: -1 })
      .toArray();

    return res.status(200).json(stores);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
