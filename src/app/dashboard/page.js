"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const API = "http://localhost:8000";

// ── Color helpers ────────────────────────────────────────────────────────────
const stateColor = { safe: "var(--green)", warning: "var(--yellow)", hazard: "var(--red)", critical: "var(--red)" };
const stateBg    = { safe: "var(--green-bg)", warning: "var(--yellow-bg)", hazard: "var(--red-bg)", critical: "var(--red-bg)" };
const stateBadge = { safe: "badge-safe", warning: "badge-warning", hazard: "badge-hazard", critical: "badge-critical" };

const classColor = { human: "green", stove: "yellow", knife: "yellow", fire: "red", gas_leak: "red", food: "green" };
const classIcon  = { human: "👤", stove: "🔥", knife: "🔪", fire: "🚨", gas_leak: "💨", food: "🥦" };

// ── Realistic camera-feed bounding box coords (% of 640×480 canvas) ─────────
// Scaled to subwindow canvas
function BboxCanvas({ detections, state, streaming }) {
  const W = 640, H = 480;
  return (
    <div className="camera-feed" style={{ width: "100%", height: "340px", position: "relative", overflow: "hidden" }}>
      {streaming && (
        <img 
          src={`${API}/stream/video`} 
          alt="Live Video" 
          style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"fill", zIndex:0 }}
        />
      )}
      <div className="camera-grid" style={{ zIndex:1, position:"relative" }} />
      {/* Corner brackets */}
      {[["0%","0%","br"],["auto","0%","bl"],["0%","auto","tr"],["auto","auto","tl"]].map(([t,r,k])=>(
        <div key={k} style={{
          position:"absolute", top:t==="auto"?"auto":"8px", bottom:t==="auto"?"8px":"auto",
          left:r==="auto"?"auto":"8px", right:r==="auto"?"8px":"auto",
          width:18, height:18, opacity:0.5, zIndex: 2,
          borderTop: k.startsWith("b") ? "none" : "2px solid var(--accent)",
          borderBottom: k.startsWith("t") ? "none" : "2px solid var(--accent)",
          borderLeft:  k.endsWith("r")   ? "none" : "2px solid var(--accent)",
          borderRight: k.endsWith("l")   ? "none" : "2px solid var(--accent)",
        }}/>
      ))}

      {/* Bounding boxes rendered as % of container */}
      {detections.map((d, i) => {
        const [x, y, w, h] = d.bbox;
        const col = classColor[d.label] || "green";
        const colorVar = col === "green" ? "var(--green)" : col === "yellow" ? "var(--yellow)" : "var(--red)";
        const bgVar    = col === "green" ? "var(--green)" : col === "yellow" ? "var(--yellow)" : "var(--red)";
        return (
          <div key={i} style={{
            position:"absolute",
            left: `${(x/W)*100}%`, top: `${(y/H)*100}%`,
            width:`${(w/W)*100}%`, height:`${(h/H)*100}%`,
            border: `2px solid ${colorVar}`,
            borderRadius: 4,
            boxShadow: `0 0 10px ${colorVar}44`,
            animation: "fadeIn 0.3s ease",
            zIndex: 3,
          }}>
            <div style={{
              position:"absolute", top:-22, left:-1,
              background: bgVar, color: col==="green"||col==="yellow"?"#000":"#fff",
              fontSize:"0.62rem", fontWeight:700, padding:"2px 6px",
              borderRadius:"4px 4px 0 0", whiteSpace:"nowrap", letterSpacing:"0.04em",
            }}>
              {classIcon[d.label]||"❓"} {d.label.toUpperCase().replace("_"," ")} {(d.confidence*100).toFixed(0)}%
            </div>
          </div>
        );
      })}

      {/* State overlay */}
      <div style={{
        position:"absolute", top:8, right:8,
        background: stateBg[state]||"transparent",
        border:`1px solid ${stateColor[state]||"transparent"}`,
        borderRadius:6, padding:"3px 8px",
        fontSize:"0.65rem", fontWeight:700,
        color: stateColor[state], letterSpacing:"0.06em",
        animation: state==="hazard"||state==="critical" ? "criticalPulse 1s ease-in-out infinite":"none",
        zIndex: 4,
      }}>
        {state?.toUpperCase()}
      </div>

      {/* Bottom info bar */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)",
        padding:"5px 10px", display:"flex", justifyContent:"space-between", alignItems:"center",
        fontSize:"0.65rem", color:"rgba(255,255,255,0.5)", fontFamily:"'JetBrains Mono',monospace",
        zIndex: 4,
      }}>
        <span>640×480 · 30fps</span>
        <span style={{color:"var(--green)"}}>● LIVE</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

