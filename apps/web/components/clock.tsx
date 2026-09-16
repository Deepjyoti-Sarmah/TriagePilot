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
    <span className="mr-1 hidden font-mono text-xs tabular-nums text-zinc-500 lg:inline">
      {t}
    </span>
  );
}
