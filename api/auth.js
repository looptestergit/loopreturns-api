export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Missing password" });
    }

    if (password === process.env.DASHBOARD_PASSWORD) {
      return res.status(200).json({
        ok: true,
        readKey: process.env.API_KEY_READ  // ⭐ Send the read key
      });
    }

    return res.status(401).json({ ok: false, error: "Invalid password" });

  } catch (err) {
    return res.status(400).json({ error: "Bad request" });
  }
}
