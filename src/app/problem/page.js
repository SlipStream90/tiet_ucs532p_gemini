export default function Problem() {
  return (
    <div style={{ maxWidth:"800px", margin:"0 auto", padding:"60px 48px" }}>
      <h1>Problem Statement</h1>
      <p>
        Modern kitchens contain heat sources, sharp instruments, combustible materials,
        and perishable food items. Despite widespread surveillance, most monitoring
        solutions remain passive and lack contextual awareness.
      </p>
      <div className="divider"/>
      <h2>Safety Challenges</h2>
      <h3>Unattended Stove & Fire Hazards</h3>
      <p>
        Active gas stoves or open flames left unattended represent a significant fire risk.
        Conventional CCTV systems cannot interpret whether human supervision is present.
        Fire propagation can occur within seconds of operator absence.
      </p>
      <h3>Gas Leak Detection</h3>
      <p>
        Undetected gas leaks near ignition sources create explosive conditions.
        No passive monitoring system currently correlates gas presence with open flames
        to trigger pre-emptive alerts before combustion occurs.
      </p>
      <h3>Unsafe Knife Handling</h3>
      <p>
        Improper placement or erratic motion of sharp tools risks accidental injury.
        Current monitoring does not evaluate spatial proximity between humans
        and hazardous objects over time.
      </p>
      <h3>Lack of Contextual Monitoring</h3>
      <p>
        Existing surveillance records footage without understanding object relationships,
        duration of exposure, or interaction patterns that indicate escalating risk.
      </p>
      <div className="divider"/>
      <h2>Nutritional &amp; Inventory Challenges</h2>
      <h3>Manual Grocery Tracking</h3>
      <p>
        Individuals rely on manual lists to manage grocery inventory. This approach
        is inefficient, prone to inconsistency, and provides no nutritional insight.
      </p>
      <h3>Lack of Nutritional Awareness</h3>
      <p>
        Users frequently fail to meet daily macronutrient targets due to insufficient
        awareness of available food resources and their nutritional composition.
      </p>
      <div className="divider"/>
      <h2>Engineering Formulation</h2>
      <p>The central challenge is to design a lightweight, interpretable computer vision system capable of:</p>
      <ul>
        <li>Detecting relevant kitchen entities in real time (human, stove, fire, knife, gas)</li>
        <li>Analyzing spatial interactions between detected objects</li>
        <li>Evaluating risk based on temporal persistence across multiple frames</li>
        <li>Classifying food items and providing nutritional guidance from detected inventory</li>
      </ul>
      <p>
        The solution must operate on edge hardware, maintain interpretability through
        classical ML, and remain modular for future IoT integration.
      </p>
    </div>
  );
}