// ── Subwindow wrapper ─────────────────────────────────────────────────────────
function Subwindow({ title, badge, children, style }) {
  return (
    <div className="subwindow" style={style}>
      <div className="subwindow-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
        <span className="subwindow-title" style={{ flexShrink:0 }}>{title}</span>
        <div style={{ flexShrink:0 }}>{badge}</div>
      </div>
      <div className="subwindow-body">{children}</div>
    </div>
  );
}

// ── Detection card ────────────────────────────────────────────────────────────
function DetectionCard({ d }) {
  const col = classColor[d.label] || "green";
  return (
    <div className={`detection-card detection-card-${col}`}>
      <span style={{ fontSize:"1.3rem", flexShrink:0 }}>{classIcon[d.label]||"❓"}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontWeight:600, fontSize:"0.83rem", textTransform:"capitalize", color:"var(--text-primary)" }}>
            {d.label.replace("_"," ")}
          </span>
          <span style={{
            fontSize:"0.77rem", fontWeight:700,
            color: col==="green" ? "var(--green)" : col==="yellow" ? "var(--yellow)" : "var(--red)",
          }}>
            {(d.confidence*100).toFixed(1)}%
          </span>
        </div>
        <div className="conf-bar-track">
          <div className="conf-bar-fill" style={{
            width:`${d.confidence*100}%`,
            background: col==="green"
              ? "linear-gradient(to right, #06b6d4, var(--green))"
              : col==="yellow"
              ? "linear-gradient(to right, var(--yellow), #f97316)"
              : "linear-gradient(to right, #f97316, var(--red))",
          }}/>
        </div>
      </div>
    </div>
  );
}

// ── Alert item ────────────────────────────────────────────────────────────────
function AlertItem({ alert }) {
  const cls = {
    critical:"alert-critical", high:"alert-high",
    medium:"alert-medium", low:"alert-low",
  }[alert.severity] || "alert-low";
  const ts = alert.timestamp ? new Date(alert.timestamp * 1000).toLocaleTimeString() : "";
  return (
    <div className={`alert-item ${cls}`} style={{ marginBottom:6 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:500 }}>{alert.message}</div>
        {ts && <div style={{ fontSize:"0.7rem", opacity:0.6, marginTop:2 }}>{ts}</div>}
      </div>
      <span style={{
        fontSize:"0.65rem", fontWeight:700, padding:"2px 7px",
        borderRadius:99, background:"rgba(255,255,255,0.08)",
        textTransform:"uppercase", letterSpacing:"0.05em", flexShrink:0,
      }}>{alert.severity}</span>
    </div>
  );
}

