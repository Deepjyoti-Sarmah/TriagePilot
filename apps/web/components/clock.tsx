"use client";

import { useEffect, useState } from "react";

function utcNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}Z`;
}

export function Clock() {
  const [t, setT] = useState("--:--:--Z");
  useEffect(() => {
    setT(utcNow());
    const id = setInterval(() => setT(utcNow()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hidden font-mono text-xs text-slate-500 tabular-nums sm:inline">
      {t} <span className="blink text-lime">▮</span>
    </span>
  );
}
