"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("http://localhost:8000/health", { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          setBackendStatus(data.models_loaded ? "ready" : "loading");
        } else {
          setBackendStatus("offline");
        }
      } catch {
        setBackendStatus("offline");
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    ready:    { dot: "dot-green",  label: "Models Ready",   color: "var(--green)" },
    loading:  { dot: "dot-yellow", label: "Loading Models", color: "var(--yellow)" },
    offline:  { dot: "dot-grey",   label: "Backend Offline",color: "var(--text-muted)" },
    checking: { dot: "dot-grey",   label: "Connecting…",   color: "var(--text-muted)" },
  };
  const s = statusConfig[backendStatus];

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: "60px",
      background: "rgba(7,7,13,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px",
    }}>
      {/* Left: Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, var(--accent), #818cf8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1rem", boxShadow: "0 0 16px rgba(99,102,241,0.4)",
        }}>🍳</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.1 }}>
            AI Kitchen
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.05em", lineHeight: 1.1 }}>
            SAFETY & GROCERY SYSTEM
          </div>
        </div>
      </Link>

      {/* Center: Nav links */}
      <nav style={{ display: "flex", gap: "4px" }}>
        {[
          { href: "/dashboard", label: "Live Dashboard" },
          { href: "/grocery", label: "Grocery Demo" },
          { href: "/architecture", label: "Architecture" },
        ].map(link => (
          <Link key={link.href} href={link.href} style={{
            padding: "6px 14px", borderRadius: 8,
            fontSize: "0.82rem", fontWeight: 500,
            color: "var(--text-secondary)",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.target.style.color = "var(--text-primary)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={e => { e.target.style.color = "var(--text-secondary)"; e.target.style.background = "transparent"; }}
          >{link.label}</Link>
        ))}
      </nav>

      {/* Right: Backend status */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className={`dot ${s.dot}`} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: "0.75rem", color: s.color, fontWeight: 500 }}>{s.label}</span>
      </div>
    </header>
  );
}