// ── Risk gauge ────────────────────────────────────────────────────────────────
function RiskGauge({ level, duration }) {
  const levels = { low: 15, medium: 50, high: 80, critical: 100 };
  const colors = { low: "var(--green)", medium: "var(--yellow)", high: "var(--orange)", critical: "var(--red)" };
  const pct    = levels[level] || 0;
  const color  = colors[level] || "var(--green)";
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:"0.8rem" }}>
        <span style={{ color:"var(--text-secondary)" }}>Risk Level</span>
        <span style={{ fontWeight:700, color }}>{level?.toUpperCase()}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width:`${pct}%`, background: color, boxShadow:`0 0 8px ${color}66` }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:"0.72rem", color:"var(--text-muted)" }}>
        <span>LOW</span><span>MED</span><span>HIGH</span><span>CRIT</span>
      </div>
      {duration > 0 && (
        <div style={{
          marginTop:10, padding:"6px 10px", borderRadius:8,
          background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)",
          fontSize:"0.78rem", color:"var(--yellow)", display:"flex", gap:8, alignItems:"center"
        }}>
          <span>⏱</span>
          <span>Risk persisting: <strong>{duration.toFixed(1)}s</strong>
            {duration > 3 && <span style={{marginLeft:6,color:"var(--red)"}}>→ HAZARD TRIGGERED</span>}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Spatial interaction panel ─────────────────────────────────────────────────
function SpatialPanel({ interaction }) {
  if (!interaction) return null;
  const { type, distance, risk_level } = interaction;
  const riskColor = { low:"var(--green)", medium:"var(--yellow)", high:"var(--orange)", critical:"var(--red)" }[risk_level] || "var(--green)";
  return (
    <div>
      <div style={{ marginBottom:12, padding:"8px 12px", borderRadius:8,
        background:"rgba(255,255,255,0.02)", border:"1px solid var(--border)" }}>
        <div style={{ fontSize:"0.7rem", color:"var(--text-muted)", marginBottom:4, letterSpacing:"0.06em" }}>INTERACTION TYPE</div>
        <div style={{ fontWeight:600, fontSize:"0.9rem", textTransform:"capitalize" }}>
          {type?.replace(/_/g," ") || "None"}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div style={{ padding:"10px 12px", borderRadius:8, background:"rgba(255,255,255,0.02)", border:"1px solid var(--border)" }}>
          <div style={{ fontSize:"0.68rem", color:"var(--text-muted)", marginBottom:4 }}>DISTANCE</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:"1.2rem", color:"var(--text-primary)" }}>
            {distance}<span style={{ fontSize:"0.65rem", color:"var(--text-muted)", marginLeft:3 }}>px</span>
          </div>
          <div style={{ fontSize:"0.65rem", color:"var(--text-muted)", marginTop:2 }}>
            D = √((x₁-x₂)² + (y₁-y₂)²)
          </div>
        </div>
        <div style={{ padding:"10px 12px", borderRadius:8, background: stateBg[risk_level]||"transparent",
          border:`1px solid ${riskColor}44` }}>
          <div style={{ fontSize:"0.68rem", color:"var(--text-muted)", marginBottom:4 }}>RISK LEVEL</div>
          <div style={{ fontWeight:700, fontSize:"1.2rem", color: riskColor, textTransform:"uppercase" }}>
            {risk_level}
          </div>
          {distance < 40 && distance > 0 && (
            <div style={{ fontSize:"0.65rem", color:"var(--yellow)", marginTop:2 }}>⚠ Below threshold (40px)</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [streaming,    setStreaming]    = useState(false);
  const [detData,      setDetData]      = useState(null);
  const [alertData,    setAlertData]    = useState(null);
  const [backendOnline,setBackendOnline]= useState(false);
  const [tick,         setTick]         = useState(0);
  const intervalRef = useRef(null);

  // ── Fetch from backend ──────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [detRes, alertRes] = await Promise.all([
        fetch(`${API}/detections`),
        fetch(`${API}/alerts`),
      ]);
      const det   = await detRes.json();
      const alert = await alertRes.json();
      setDetData(det);
      setAlertData(alert);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
      // Use browser-side simulation when backend is offline
      setTick(t => t + 1);
    }
  }, []);

  // ── Browser-side simulation (offline fallback) ──────────────────────────
  const SIM_SCENARIOS = [
    { state:"safe",    detections:[
        { label:"human",  confidence:0.94, bbox:[120,80,160,240]  },
        { label:"stove",  confidence:0.87, bbox:[260,170,100,80]  },
        { label:"food",   confidence:0.79, bbox:[200,240,70,50]   },
      ], interaction:{ type:"human_near_stove", distance:65, risk_level:"low" }, duration:0 },
    { state:"warning", detections:[
        { label:"human",  confidence:0.91, bbox:[100,60,160,280]  },
        { label:"knife",  confidence:0.83, bbox:[165,230,50,35]   },
        { label:"food",   confidence:0.72, bbox:[220,250,70,45]   },
      ], interaction:{ type:"human_near_knife", distance:32, risk_level:"medium" }, duration:2.1 },
    { state:"hazard",  detections:[
        { label:"gas_leak",confidence:0.96,bbox:[50,40,150,130]  },
        { label:"stove",   confidence:0.88,bbox:[255,170,110,90]  },
      ], interaction:{ type:"gas_near_flame", distance:18, risk_level:"high" }, duration:5.8 },
    { state:"hazard",  detections:[
        { label:"fire",   confidence:0.97, bbox:[255,175,120,100] },
        { label:"stove",  confidence:0.85, bbox:[250,175,110,90]  },
      ], interaction:{ type:"unattended_fire", distance:0, risk_level:"critical" }, duration:7.2 },
    { state:"warning", detections:[
        { label:"human",  confidence:0.89, bbox:[100,60,160,280]  },
        { label:"knife",  confidence:0.86, bbox:[158,230,50,36]   },
        { label:"gas_leak",confidence:0.91,bbox:[48,42,152,132]   },
        { label:"stove",  confidence:0.82, bbox:[252,175,110,90]  },
      ], interaction:{ type:"multiple_hazards", distance:15, risk_level:"critical" }, duration:9.4 },
  ];
  const SIM_ALERTS = {
    safe:    [{ message:"✅ Kitchen activity normal",                               severity:"low"      }],
    warning: [{ message:"⚠️ Human detected close to knife — monitor carefully",    severity:"medium"   }],
    hazard:  [
      { message:"🚨 Unattended fire detected on stove",                              severity:"critical" },
      { message:"💨 Gas leak near open flame — evacuate immediately",               severity:"critical" },
    ],
  };

  const simIdx         = !backendOnline ? Math.floor(tick / 2) % SIM_SCENARIOS.length : 0;
  const simScenario    = SIM_SCENARIOS[simIdx];
  const [alertHistory, setAlertHistory] = useState([]);

  // Build display data (backend or sim)
  const display = backendOnline && detData ? {
    state:       detData.state,
    detections:  detData.detections,
    interaction: detData.interaction,
    temporal:    detData.temporal,
  } : {
    state:       simScenario.state,
    detections:  simScenario.detections.map(d=>({
      ...d,
      confidence: Math.max(0.5, Math.min(0.99, d.confidence + (Math.random()-0.5)*0.04)),
    })),
    interaction: simScenario.interaction,
    temporal:    { duration: simScenario.duration + (tick % 5)*0.3, risk_persists: simScenario.state!=="safe" },
  };

  const displayAlerts = backendOnline && alertData ? alertData : {
    current:  (SIM_ALERTS[simScenario.state]||SIM_ALERTS.safe)[0],
    state:    simScenario.state,
    history:  alertHistory,
  };

  // Update alert history from sim
  useEffect(()=>{
    if(!backendOnline){
      const curr = (SIM_ALERTS[simScenario.state]||SIM_ALERTS.safe)[0];
      setAlertHistory(prev=>{
        if(prev.length===0||prev[0].message!==curr.message){
          return [{ ...curr, timestamp:Date.now()/1000, id:prev.length }, ...prev].slice(0,20);
        }
        return prev;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tick, backendOnline]);

  // ── Polling ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    if(streaming){
      fetchAll();
      intervalRef.current = setInterval(()=>{ fetchAll(); setTick(t=>t+1); }, 2500);
    } else {
      clearInterval(intervalRef.current);
    }
    return ()=> clearInterval(intervalRef.current);
  }, [streaming, fetchAll]);

  const toggleStream = async () => {
    try {
      if (!streaming) {
        await fetch(`${API}/stream/start?mode=safety`, { method: "POST" });
      } else {
        await fetch(`${API}/stream/stop?mode=safety`, { method: "POST" });
      }
    } catch{}
    setStreaming(s=>!s);
  };

  const state = display.state || "safe";

  return (
    <div style={{ padding:"28px 24px", maxWidth:"1400px", margin:"0 auto" }}>

      {/* ── Top bar ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontSize:"1.5rem", marginBottom:4 }}>Live Monitoring Dashboard</h1>
          <div style={{ fontSize:"0.8rem", color:"var(--text-muted)", display:"flex", gap:12 }}>
            <span>{backendOnline ? "🟢 Backend connected" : "🟡 Simulation mode (start backend for real inference)"}</span>
            {streaming && <span style={{ color:"var(--green)" }}>● Streaming active</span>}
          </div>
        </div>

        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {/* State badge */}
          <div style={{
            padding:"8px 16px", borderRadius:10, fontWeight:700, fontSize:"0.82rem",
            letterSpacing:"0.05em", textTransform:"uppercase",
            background: stateBg[state], color: stateColor[state],
            border:`1px solid ${stateColor[state]}44`,
            animation: state==="hazard" ? "criticalPulse 1s infinite":"none",
            display:"flex", alignItems:"center", gap:8,
          }}>
            <span className={`dot dot-${state==="safe"?"green":state==="warning"?"yellow":"red"}`}/>
            {state === "safe" ? "ALL CLEAR" : state === "warning" ? "WARNING" : "⚠ HAZARD"}
          </div>
          <button onClick={toggleStream} className={`btn ${streaming?"btn-danger":"btn-primary"}`}>
            {streaming ? "⏹ Stop Stream" : "▶ Start Stream"}
          </button>
        </div>
      </div>

      {/* ── MAIN GRID: 3 columns ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>

        {/* [1] Camera Feed */}
        <Subwindow title="Camera Feed · Detection Overlay"
          badge={<span className={`badge ${stateBadge[state]}`}><span className={`dot dot-${state==="safe"?"green":state==="warning"?"yellow":"red"}`}/>{state}</span>}
          style={{ gridColumn:"1 / 3" }}>
          <BboxCanvas detections={display.detections} state={state} streaming={streaming} />
          {!streaming && (
            <div style={{ textAlign:"center", marginTop:12, fontSize:"0.8rem", color:"var(--text-muted)" }}>
              Press <strong style={{color:"var(--accent)"}}>▶ Start Stream</strong> to begin monitoring
            </div>
          )}
        </Subwindow>

        {/* [2] System State */}
        <Subwindow title="Decision Engine"
          badge={<span className="tag">Rule-Based</span>}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:"0.7rem", color:"var(--text-muted)", marginBottom:8, letterSpacing:"0.06em" }}>CURRENT STATE</div>
            <div style={{
              padding:"16px", borderRadius:12, textAlign:"center",
              background:stateBg[state], border:`1px solid ${stateColor[state]}44`,
              animation: state==="hazard"?"criticalPulse 1s infinite":"none",
            }}>
              <div style={{ fontSize:"2.5rem", marginBottom:6 }}>
                {state==="safe"?"✅":state==="warning"?"⚠️":"🚨"}
              </div>
              <div style={{ fontWeight:800, fontSize:"1.1rem", color:stateColor[state], letterSpacing:"0.06em" }}>
                {state?.toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ fontSize:"0.7rem", color:"var(--text-muted)", marginBottom:8, letterSpacing:"0.06em" }}>ACTIVE RULES</div>
          {[
            { rule:"stove_on AND no_human → hazard",  active: state==="hazard" && display.detections.some(d=>d.label==="fire") },
            { rule:"gas_leak near flame → critical",   active: display.detections.some(d=>d.label==="gas_leak") },
            { rule:"knife proximity → warning",        active: display.detections.some(d=>d.label==="knife") },
            { rule:"human supervised → safe",          active: state==="safe" },
          ].map(r=>(
            <div key={r.rule} style={{
              display:"flex", gap:8, alignItems:"flex-start",
              padding:"6px 8px", borderRadius:7, marginBottom:5,
              background: r.active ? "rgba(99,102,241,0.08)":"rgba(255,255,255,0.01)",
              border:`1px solid ${r.active?"rgba(99,102,241,0.2)":"var(--border)"}`,
              fontSize:"0.72rem", fontFamily:"'JetBrains Mono',monospace",
              color: r.active?"var(--accent)":"var(--text-muted)",
            }}>
              <span>{r.active?"►":"○"}</span>
              <span>{r.rule}</span>
            </div>
          ))}
        </Subwindow>
      </div>

      {/* ── ROW 2: 4 subwindows ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16, marginBottom:16 }}>

        {/* [3] Detections list */}
        <Subwindow title="Object Detections"
          badge={<span style={{ fontSize:"0.72rem", color:"var(--text-muted)" }}>{display.detections.length} objects</span>}>
          {display.detections.length === 0
            ? <div style={{ color:"var(--text-muted)", fontSize:"0.82rem", textAlign:"center", padding:"20px 0" }}>No objects detected</div>
            : display.detections.map((d,i)=><DetectionCard key={i} d={d}/>)
          }
        </Subwindow>

        {/* [4] Spatial Interaction */}
        <Subwindow title="Spatial Interaction Engine"
          badge={<span className="tag">Euclidean</span>}>
          <SpatialPanel interaction={display.interaction}/>
        </Subwindow>

        {/* [5] Temporal Risk */}
        <Subwindow title="Temporal Risk Analysis"
          badge={<span className="tag">Frame Buffer</span>}>
          <RiskGauge
            level={display.interaction?.risk_level||"low"}
            duration={display.temporal?.duration||0}
          />
          <div style={{ marginTop:14, fontSize:"0.7rem", color:"var(--text-muted)", letterSpacing:"0.04em" }}>
            FRAME BUFFER STATUS
          </div>
          <div style={{ display:"flex", gap:4, marginTop:6 }}>
            {Array.from({length:12}).map((_,i)=>(
              <div key={i} style={{
                flex:1, height:20, borderRadius:3,
                background: i < Math.floor((display.temporal?.duration||0))
                  ? (display.interaction?.risk_level==="critical"||display.interaction?.risk_level==="high") ? "var(--red)"
                    : display.interaction?.risk_level==="medium" ? "var(--yellow)" : "var(--green)"
                  : "rgba(255,255,255,0.06)",
                transition:"background 0.4s",
              }}/>
            ))}
          </div>
          <div style={{ fontSize:"0.68rem", color:"var(--text-muted)", marginTop:4 }}>
            Hazard threshold: 3.0s · Current: {(display.temporal?.duration||0).toFixed(1)}s
          </div>
        </Subwindow>

        {/* [6] Alert current */}
        <Subwindow title="Alert System"
          badge={
            <span className={`badge ${stateBadge[displayAlerts.state||"safe"]}`}>
              {displayAlerts.state||"safe"}
            </span>
          }>
          {displayAlerts.current && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:"0.7rem", color:"var(--text-muted)", marginBottom:8, letterSpacing:"0.06em" }}>CURRENT ALERT</div>
              <AlertItem alert={displayAlerts.current}/>
            </div>
          )}
          <div style={{ fontSize:"0.7rem", color:"var(--text-muted)", marginBottom:8, letterSpacing:"0.06em" }}>HISTORY</div>
          <div style={{ maxHeight:200, overflowY:"auto" }}>
            {(backendOnline && alertData?.history ? alertData.history : alertHistory).slice(0,8).map((a,i)=>(
              <AlertItem key={i} alert={a}/>
            ))}
          </div>
        </Subwindow>
      </div>

      {/* ── ROW 3: Detection class legend ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:16 }}>
        {Object.entries(classIcon).map(([cls, icon])=>{
          const active = display.detections.some(d=>d.label===cls);
          const col = classColor[cls]||"green";
          return (
            <div key={cls} style={{
              padding:"12px 8px", borderRadius:12, textAlign:"center",
              background: active ? stateBg[col==="green"?"safe":col==="yellow"?"warning":"hazard"] : "rgba(255,255,255,0.02)",
              border:`1px solid ${active ? (col==="green"?"rgba(34,211,160,0.3)":col==="yellow"?"rgba(245,158,11,0.3)":"rgba(239,68,68,0.3)") : "var(--border)"}`,
              transition:"all 0.3s",
              animation: active && col==="red" ? "criticalPulse 1.5s infinite":"none",
            }}>
              <div style={{ fontSize:"1.5rem", marginBottom:4, filter: active?"drop-shadow(0 0 8px currentColor)":"none" }}>{icon}</div>
              <div style={{ fontSize:"0.68rem", fontWeight:600, textTransform:"capitalize",
                color: active ? (col==="green"?"var(--green)":col==="yellow"?"var(--yellow)":"var(--red)") : "var(--text-muted)" }}>
                {cls.replace("_"," ")}
              </div>
              <div style={{ width:6, height:6, borderRadius:"50%", margin:"5px auto 0",
                background: active ? (col==="green"?"var(--green)":col==="yellow"?"var(--yellow)":"var(--red)") : "var(--border)" }}/>
            </div>
          );
        })}
      </div>

      {/* ── API Reference ── */}
      <details style={{ marginTop:8 }}>
        <summary style={{ cursor:"pointer", fontSize:"0.8rem", color:"var(--text-muted)", userSelect:"none",
          padding:"8px 12px", borderRadius:8, background:"rgba(255,255,255,0.02)", border:"1px solid var(--border)" }}>
          API Reference
        </summary>
        <div style={{ marginTop:8, padding:"14px", borderRadius:10, background:"rgba(0,0,0,0.3)",
          border:"1px solid var(--border)", fontFamily:"'JetBrains Mono',monospace", fontSize:"0.75rem",
          color:"var(--text-secondary)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 20px" }}>
          {[
            ["GET /health","Backend readiness + model status"],
            ["POST /stream/start","Start the detection pipeline"],
            ["POST /stream/stop","Stop the detection pipeline"],
            ["GET /detections","Current frame detections + state"],
            ["GET /alerts","Alert history + current alert"],
            ["POST /classify","Upload image → food classification"],
            ["GET /inventory","Current grocery inventory"],
            ["GET /nutrition","Protein tracking status"],
            ["POST /set-goal","Update protein goal"],
            ["GET /recommendations","Suggested foods for deficit"],
          ].map(([ep,desc])=>(
            <div key={ep} style={{ display:"flex", gap:12, padding:"4px 0" }}>
              <span style={{ color:"var(--accent)", minWidth:180 }}>{ep}</span>
              <span style={{ color:"var(--text-muted)" }}>{desc}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
