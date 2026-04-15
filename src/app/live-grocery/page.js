"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const API = "http://localhost:8000";

const classIcon = { food: "🥦" };
const GROUP_COLORS = {
  Fruit:"#f97316", Vegetable:"#22d3a0",
  Dairy:"#6366f1", Other:"#f59e0b",
};
const CLASS_TO_GROUP = {
  Apple:"Fruit",Banana:"Fruit",Mango:"Fruit",Orange:"Fruit",Pear:"Fruit",Peach:"Fruit",
  Plum:"Fruit",Kiwi:"Fruit",Lemon:"Fruit",Lime:"Fruit",Papaya:"Fruit",Pineapple:"Fruit",
  Pomegranate:"Fruit",Melon:"Fruit",Nectarine:"Fruit",
  Tomato:"Vegetable",Onion:"Vegetable",Potato:"Vegetable",Carrots:"Vegetable",
  Cabbage:"Vegetable",Cucumber:"Vegetable",Pepper:"Vegetable",Zucchini:"Vegetable",
  Garlic:"Vegetable",Ginger:"Vegetable",Asparagus:"Vegetable",
  Milk:"Dairy",Yoghurt:"Dairy",Juice:"Dairy",
  Mushroom:"Other",Avocado:"Other",Egg:"Other",
};

const PROTEIN_DB = {
  Apple:0.3,Banana:1.1,Tomato:0.9,Egg:6.0,Milk:3.4,
  Carrot:0.9,Carrots:0.9,Potato:2.0,Onion:1.1,Yoghurt:3.5,Cucumber:0.7,
  Mushroom:3.1,Avocado:2.0,Orange:0.9,Mango:0.8,Lemon:0.4,
  Pineapple:0.5,Pomegranate:1.7,Melon:0.6,Papaya:0.5,Kiwi:1.1,
  Pepper:1.0,Cabbage:1.3,Garlic:6.4,Ginger:1.8,Asparagus:2.2,
  Juice:0.4,Milk:3.4,
};

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

