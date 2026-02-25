export default function Problem() {
    return (
      <>
        <h1>Problem Statement</h1>
  
        <p>
          Modern kitchens are high-activity environments containing
          heat sources, sharp instruments, combustible materials,
          and perishable food items. Despite the presence of
          surveillance systems, most monitoring solutions remain
          passive and lack contextual awareness.
        </p>
  
        <div className="divider" />
  
        <h2>Safety Challenges</h2>
  
        <h3>Unattended Stove Hazards</h3>
        <p>
          Active gas stoves or open flames left unattended represent
          a significant fire risk. Conventional CCTV systems cannot
          interpret whether human supervision is present or absent.
        </p>
  
        <h3>Unsafe Knife Handling</h3>
        <p>
          Improper placement or handling of sharp tools may lead to
          accidental injuries. Current monitoring systems do not
          evaluate spatial proximity between humans and hazardous objects.
        </p>
  
        <h3>Lack of Contextual Monitoring</h3>
        <p>
          Existing surveillance infrastructure records footage without
          understanding object relationships, duration of exposure,
          or interaction patterns.
        </p>
  
        <div className="divider" />
  
        <h2>Nutritional & Inventory Challenges</h2>
  
        <h3>Manual Grocery Tracking</h3>
        <p>
          Individuals frequently rely on manual tracking to manage
          grocery inventory and nutritional intake. This approach is
          inefficient and prone to inconsistency.
        </p>
  
        <h3>Lack of Nutritional Awareness</h3>
        <p>
          Users often fail to meet daily protein or macronutrient
          requirements due to insufficient awareness of available
          food resources.
        </p>
  
        <div className="divider" />
  
        <h2>Engineering Formulation</h2>
  
        <p>
          The central challenge is to design a lightweight,
          interpretable computer vision system capable of:
        </p>
  
        <ul>
          <li>Detecting relevant kitchen entities in real time</li>
          <li>Analyzing spatial interactions between objects</li>
          <li>Evaluating risk based on temporal persistence</li>
          <li>Providing nutritional guidance using detected inventory</li>
        </ul>
  
        <p>
          The solution must operate efficiently on edge hardware,
          maintain interpretability, and allow modular scalability
          for future IoT and automation integration.
        </p>
      </>
    );
  }