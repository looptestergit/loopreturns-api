'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [ready, setReady] = useState(false);

  // ============================================
  // LOAD DATA + AUTH VALIDATION
  // ============================================
  useEffect(() => {
    const token = localStorage.getItem("lr_token");
    if (token !== "ok") {
      window.location.href = "/login";
      return;
    }

    const readKey = localStorage.getItem("lr_read_key");
    if (!readKey) return;

    setReady(true);

    fetch("https://loopreturns-api.vercel.app/api/list", {
      headers: { "x-api-key": readKey }
    })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setData(d);
        }
      });
  }, []);

  if (!ready) return null;

  // ============================================
  // METRIC CALCULATIONS
  // ============================================
  const totalEntries = data.length;
  const uniqueStores = new Set(data.map(x => x.parsed?.name || x.name)).size;

  // ============================================
  // DOWNLOAD PARSED CSV
  // ============================================
const downloadParsedCSV = () => {
  const headers = [
    "createdAt",
    "name",
    "url",
    "returns",
    "return_delay",
    "exchanges",
    "exchange_delay",
    "giftcards",
    "giftcard_delay",
    "keep_item",
    "keepItem_threshold",
    "bypass_review"
  ];

  let rows = headers.join(",") + "\n";

  data.forEach(x => {
    const p = x.parsed || {};

    const row = [
      x.createdAt || "",
      p.name || "",
      p.url || "",
      p.returns || "",
      p.rDelay || "",
      p.exchanges || "",
      p.eDelay || "",
      p.gc || "",
      p.gDelay || "",
      p.keepItem || "",
      p.keepItemAmnt || "",
      p.bypassReview || ""
    ]
      .map(v => JSON.stringify(v)) // safe quoting
      .join(",");

    rows += row + "\n";
  });

  const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "parsed_stores.csv";
  a.click();
};



  // ============================================
  // DOWNLOAD RAW JSON
  // ============================================
  const downloadRawJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all_raw_data.json";
    a.click();
  };

  // ============================================
  // UI RENDER
  // ============================================
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">📊 LoopReturns Dashboard</h1>

        <button
          onClick={() => { 
            localStorage.clear(); 
            window.location.href="/login"; 
          }}
          className="bg-red-500 text-white px-4 py-2 rounded shadow"
        >
          Logout
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        <div className="bg-white shadow rounded p-6">
          <p className="text-gray-500 text-sm">Total Unique Stores</p>
          <p className="text-3xl font-bold">{uniqueStores}</p>
        </div>

        <div className="bg-white shadow rounded p-6">
          <p className="text-gray-500 text-sm">Total Entries</p>
          <p className="text-3xl font-bold">{totalEntries}</p>
        </div>

        <div className="bg-white shadow rounded p-6">
          <p className="text-gray-500 text-sm">Last Updated</p>
          <p className="text-lg font-semibold">
            {new Date().toLocaleString()}
          </p>
        </div>

      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={downloadParsedCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          ⬇ Download Parsed CSV
        </button>

        <button
          onClick={downloadRawJSON}
          className="bg-gray-700 text-white px-4 py-2 rounded shadow hover:bg-gray-800"
        >
          ⬇ Download Full Raw JSON
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Store</th>
              <th className="p-3 text-left">URL</th>
              <th className="p-3 text-left">Returns</th>
              <th className="p-3 text-left">Delay</th>
              <th className="p-3 text-left">Exchanges</th>
              <th className="p-3 text-left">Ex Delay</th>
            </tr>
          </thead>
          <tbody>
            {data.map((x, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-3">{x.date}</td>
                <td className="p-3">{x.parsed?.name || "—"}</td>
                <td className="p-3 text-blue-600 underline">
                  <a href={x.parsed?.url} target="_blank" rel="noreferrer">
                    {x.parsed?.url || "—"}
                  </a>
                </td>
                <td className="p-3">{x.parsed?.returns || "—"}</td>
                <td className="p-3">{x.parsed?.rDelay || "—"}</td>
                <td className="p-3">{x.parsed?.exchanges || "—"}</td>
                <td className="p-3">{x.parsed?.eDelay || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
