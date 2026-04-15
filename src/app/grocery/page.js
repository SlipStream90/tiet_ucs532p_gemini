"use client";
import { useState, useRef, useCallback } from "react";

const API = "http://localhost:8000";

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

const GROUP_COLORS = {
  Fruit:"#f97316", Vegetable:"#22d3a0",
  Dairy:"#6366f1", Other:"#f59e0b",
};

const PROTEIN_DB = {
  Apple:0.3,Banana:1.1,Tomato:0.9,Egg:6.0,Milk:3.4,
  Carrot:0.9,Carrots:0.9,Potato:2.0,Onion:1.1,Yoghurt:3.5,Cucumber:0.7,
  Mushroom:3.1,Avocado:2.0,Orange:0.9,Mango:0.8,Lemon:0.4,
  Pineapple:0.5,Pomegranate:1.7,Melon:0.6,Papaya:0.5,Kiwi:1.1,
  Pepper:1.0,Cabbage:1.3,Garlic:6.4,Ginger:1.8,Asparagus:2.2,
  Juice:0.4,Milk:3.4,
};

// ── Simulated predictions (offline mode) ─────────────────────────────────────
const FOOD_SIM = [
  [{ label:"Apple",  confidence:0.82 },{ label:"Pear",  confidence:0.11 },{ label:"Peach",confidence:0.04 }],
  [{ label:"Banana", confidence:0.91 },{ label:"Mango", confidence:0.06 },{ label:"Papaya",confidence:0.02 }],
  [{ label:"Tomato", confidence:0.61 },{ label:"Pepper",confidence:0.22 },{ label:"Pear",  confidence:0.10 }],
  [{ label:"Mushroom",confidence:0.44},{ label:"Potato",confidence:0.33 },{ label:"Onion", confidence:0.17 }],
  [{ label:"Cucumber",confidence:0.78},{ label:"Zucchini",confidence:0.14},{ label:"Pepper",confidence:0.05}],
];

let simIdx = 0;

