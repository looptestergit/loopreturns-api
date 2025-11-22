'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("lr_token");
    const readKey = localStorage.getItem("lr_read_key");

    console.log("TOKEN:", token);
    console.log("READ KEY:", readKey);

    if (token !== "ok") {
      window.location.href = "/login";
      return;
    }

    if (!readKey) {
      console.error("Missing read key – Cannot fetch list");
      return;
    }

    setReady(true);  // allow HTML to render

    fetch("https://loopreturns-api.vercel.app/api/list", {
      headers: { "x-api-key": readKey }
    })
    .then(r => r.json())
    .then(d => {
      if (!Array.isArray(d)) {
        console.error("List error:", d);
        return;
      }
      setData(d);
    });

  }, []);

  if (!ready) return null;

  return (
    <div>
      <h1>Dashboard</h1>
      {data.length > 0 ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <div>No data yet</div>
      )}
    </div>
  );
}
