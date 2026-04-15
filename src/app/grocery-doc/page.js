export default function GroceryDoc() {
  return (
    <div style={{ maxWidth:"800px", margin:"0 auto", padding:"60px 48px" }}>
      <h1>Smart Grocery Intelligence Module</h1>
      <p>
        The Smart Grocery module extends the kitchen safety framework into a personalized
        nutritional intelligence system — detecting food items visually, mapping them to
        macronutrient values, and generating recommendations to meet dietary goals.
      </p>
      <div className="divider"/>
      <h2>Feature 7: Visual Food Detection</h2>
      <p>
        The same HOG + Ensemble pipeline used for safety detection classifies food items
        present in the environment. Items are mapped to a structured nutritional database
        containing protein values per unit.
      </p>
      <ul>
        <li>20+ food classes across Fruit, Vegetable, Dairy, and Other groups</li>
        <li>Hierarchical coarse (group) → fine (class) classification</li>
        <li>Top-3 predictions returned with calibrated confidence scores</li>
      </ul>
      <div className="divider"/>
      <h2>Feature 8: Assisted Identification (Option Panel)</h2>
      <p style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:10, padding:"14px 16px" }}>
        <strong style={{ color:"var(--yellow)" }}>Critical Feature:</strong> When the model's top
        confidence is below 75%, the system presents an option panel allowing the user to
        confirm or correct the prediction — enabling human-in-the-loop refinement.
      </p>
      <h3>Flow</h3>
      <ul>
        <li>Detection confidence &lt; 0.75 → Option Panel shown</li>
        <li>User selects correct item from top-3 suggestions</li>
        <li>Correction logged to database for future retraining</li>
        <li>Confirmed item added to inventory</li>
      </ul>
      <h3>API</h3>
      <div style={{ background:"rgba(0,0,0,0.3)", border:"1px solid var(--border)", borderRadius:8,
        padding:"14px 18px", fontFamily:"'JetBrains Mono',monospace", fontSize:"0.78rem",
        color:"var(--text-secondary)", marginBottom:24 }}>
        <div style={{ color:"#7dd3fc" }}>POST /option/select</div>
        <div style={{ marginTop:8, color:"var(--text-muted)" }}>
          {"{"}<br/>
          &nbsp;&nbsp;"frame_id": 101,<br/>
          &nbsp;&nbsp;"predicted_label": "Potato",<br/>
          &nbsp;&nbsp;"selected_item": "Egg"<br/>
          {"}"}
        </div>
      </div>
      <div className="divider"/>
      <h2>Feature 9: Nutrition Tracking</h2>
      <p>
        Each identified food item contributes an estimated protein value. Aggregated
        protein availability is compared against the user-defined daily intake goal.
      </p>
      <div style={{ background:"rgba(0,0,0,0.3)", border:"1px solid var(--border)", borderRadius:8,
        padding:"14px 18px", fontFamily:"'JetBrains Mono',monospace", fontSize:"0.78rem",
        color:"var(--text-secondary)" }}>
        <div style={{ color:"#7dd3fc" }}>GET /nutrition</div>
        <div style={{ marginTop:8, color:"var(--text-muted)" }}>
          {"{"}<br/>
          &nbsp;&nbsp;"current_protein": 70,<br/>
          &nbsp;&nbsp;"goal": 120,<br/>
          &nbsp;&nbsp;"deficit": 50,<br/>
          &nbsp;&nbsp;"status": "deficit",<br/>
          &nbsp;&nbsp;"percent": 58.3<br/>
          {"}"}
        </div>
      </div>
      <div className="divider"/>
      <h2>Feature 10: Recommendation Engine</h2>
      <p>
        When nutritional requirements are unmet, the system generates food recommendations
        prioritized by protein density and user dietary constraints.
      </p>
      <ul>
        <li><code>IF protein deficit &gt; 30g → recommend Chicken Breast</code></li>
        <li><code>IF protein deficit &gt; 18g → recommend Paneer</code></li>
        <li><code>IF protein deficit &gt; 9g → recommend Lentils / Eggs</code></li>
      </ul>
      <div className="divider"/>
      <h2>Correction Database Schema</h2>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.85rem" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Field","Type","Description"].map(h=>(
                <th key={h} style={{ textAlign:"left", padding:"8px 16px", color:"var(--text-muted)",
                  fontWeight:600, fontSize:"0.75rem", letterSpacing:"0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["frame_id",       "int",      "Source frame identifier"],
              ["predicted_label","string",   "Model's original prediction"],
              ["actual_label",   "string",   "User-confirmed correct label"],
              ["timestamp",      "float",    "Unix timestamp of correction"],
            ].map(([f,t,d])=>(
              <tr key={f} style={{ borderBottom:"1px solid var(--border)" }}>
                <td style={{ padding:"10px 16px", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:"0.8rem", color:"var(--accent)" }}>{f}</td>
                <td style={{ padding:"10px 16px", color:"var(--text-muted)" }}>{t}</td>
                <td style={{ padding:"10px 16px", color:"var(--text-secondary)" }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