export default function GroceryDemo() {
  const [imgSrc,      setImgSrc]      = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [showOption,  setShowOption]  = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [confirmed,   setConfirmed]   = useState(false);
  const [inventory,   setInventory]   = useState([]);
  const [proteinGoal, setProteinGoal] = useState(120);
  const [goalInput,   setGoalInput]   = useState("120");
  const [dragOver,    setDragOver]    = useState(false);
  const [frameId]                     = useState(() => Math.floor(Math.random()*1000));
  const fileRef = useRef(null);

  // ── Classify ──────────────────────────────────────────────────────────────
  const classify = useCallback(async (file) => {
    if (!file) return;
    setLoading(true); setError(""); setPredictions(null);
    setShowOption(false); setSelectedOpt(null); setConfirmed(false);

    const reader = new FileReader();
    reader.onload = e => setImgSrc(e.target.result);
    reader.readAsDataURL(file);

    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch(`${API}/classify`, { method:"POST", body:form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Server error");
      setPredictions(data);
      if (data.needs_option_panel) setShowOption(true);
    } catch {
      // Fallback: browser simulation
      await new Promise(r => setTimeout(r, 1200));
      const sim = FOOD_SIM[simIdx % FOOD_SIM.length]; simIdx++;
      const topConf = sim[0].confidence;
      const result  = {
        predictions: sim,
        top_confidence: topConf,
        needs_option_panel: topConf < 0.75,
        suggestions: sim.map(s=>s.label),
      };
      setPredictions(result);
      if (result.needs_option_panel) setShowOption(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) classify(file);
    else setError("Please upload a valid image file (JPEG, PNG, WebP).");
  };

  // ── Option panel confirm ──────────────────────────────────────────────────
  const confirmOption = async (label) => {
    setSelectedOpt(label);
    try {
      await fetch(`${API}/option/select`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ frame_id:frameId, predicted_label:predictions?.suggestions?.[0]||"", selected_item:label }),
      });
    } catch{}
    addToInventory(label);
    setShowOption(false); setConfirmed(true);
  };

  // ── Auto-add top result ───────────────────────────────────────────────────
  const addTopResult = () => {
    if (!predictions?.predictions?.[0]) return;
    addToInventory(predictions.predictions[0].label);
    setConfirmed(true);
  };

  // ── Inventory helpers ─────────────────────────────────────────────────────
  const addToInventory = (item) => {
    setInventory(prev => {
      const ex = prev.find(i=>i.name===item);
      if (ex) return prev.map(i=>i.name===item?{...i,qty:i.qty+1}:i);
      return [...prev, { name:item, qty:1, group:CLASS_TO_GROUP[item]||"Other", protein:PROTEIN_DB[item]||1.0 }];
    });
  };
  const removeItem = (name) => setInventory(prev=>prev.filter(i=>i.name!==name));

  // ── Nutrition calc ────────────────────────────────────────────────────────
  const totalProtein = inventory.reduce((sum,i)=>sum+i.protein*i.qty,0);
  const pct          = Math.min(100, (totalProtein/proteinGoal)*100);
  const status       = pct>=100?"surplus":pct>=70?"on-track":"deficit";
  const statusColor  = pct>=100?"var(--green)":pct>=70?"var(--yellow)":"var(--red)";

  const confColor = (c) =>
    c >= 0.75 ? "var(--green)" : c >= 0.5 ? "var(--yellow)" : "var(--red)";

  const RECS = [
    { item:"100g Chicken Breast", protein:31, icon:"🍗" },
    { item:"2 Eggs",              protein:12, icon:"🥚" },
    { item:"100g Paneer",         protein:18, icon:"🧀" },
    { item:"1 cup Lentils",       protein:9,  icon:"🥣" },
  ].filter(()=>status==="deficit");

  return (
    <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"36px 32px" }}>
      <h1 style={{ marginBottom:8, fontSize:"1.8rem" }}>Grocery Classifier Demo</h1>
      <p style={{ marginBottom:32 }}>
        Upload a food image to run real-time inference using the HOG + Ensemble (SVM · RF · LR) pipeline.
        The system returns top-3 predictions and triggers the option panel for low-confidence results.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

        {/* ── LEFT COL ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Upload */}
          <div className="subwindow">
            <div className="subwindow-header">
              <span className="subwindow-title">Image Input</span>
              <span className="tag">HOG + LBP + Color</span>
            </div>
            <div className="subwindow-body">
              <div
                className={`upload-zone${dragOver?" drag-over":""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
              >
                <div className="upload-zone-icon">🔬</div>
                <div style={{ fontWeight:600, color:"var(--text-primary)", marginBottom:6 }}>
                  Drop a food image here
                </div>
                <div style={{ fontSize:"0.8rem", color:"var(--text-muted)", marginBottom:14 }}>
                  or click to browse · JPEG, PNG, WebP
                </div>
                <div className="btn btn-primary" style={{ display:"inline-flex", cursor:"pointer" }}>
                  Choose File
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
                  onChange={e=>handleFile(e.target.files[0])}/>
              </div>

              {error && (
                <div style={{ marginTop:12, padding:"8px 12px", borderRadius:8,
                  background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)",
                  color:"var(--red)", fontSize:"0.82rem" }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {imgSrc && (
            <div className="subwindow">
              <div className="subwindow-header">
                <span className="subwindow-title">Image Preview</span>
                {loading && <span style={{ fontSize:"0.75rem", color:"var(--yellow)" }}>⟳ Processing…</span>}
              </div>
              <div className="subwindow-body">
                <div style={{ position:"relative", borderRadius:10, overflow:"hidden",
                  border:"1px solid var(--border)", background:"#0a0a12" }}>
                  <img src={imgSrc} alt="input" style={{ width:"100%", display:"block",
                    maxHeight:260, objectFit:"contain" }}/>
                  {loading && (
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                      justifyContent:"center", background:"rgba(7,7,13,0.7)", backdropFilter:"blur(4px)" }}>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:"2rem", animation:"spin 1s linear infinite", display:"inline-block" }}>⟳</div>
                        <div style={{ fontSize:"0.8rem", color:"var(--accent)", marginTop:8, fontWeight:600 }}>
                          Running inference…
                        </div>
                        <div style={{ fontSize:"0.7rem", color:"var(--text-muted)", marginTop:4 }}>
                          Scaler → PCA → Ensemble
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COL ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Predictions */}
          {predictions && !loading && (
            <div className="subwindow">
              <div className="subwindow-header">
                <span className="subwindow-title">Model Predictions</span>
                <span className={`badge ${predictions.top_confidence>=0.75?"badge-safe":"badge-warning"}`}>
                  {predictions.top_confidence>=0.75?"High Conf":"Low Conf"}
                </span>
              </div>
              <div className="subwindow-body">
                {predictions.predictions.map((p,i)=>{
                  const group = CLASS_TO_GROUP[p.label]||"Other";
                  const gcolor = GROUP_COLORS[group]||"var(--accent)";
                  return (
                    <div key={i} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          {i===0 && <span style={{ fontSize:"0.7rem", fontWeight:700,
                            background:"rgba(99,102,241,0.15)", color:"var(--accent)",
                            padding:"1px 7px", borderRadius:99 }}>TOP</span>}
                          <span style={{ fontWeight:600, fontSize:"0.9rem" }}>{p.label}</span>
                          <span style={{ fontSize:"0.7rem", color:gcolor,
                            background:`${gcolor}15`, padding:"1px 7px", borderRadius:99 }}>{group}</span>
                        </div>
                        <span style={{ fontWeight:700, color:confColor(p.confidence), fontFamily:"'JetBrains Mono',monospace", fontSize:"0.9rem" }}>
                          {(p.confidence*100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="conf-bar-track">
                        <div className="conf-bar-fill" style={{
                          width:`${p.confidence*100}%`,
                          background:`linear-gradient(to right, ${gcolor}99, ${gcolor})`,
                        }}/>
                      </div>
                    </div>
                  );
                })}

                {/* Add to inventory button */}
                {!showOption && !confirmed && (
                  <button onClick={addTopResult} className="btn btn-success" style={{ width:"100%", marginTop:6, justifyContent:"center" }}>
                    + Add "{predictions.predictions[0]?.label}" to Inventory
                  </button>
                )}
                {confirmed && !showOption && (
                  <div style={{ marginTop:8, padding:"8px 12px", borderRadius:8, textAlign:"center",
                    background:"rgba(34,211,160,0.08)", border:"1px solid rgba(34,211,160,0.2)",
                    color:"var(--green)", fontSize:"0.82rem" }}>
                    ✓ {selectedOpt || predictions.predictions[0]?.label} added to inventory
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Option Panel */}
          {showOption && predictions && (
            <div className="option-panel">
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
                <span style={{ fontSize:"1.2rem" }}>⚠️</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:"0.9rem", color:"var(--yellow)" }}>
                    Low Confidence — Please Confirm
                  </div>
                  <div style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>
                    Top confidence ({(predictions.top_confidence*100).toFixed(1)}%) is below 75% threshold
                  </div>
                </div>
              </div>
              <div style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginBottom:10 }}>
                Select the correct item:
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                {predictions.suggestions.map(s => (
                  <button key={s} className={`option-chip${selectedOpt===s?" selected":""}`}
                    onClick={()=>confirmOption(s)}>
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input className="input" placeholder="Or type item name…" style={{ flex:1 }}
                  onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim())confirmOption(e.target.value.trim());}}/>
                <button className="btn btn-primary" onClick={()=>{
                  const inp = document.querySelector('.option-panel input');
                  if(inp?.value.trim()) confirmOption(inp.value.trim());
                }}>Confirm</button>
              </div>
            </div>
          )}

          {/* Pipeline info */}
          {!predictions && !loading && (
            <div className="subwindow">
              <div className="subwindow-header">
                <span className="subwindow-title">Inference Pipeline</span>
              </div>
              <div className="subwindow-body">
                {[
                  { step:"1", name:"Preprocess",   desc:"Resize to 128×128, BGR → Gray" },
                  { step:"2", name:"HOG",           desc:"9 orientations, 8×8 cells, L2-Hys" },
                  { step:"3", name:"LBP",           desc:"r=1, p=8, uniform, 32-bin hist" },
                  { step:"4", name:"Color Hist",    desc:"RGB + HSV histograms, 32 bins each" },
                  { step:"5", name:"Edge Density",  desc:"Canny edge detector → density scalar" },
                  { step:"6", name:"RobustScaler",  desc:"Normalize feature vector" },
                  { step:"7", name:"PCA (95%)",     desc:"Dimensionality reduction" },
                  { step:"8", name:"Ensemble",      desc:"SVM + RF + LR → soft voting" },
                ].map(s=>(
                  <div key={s.step} style={{ display:"flex", gap:12, padding:"7px 0",
                    borderBottom:"1px solid var(--border)", fontSize:"0.8rem" }}>
                    <span style={{ width:20, height:20, borderRadius:6, flexShrink:0,
                      background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"0.65rem", fontWeight:700, color:"var(--accent)" }}>{s.step}</span>
                    <div>
                      <span style={{ fontWeight:600, color:"var(--text-primary)" }}>{s.name}</span>
                      <span style={{ color:"var(--text-muted)", marginLeft:8 }}>{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row: Inventory + Nutrition + Recommendations ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginTop:24 }}>

        {/* Inventory */}
        <div className="subwindow">
          <div className="subwindow-header">
            <span className="subwindow-title">Inventory</span>
            <span style={{ fontSize:"0.72rem", color:"var(--text-muted)" }}>{inventory.length} items</span>
          </div>
          <div className="subwindow-body" style={{ maxHeight:280, overflowY:"auto" }}>
            {inventory.length === 0 ? (
              <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text-muted)", fontSize:"0.82rem" }}>
                Classify items to build inventory
              </div>
            ) : inventory.map(item=>(
              <div key={item.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0",
                borderBottom:"1px solid var(--border)", fontSize:"0.83rem" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, color:"var(--text-primary)" }}>{item.name}</div>
                  <div style={{ fontSize:"0.72rem", color:GROUP_COLORS[item.group]||"var(--accent)" }}>{item.group}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontWeight:600, color:"var(--text-primary)" }}>×{item.qty}</div>
                  <div style={{ fontSize:"0.7rem", color:"var(--text-muted)" }}>{(item.protein*item.qty).toFixed(1)}g protein</div>
                </div>
                <button onClick={()=>removeItem(item.name)} style={{
                  background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)",
                  color:"var(--red)", borderRadius:6, padding:"3px 7px",
                  cursor:"pointer", fontSize:"0.75rem", flexShrink:0,
                }}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition */}
        <div className="subwindow">
          <div className="subwindow-header">
            <span className="subwindow-title">Nutrition Tracker</span>
            <span className={`badge ${pct>=100?"badge-safe":pct>=70?"badge-warning":"badge-hazard"}`}>
              {status}
            </span>
          </div>
          <div className="subwindow-body">
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>Daily Protein</span>
                <span style={{ fontWeight:700, fontFamily:"'JetBrains Mono',monospace", fontSize:"0.9rem" }}>
                  <span style={{ color:statusColor }}>{totalProtein.toFixed(1)}g</span>
                  <span style={{ color:"var(--text-muted)" }}> / {proteinGoal}g</span>
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{
                  width:`${pct}%`,
                  background:`linear-gradient(to right, ${statusColor}aa, ${statusColor})`,
                  boxShadow:`0 0 8px ${statusColor}66`,
                }}/>
              </div>
              <div style={{ fontSize:"0.72rem", color:"var(--text-muted)", marginTop:4, textAlign:"right" }}>
                {pct.toFixed(0)}% of goal
              </div>
            </div>

            {/* Goal input */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:"0.72rem", color:"var(--text-muted)", marginBottom:6, letterSpacing:"0.05em" }}>
                SET DAILY GOAL (g protein)
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input className="input" type="number" value={goalInput} min={10} max={500}
                  onChange={e=>setGoalInput(e.target.value)} style={{ flex:1 }}/>
                <button className="btn btn-ghost" onClick={async()=>{
                  const g=parseInt(goalInput)||120; setProteinGoal(g);
                  try{ await fetch(`${API}/set-goal`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({protein_goal:g})}); }catch{}
                }}>Set</button>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { label:"Available", value:`${totalProtein.toFixed(1)}g`,  color:statusColor },
                { label:"Goal",      value:`${proteinGoal}g`,              color:"var(--accent)" },
                { label:"Deficit",   value:`${Math.max(0,proteinGoal-totalProtein).toFixed(1)}g`, color:"var(--red)" },
                { label:"Items",     value:inventory.reduce((s,i)=>s+i.qty,0), color:"var(--text-primary)" },
              ].map(s=>(
                <div key={s.label} style={{ padding:"10px 12px", borderRadius:8,
                  background:"rgba(255,255,255,0.02)", border:"1px solid var(--border)" }}>
                  <div style={{ fontSize:"0.65rem", color:"var(--text-muted)", marginBottom:3, letterSpacing:"0.06em" }}>{s.label}</div>
                  <div style={{ fontWeight:700, fontSize:"1.1rem", color:s.color,
                    fontFamily:"'JetBrains Mono',monospace" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="subwindow">
          <div className="subwindow-header">
            <span className="subwindow-title">Recommendations</span>
            <span className="tag">AI Engine</span>
          </div>
          <div className="subwindow-body">
            {status !== "deficit" ? (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:"2rem", marginBottom:8 }}>✅</div>
                <div style={{ fontWeight:600, color:"var(--green)", marginBottom:4 }}>Protein Goal Met!</div>
                <div style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>
                  You have sufficient protein. Add more items to track nutritional balance.
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginBottom:12 }}>
                  Need <strong style={{ color:"var(--red)" }}>{(proteinGoal-totalProtein).toFixed(1)}g more protein</strong> — suggested items:
                </div>
                {RECS.map(r=>(
                  <div key={r.item} className="rec-card">
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <span style={{ fontSize:"1.3rem" }}>{r.icon}</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:"0.85rem" }}>{r.item}</div>
                        <div style={{ fontSize:"0.72rem", color:"var(--text-muted)" }}>+{r.protein}g protein</div>
                      </div>
                    </div>
                    <button className="btn btn-ghost" style={{ fontSize:"0.72rem", padding:"4px 10px" }}
                      onClick={()=>addToInventory(r.item.split(" ").pop())}>
                      + Add
                    </button>
                  </div>
                ))}
                {RECS.length === 0 && (
                  <p style={{ fontSize:"0.8rem" }}>Add food items via the classifier above to generate recommendations.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}