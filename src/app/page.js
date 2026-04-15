import Link from "next/link";

const features = [
  { icon: "🔥", title: "Fire Detection",      desc: "Real-time identification of open flames and unattended stove hazards using HOG feature analysis.",          color: "#ef4444" },
  { icon: "💨", title: "Gas Leak Detection",  desc: "Detects anomalous gas presence near heat sources and triggers immediate critical alerts.",                  color: "#f97316" },
  { icon: "🔪", title: "Knife Safety",        desc: "Tracks knife proximity to humans and evaluates spatial risk using Euclidean distance thresholds.",           color: "#f59e0b" },
  { icon: "👤", title: "Human Tracking",      desc: "Detects and monitors human presence in the kitchen to evaluate supervision status in real time.",           color: "#6366f1" },
  { icon: "🥦", title: "Grocery Intelligence",desc: "Classifies food items using a HOG+LBP ensemble (SVM + RF + LR) and maps them to nutritional values.",       color: "#22d3a0" },
  { icon: "🧠", title: "Temporal Reasoning",  desc: "Frame-buffer analysis prevents false positives by requiring risk conditions to persist across 3+ seconds.", color: "#818cf8" },
];

const stats = [
  { value: "20+", label: "Food Classes" },
  { value: "3",   label: "ML Models" },
  { value: "HOG", label: "Feature Method" },
  { value: "8fps", label: "Processing Rate" },
];

export default function Home() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 48px" }}>
      {/* Hero */}
      <section style={{ marginBottom: "64px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "4px 12px", borderRadius: "99px", marginBottom: "24px",
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
          fontSize: "0.75rem", fontWeight: 600, color: "#a5b4fc", letterSpacing: "0.06em",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block", boxShadow: "0 0 6px #6366f1" }} />
          COMPUTER VISION · EDGE AI · HOG + SVM
        </div>

        <h1 style={{ marginBottom: "20px", maxWidth: "680px" }}>
          AI Kitchen Safety &amp;{" "}
          <span style={{ background: "linear-gradient(135deg, #6366f1, #22d3a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Smart Grocery
          </span>{" "}
          System
        </h1>

        <p style={{ fontSize: "1.1rem", maxWidth: "580px", marginBottom: "36px", lineHeight: 1.75 }}>
          Real-time kitchen monitoring that detects fire, gas leaks, knives, and food items —
          combining HOG feature extraction with an ensemble of SVM, Random Forest, and Logistic
          Regression classifiers.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/dashboard" className="btn btn-primary" style={{ textDecoration: "none", fontSize: "0.9rem", padding: "10px 22px" }}>
            ⬡ Open Live Dashboard
          </Link>
          <Link href="/grocery" className="btn btn-ghost" style={{ textDecoration: "none", fontSize: "0.9rem", padding: "10px 22px" }}>
            🔬 Try Grocery Classifier
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "64px" }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{ textAlign: "center" }}>
            <div className="stat-value" style={{ marginBottom: "6px" }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.05em" }}>{s.label}</div>
          </div>
        ))}
      </section>

      <div className="divider" />

      {/* Features */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "8px" }}>Core Capabilities</h2>
        <p style={{ marginBottom: "32px" }}>
          A modular pipeline from raw frames to actionable safety decisions and nutritional guidance.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {features.map(f => (
            <div key={f.title} className="glass glass-hover" style={{ padding: "22px 24px" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "12px", filter: "drop-shadow(0 0 8px " + f.color + "55)" }}>{f.icon}</div>
              <h3 style={{ marginBottom: "8px", color: f.color }}>{f.title}</h3>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* Pipeline */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "8px" }}>Processing Pipeline</h2>
        <p style={{ marginBottom: "32px" }}>Seven-stage cascade from raw pixels to alerts and recommendations.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {[
            { n: "01", title: "Frame Capture",       desc: "USB/RTSP camera stream at 8–12 FPS, 640×480" },
            { n: "02", title: "Preprocessing",       desc: "Resize → grayscale → HOG, LBP, color histogram, edge density extraction" },
            { n: "03", title: "Object Detection",    desc: "SVM + Random Forest + LR ensemble identifies: human, stove, knife, fire, gas" },
            { n: "04", title: "Spatial Analysis",    desc: "Euclidean distance between centroids evaluates proximity risk" },
            { n: "05", title: "Temporal Monitoring", desc: "Risk must persist >3 seconds across frame buffer to trigger hazard" },
            { n: "06", title: "Decision Engine",     desc: "Rule-based logic maps conditions → Safe / Warning / Hazard state" },
            { n: "07", title: "Alerts & Grocery",    desc: "Notifications dispatched; food items logged, nutrition tracked" },
          ].map((step, i) => (
            <div key={step.n} style={{ display: "flex", gap: "20px", alignItems: "flex-start", padding: "16px 0",
              borderBottom: i < 6 ? "1px solid var(--border)" : "none" }}>
              <div style={{
                minWidth: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.05em",
              }}>{step.n}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "4px", color: "var(--text-primary)" }}>{step.title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "40px", borderRadius: "20px", textAlign: "center",
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(34,211,160,0.05))",
        border: "1px solid rgba(99,102,241,0.2)",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⬡</div>
        <h2 style={{ marginBottom: "8px" }}>See it in action</h2>
        <p style={{ marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px" }}>
          The live dashboard simulates real-time detection cycles with gas, fire, knife, and human scenarios.
        </p>
        <Link href="/dashboard" className="btn btn-primary" style={{ textDecoration: "none", fontSize: "0.9rem" }}>
          Launch Dashboard →
        </Link>
      </section>
    </div>
  );
}