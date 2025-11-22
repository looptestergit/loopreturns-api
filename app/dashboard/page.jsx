'use client';
import { useEffect, useState } from 'react';

export default function Dashboard(){
  const [data,setData]=useState([]);
  const [csv,setCsv]=useState("");

  useEffect(()=>{
    if(localStorage.getItem("lr_token")!=="ok"){ window.location.href="/login"; return; }

    fetch("https://loopreturns-api.vercel.app/api/list",{
      headers:{ "x-api-key": process.env.NEXT_PUBLIC_API_READ_KEY }
    })
    .then(r=>r.json()).then(d=>{
      setData(d);
      let rows="date,name,url,returns,delay,exchanges,exDelay\n";
      d.forEach(x=>{
        rows+=`${x.date},${x.parsed?.name},${x.parsed?.url},${x.parsed?.returns},${x.parsed?.rDelay},${x.parsed?.exchanges},${x.parsed?.eDelay}\n`;
      });
      setCsv(rows);
    });
  },[]);

  const download=()=>{
    const blob=new Blob([csv],{type:"text/csv"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="loopreturns.csv";
    a.click();
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Dashboard</h1>
      <button onClick={download} className="mb-4 bg-green-600 text-white px-4 py-2 rounded">Download CSV</button>
      <div className="bg-white p-4 shadow rounded">
        {data.map((x,i)=>(
          <div key={i} className="border-b py-2">
            <b>{x.parsed?.name}</b> — {x.parsed?.returns} — {x.date}
          </div>
        ))}
      </div>
    </div>
  );
}