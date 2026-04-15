export default function Architecture() {
  return (
    <div style={{ maxWidth:"800px", margin:"0 auto", padding:"60px 48px" }}>
      <h1>System Architecture</h1>
      <p>
        A seven-layer modular pipeline transforms raw camera frames into actionable
        safety decisions and nutritional intelligence — all classical ML, all explainable.
      </p>
      <div className="divider"/>
      <h2>Pipeline Overview</h2>
      <div style={{
        background:"rgba(0,0,0,0.3)", border:"1px solid var(--border)",
        borderRadius:12, padding:"20px 24px", fontFamily:"'JetBrains Mono',monospace",
        fontSize:"0.8rem", color:"#a5b4fc", lineHeight:2.2,
        marginBottom:32,
      }}>
        <div>Camera (USB / RTSP)</div>
        <div style={{ paddingLeft:20 }}>→ Frame Capture  <span style={{ color:"#64748b" }}>// 8–12 FPS, 640×480</span></div>
        <div style={{ paddingLeft:40 }}>→ Preprocessing  <span style={{ color:"#64748b" }}>// resize, grayscale, HOG, LBP, color hist</span></div>
        <div style={{ paddingLeft:60 }}>→ Detection Engine  <span style={{ color:"#64748b" }}>// SVM + RF + LR ensemble</span></div>
        <div style={{ paddingLeft:80 }}>→ Spatial Engine  <span style={{ color:"#64748b" }}>// Euclidean distance, centroids</span></div>
        <div style={{ paddingLeft:100 }}>→ Temporal Engine  <span style={{ color:"#64748b" }}>// frame buffer, duration tracking</span></div>
        <div style={{ paddingLeft:120 }}>→ Decision Engine  <span style={{ color:"#64748b" }}>// rule-based: safe / warning / hazard</span></div>
        <div style={{ paddingLeft:120, marginTop:8 }}>↓</div>
        <div style={{ paddingLeft:100 }}>Alerts + Dashboard</div>
        <div style={{ paddingLeft:100 }}>↓</div>
        <div style={{ paddingLeft:80 }}>Grocery Detection</div>
        <div style={{ paddingLeft:80 }}>↓</div>
        <div style={{ paddingLeft:60 }}>Option Panel  <span style={{ color:"#64748b" }}>// if confidence &lt; 0.75</span></div>
        <div style={{ paddingLeft:60 }}>↓</div>
        <div style={{ paddingLeft:40 }}>Nutrition Engine</div>
        <div style={{ paddingLeft:40 }}>↓</div>
        <div style={{ paddingLeft:20 }}>Recommendation Engine</div>
      </div>

      <h2>Architectural Layers</h2>
      <h3>1. Input Layer</h3>
      <p>
        A USB or RTSP camera continuously captures the kitchen environment at 8–12 FPS.
        Frames are buffered in a queue for downstream processing.
      </p>
      <h3>2. Vision Processing Layer</h3>
      <p>
        Frames undergo resizing to 128×128, grayscale conversion, HOG descriptor extraction
        (9 orientations, 8×8 cells, L2-Hys block norm), LBP texture analysis (r=1, p=8),
        RGB and HSV color histograms (32 bins each), and Canny edge density.
        All features are concatenated into a single descriptor vector.
      </p>
      <h3>3. Classification Layer — Detection Classes</h3>
      <ul>
        <li><strong style={{ color:"var(--green)" }}>Human</strong> — person presence + tracking</li>
        <li><strong style={{ color:"var(--yellow)" }}>Stove</strong> — active cooking surface</li>
        <li><strong style={{ color:"var(--red)" }}>Fire / Flame</strong> — active combustion</li>
        <li><strong style={{ color:"var(--red)" }}>Gas Leak</strong> — anomalous gas presence</li>
        <li><strong style={{ color:"var(--yellow)" }}>Knife</strong> — sharp instrument</li>
        <li><strong style={{ color:"var(--green)" }}>Food items</strong> — grocery classification</li>
      </ul>
      <h3>4. Spatial Analysis Layer</h3>
      <p>
        Object centroids are computed from bounding boxes and Euclidean distance is
        calculated between pairs. Distance below the threshold (40px at 640×480 scale)
        triggers proximity risk.
      </p>
      <div style={{
        background:"rgba(7,7,13,0.6)", border:"1px solid var(--border)",
        borderRadius:8, padding:"12px 18px", fontFamily:"'JetBrains Mono',monospace",
        fontSize:"0.85rem", color:"var(--text-secondary)", margin:"12px 0",
      }}>
        D = √((x₁ − x₂)² + (y₁ − y₂)²)
      </div>
      <h3>5. Temporal Monitoring Layer</h3>
      <p>
        A sliding frame buffer tracks risk conditions across time. A risk must persist
        for more than 3 seconds before escalating to a confirmed hazard alert, eliminating
        single-frame false positives.
      </p>
      <h3>6. Decision Engine</h3>
      <ul>
        <li><code>IF stove_on AND no_human → hazard</code></li>
        <li><code>IF gas_leak AND flame → critical</code></li>
        <li><code>IF knife AND distance &lt; threshold → warning</code></li>
        <li><code>IF risk_duration &gt; 3s → escalate</code></li>
      </ul>
      <h3>7. Output Layer</h3>
      <p>
        Alerts, UI notifications, and grocery + nutritional recommendations are emitted
        when hazardous scenarios or dietary deficits are detected.
      </p>
      <div className="divider"/>
      <h2>AI Modules</h2>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.85rem" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Module","Approach","Models"].map(h=>(
                <th key={h} style={{ textAlign:"left", padding:"8px 16px", color:"var(--text-muted)",
                  fontWeight:600, fontSize:"0.75rem", letterSpacing:"0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Object Detection",  "HOG + SVM/RF/LR Ensemble",  "SVM.pkl · RF.pkl · LR.pkl"],
              ["Food Classification","HOG + LBP + Color Hist",   "ensemble.pkl"],
              ["Spatial Analysis",  "Euclidean Distance Rules",  "Rule-based"],
              ["Temporal Eval",     "Frame Buffer Heuristic",    "Rule-based"],
              ["Nutrition",         "Macronutrient DB Lookup",   "Static DB"],
              ["Recommendations",   "Deficit-driven Logic",      "Rule-based"],
            ].map(([m,a,mo])=>(
              <tr key={m} style={{ borderBottom:"1px solid var(--border)" }}>
                <td style={{ padding:"10px 16px", color:"var(--text-primary)", fontWeight:500 }}>{m}</td>
                <td style={{ padding:"10px 16px", color:"var(--text-secondary)" }}>{a}</td>
                <td style={{ padding:"10px 16px", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:"0.78rem", color:"var(--accent)" }}>{mo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divider"/>
      <h2>Design Principles</h2>
      <h3>Modularity</h3>
      <p>Each layer is independently replaceable — swap HOG for YOLO without architectural redesign.</p>
      <h3>Edge-First</h3>
      <p>Full offline operation. No cloud dependency. All inference runs locally on device.</p>
      <h3>Interpretability</h3>
      <p>Classical ML + rule-based decisions ensure every alert has a traceable, explainable cause.</p>
    </div>
  );
}