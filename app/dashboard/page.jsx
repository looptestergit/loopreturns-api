'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // ⭐ Check main login token
    const token = localStorage.getItem("lr_token");
    if (token !== "ok") {
      window.location.href = "/login";
      return;
    }

    // ⭐ Get stored read key
    const readKey = localStorage.getItem("lr_read_key");
    if (!readKey) {
      console.error("No read key stored");
      return;
    }

    // ⭐ Authenticated fetch
    fetch("https://loopreturns-api.vercel.app/api/list", {
      headers: { "x-api-key": readKey }
    })
    .then(r => r.json())
    .then(d => {
      // handle error response safely
      if (!Array.isArray(d)) {
        console.error("List API returned:", d);
        return;
      }

      setData(d);
    });

  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Render your data here */}
    </div>
  );
}
