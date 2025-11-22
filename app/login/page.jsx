'use client';
import { useState } from 'react';

export default function Login() {
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");

const submit = async () => {
  const res = await fetch("/api/auth", {
    method: "POST",
    body: JSON.stringify({ password: pw }),
  });

  const data = await res.json();

  if (data.ok) {
    localStorage.setItem("lr_token","ok");
    window.location.href="/dashboard";
  } else {
    setErr("Invalid password");
  }
};


  return (
    <div className="max-w-sm mx-auto bg-white p-6 shadow rounded">
      <h1 className="text-xl mb-4">Login</h1>
      <input type="password" className="border p-2 w-full" value={pw} onChange={e=>setPw(e.target.value)} />
      <button onClick={submit} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Login</button>
      {err && <p className="text-red-500 mt-2">{err}</p>}
    </div>
  );
}