export default function LiveGroceryTracker() {
  const [streaming, setStreaming] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [goalInput, setGoalInput] = useState("120");
  const [backendOnline, setBackendOnline] = useState(false);
  
  // Snapshot states
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [showOption, setShowOption] = useState(false);
  const [confirmedSnapshot, setConfirmedSnapshot] = useState(null);
  
  // Manual entry states
  const [manualItem, setManualItem] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [addingManual, setAddingManual] = useState(false);
  
  const intervalRef = useRef(null);

  const toggleStream = async () => {
    try {
      await fetch(`${API}/stream/${streaming?"stop":"start"}?mode=grocery`, { method:"POST" });
    } catch {}
    setStreaming(s=>!s);
    if (streaming) {
      setPredictions(null);
      setShowOption(false);
      setConfirmedSnapshot(null);
    }
  };

  const takeSnapshot = async () => {
    if (!streaming) return;
    setSnapshotLoading(true);
    setPredictions(null);
    setShowOption(false);
    setConfirmedSnapshot(null);
    try {
      const res = await fetch(`${API}/classify/snapshot`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Server error");
      setPredictions(data);
      if (data.needs_option_panel) setShowOption(true);
    } catch (err) {
      console.error("Snapshot error:", err);
    } finally {
      setSnapshotLoading(false);
    }
  };

  const confirmOption = async (label) => {
    try {
      await fetch(`${API}/option/select`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ 
          frame_id: Math.floor(Math.random()*1000), 
          predicted_label: predictions?.suggestions?.[0]||"", 
          selected_item: label 
        }),
      });
      fetchAll();
      setConfirmedSnapshot(label);
      setShowOption(false);
    } catch{}
  };

  const addTopResult = () => {
    if (!predictions?.predictions?.[0]) return;
    const label = predictions.predictions[0].label;
    confirmOption(label);
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualItem.trim()) return;
    setAddingManual(true);
    try {
      await fetch(`${API}/inventory/add`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: manualItem, quantity: manualQty })
      });
      setManualItem("");
      setManualQty(1);
      fetchAll();
    } catch (err) {
      console.error("Manual add error:", err);
    } finally {
      setAddingManual(false);
    }
  };

  const fetchAll = useCallback(async () => {
    try {
      const [invRes, nutRes, recRes] = await Promise.all([
        fetch(`${API}/inventory`),
        fetch(`${API}/nutrition`),
        fetch(`${API}/recommendations`),
      ]);
      const invData = await invRes.json();
      const nutData = await nutRes.json();
      const recData = await recRes.json();
      
      // Map server dict {items: {Apple: {quantity, protein_per_unit}}} to frontend array
      const mappedInv = Object.entries(invData.items || {}).map(([name, data]) => ({
        name,
        qty: data.quantity,
        protein: data.protein_per_unit,
        group: CLASS_TO_GROUP[name] || "Other",
      }));
      setInventory(mappedInv);
      setNutrition(nutData);
      setRecommendations(recData.recommendations || []);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    if (streaming) {
      fetchAll();
      intervalRef.current = setInterval(fetchAll, 2500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [streaming, fetchAll]);

  const removeItem = async (name) => {
    try {
      await fetch(`${API}/inventory/remove`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ item: name })
      });
      fetchAll();
    } catch {}
  };

  const totalProtein = nutrition?.current_protein || 0;
  const proteinGoal = nutrition?.goal || 120;
  const pct = Math.min(100, (totalProtein / proteinGoal) * 100) || 0;
  const status = pct >= 100 ? "surplus" : pct >= 70 ? "on-track" : "deficit";
  const statusColor = pct >= 100 ? "var(--green)" : pct >= 70 ? "var(--yellow)" : "var(--red)";

  return (
    <div style={{ padding:"28px 24px", maxWidth:"1400px", margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontSize:"1.5rem", marginBottom:4 }}>Live Grocery Tracker</h1>
          <div style={{ fontSize:"0.8rem", color:"var(--text-muted)", display:"flex", gap:12 }}>
            <span>{backendOnline ? "🟢 Backend connected" : "⚪ Backend offline"}</span>
            {streaming && <span style={{ color:"var(--green)" }}>● Camera Active</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button onClick={toggleStream} className={`btn ${streaming?"btn-danger":"btn-primary"}`}>
            {streaming ? "⏹ Stop Stream" : "▶ Start Tracking"}
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Camera Feed */}
        <Subwindow title="Camera Feed · Live Classification" style={{ gridColumn:"1 / 2" }}>
            <div className="camera-feed" style={{ width: "100%", height: "420px", position: "relative", overflow: "hidden", borderRadius: "12px", border: "1px solid var(--border)", background:"#0a0a12" }}>
              {streaming ? (
                <>
                  <img 
                    src={`${API}/stream/grocery`} 
                    alt="Live Video" 
                    style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"fill" }}
                  />
                  <div style={{ position:"absolute", bottom:16, left:"50%", transform:"translateX(-50%)", zIndex:10 }}>
                    <button 
                      onClick={takeSnapshot} 
                      disabled={snapshotLoading}
                      className="btn btn-primary"
                      style={{ 
                        boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
                        padding: "10px 20px",
                        fontSize: "0.9rem",
                        backdropFilter: "blur(4px)",
                        background: "rgba(99,102,241,0.9)"
                      }}
                    >
                      {snapshotLoading ? "Processing..." : "📸 Capture & Analyze"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)", fontSize:"0.9rem" }}>
                  Press <strong style={{color:"var(--accent)", margin:"0 6px"}}>▶ Start Tracking</strong> to begin auto-inventory
                </div>
              )}
            </div>
            <p style={{ marginTop:12, fontSize:"0.8rem", color:"var(--text-muted)" }}>
              Show food items to the camera! They will automatically be detected and added to your inventory after a 10s cooldown.
            </p>
        </Subwindow>

        {/* Snapshot Predictions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {predictions && !snapshotLoading && (
            <div className="subwindow" style={{ animation: "slideIn 0.3s ease-out" }}>
              <div className="subwindow-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="subwindow-title">Snapshot Analysis</span>
                <span className={`badge ${predictions.top_confidence >= 0.75 ? "badge-safe" : "badge-warning"}`}>
                  {predictions.top_confidence >= 0.75 ? "High Confidence" : "Low Confidence"}
                </span>
              </div>
              <div className="subwindow-body">
                {predictions.predictions.map((p, i) => {
                  const group = CLASS_TO_GROUP[p.label] || "Other";
                  const gcolor = GROUP_COLORS[group] || "var(--accent)";
                  return (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {i === 0 && <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(99,102,241,0.15)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>TOP</span>}
                          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{p.label}</span>
                          <span style={{ fontSize: "0.65rem", color: gcolor, background: `${gcolor}15`, padding: "1px 6px", borderRadius: 4 }}>{group}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: p.confidence >= 0.75 ? "var(--green)" : "var(--yellow)", fontFamily: "monospace", fontSize: "0.85rem" }}>
                          {(p.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-track" style={{ height: 6, background: "rgba(255,255,255,0.05)" }}>
                        <div className="progress-fill" style={{ width: `${p.confidence * 100}%`, height: "100%", background: gcolor }} />
                      </div>
                    </div>
                  );
                })}

                {!showOption && !confirmedSnapshot && (
                  <button onClick={addTopResult} className="btn btn-success" style={{ width: "100%", marginTop: 8, justifyContent: "center", fontSize: "0.85rem" }}>
                    + Add "{predictions.predictions[0]?.label}" to Inventory
                  </button>
                )}
                
                {confirmedSnapshot && (
                  <div style={{ marginTop: 8, padding: "8px", borderRadius: 8, textAlign: "center", background: "rgba(34,211,160,0.1)", color: "var(--green)", fontSize: "0.8rem", border: "1px solid var(--green)" }}>
                    ✓ {confirmedSnapshot} added to inventory
                  </div>
                )}
              </div>
            </div>
          )}

          {showOption && predictions && (
            <div className="subwindow" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="subwindow-header">
                <span className="subwindow-title" style={{ color: "var(--yellow)" }}>⚠️ Low Confidence Correction</span>
              </div>
              <div className="subwindow-body">
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 12 }}>
                  Selected item might be one of these:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {predictions.suggestions.slice(0, 4).map(label => (
                    <button key={label} onClick={() => confirmOption(label)} className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "6px" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fallback space when no prediction */}
          {!predictions && !snapshotLoading && (
             <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed var(--border)", borderRadius: 12, padding: 40, color: "var(--text-muted)", textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "2rem", marginBottom: 12 }}>📸</div>
                  <div style={{ fontSize: "0.9rem" }}>Manual analysis will appear her after capture</div>
                </div>
             </div>
          )}
        </div>

        {/* Inventory */}
        <Subwindow title="Inventory" badge={<span style={{ fontSize:"0.72rem", color:"var(--text-muted)" }}>{inventory.length} items</span>} style={{ gridColumn:"2 / 3" }}>
          <div style={{ maxHeight:420, overflowY:"auto" }}>
            {inventory.length === 0 ? (
              <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text-muted)", fontSize:"0.82rem" }}>
                Hold up items to the camera to begin tracking
              </div>
            ) : inventory.map(item=>(
              <div key={item.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 0", borderBottom:"1px solid var(--border)", fontSize:"0.85rem" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, color:"var(--text-primary)" }}>{item.name}</div>
                  <div style={{ fontSize:"0.75rem", color:GROUP_COLORS[item.group]||"var(--accent)" }}>{item.group}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontWeight:600, color:"var(--text-primary)" }}>×{item.qty}</div>
                  <div style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{(item.protein*item.qty).toFixed(1)}g protein</div>
                </div>
                <button onClick={()=>removeItem(item.name)} style={{
                  background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)",
                  color:"var(--red)", borderRadius:6, padding:"4px 8px", cursor:"pointer", flexShrink:0,
                }}>×</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)" }}>
            <div style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginBottom:10, fontWeight:600, letterSpacing:"0.05em", display:"flex", alignItems:"center", gap:6 }}>
              <span>➕ ADD MANUALLY</span>
            </div>
            <form onSubmit={handleManualAdd} style={{ display:"flex", gap:8 }}>
              <input 
                className="input" 
                placeholder="Item name (e.g. Apple)" 
                value={manualItem}
                onChange={e=>setManualItem(e.target.value)}
                style={{ flex:2, fontSize:"0.8rem" }}
                required
              />
              <input 
                className="input" 
                type="number" 
                min="1"
                value={manualQty}
                onChange={e=>setManualQty(parseInt(e.target.value)||1)}
                style={{ flex:0.5, fontSize:"0.8rem", textAlign:"center", minWidth:60 }}
              />
              <button 
                type="submit" 
                disabled={addingManual}
                className="btn btn-primary" 
                style={{ padding:"0 12px", fontSize:"0.8rem" }}
              >
                {addingManual ? "..." : "Add"}
              </button>
            </form>
          </div>
        </Subwindow>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:24 }}>
        {/* Nutrition */}
        <Subwindow title="Nutrition Tracker" badge={<span className={`badge ${pct>=100?"badge-safe":pct>=70?"badge-warning":"badge-hazard"}`}>{status}</span>}>
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>Daily Protein</span>
                <span style={{ fontWeight:700, fontFamily:"'JetBrains Mono',monospace", fontSize:"0.9rem" }}>
                  <span style={{ color:statusColor }}>{totalProtein.toFixed(1)}g</span>
                  <span style={{ color:"var(--text-muted)" }}> / {proteinGoal}g</span>
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width:`${pct}%`, background:`linear-gradient(to right, ${statusColor}aa, ${statusColor})`, boxShadow:`0 0 8px ${statusColor}66` }}/>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:"0.72rem", color:"var(--text-muted)", marginBottom:6, letterSpacing:"0.05em" }}>SET DAILY GOAL (g protein)</div>
              <div style={{ display:"flex", gap:8 }}>
                <input className="input" type="number" value={goalInput} onChange={e=>setGoalInput(e.target.value)} style={{ flex:1 }}/>
                <button className="btn btn-ghost" onClick={async()=>{
                  const g=parseInt(goalInput)||120;
                  try{ await fetch(`${API}/set-goal`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({protein_goal:g})}); fetchAll(); }catch{}
                }}>Set</button>
              </div>
            </div>
        </Subwindow>

        {/* Recommendations */}
        <Subwindow title="Recommendations" badge={<span className="tag">AI Engine</span>}>
            {status !== "deficit" ? (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:"2rem", marginBottom:8 }}>✅</div>
                <div style={{ fontWeight:600, color:"var(--green)", marginBottom:4 }}>Protein Goal Met!</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginBottom:12 }}>
                  Need <strong style={{ color:"var(--red)" }}>{(proteinGoal-totalProtein).toFixed(1)}g more protein</strong> — suggested items:
                </div>
                {recommendations.map(r=>(
                  <div key={r.item} className="rec-card" style={{ display:"flex", padding:"10px", borderBottom:"1px solid var(--border)", alignItems:"center" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:"0.85rem" }}>{r.item}</div>
                      <div style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>+{r.protein}g protein</div>
                    </div>
                  </div>
                ))}
              </>
            )}
        </Subwindow>
      </div>
    </div>
  );
}
