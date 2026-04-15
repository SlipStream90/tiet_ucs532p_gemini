export default function Architecture() {
    return (
      <>
        <h1>System Architecture</h1>
  
        <p>
          The system architecture integrates perception, structured analysis,
          and rule-based decision modeling to transform raw visual input into
          actionable safety intelligence.
        </p>
  
        <div className="divider" />
  
        <h2>Architectural Layers</h2>
  
        <h3>1. Input Layer</h3>
        <p>
          A camera continuously captures the kitchen environment,
          supplying real-time visual data to the processing pipeline.
          This layer functions as the primary sensory interface.
        </p>
  
        <h3>2. Vision Processing Layer</h3>
        <p>
          Captured frames undergo preprocessing operations such as resizing,
          normalization, and noise reduction. Histogram of Oriented Gradients
          (HOG) feature extraction converts pixel-level information into
          structured geometric descriptors.
        </p>
  
        <h3>3. Classification Layer</h3>
        <p>
          Classical machine learning classifiers interpret extracted features
          to identify relevant entities including humans, kitchen appliances,
          tools, and food items.
        </p>
  
        <h3>4. Interaction Analysis Layer</h3>
        <p>
          Detected objects are spatially correlated using bounding box
          relationships to understand contextual interactions, such as
          human proximity to active stove regions or unsafe tool placement.
        </p>
  
        <h3>5. Decision Layer</h3>
        <p>
          Rule-based logic evaluates risk conditions using parameters such as
          spatial distance, interaction duration, and object state to determine
          safety severity levels.
        </p>
  
        <h3>6. Output Layer</h3>
        <p>
          Alerts, notifications, or recommendations are generated when hazardous
          scenarios or nutritional imbalances are detected.
        </p>
  
        <div className="divider" />
  
        <h2>Design Principles</h2>
  
        <h3>Modularity</h3>
        <p>
          Each architectural layer operates independently, enabling replacement
          of classifiers, sensors, or monitoring strategies without requiring
          full system redesign.
        </p>
  
        <h3>Scalability</h3>
        <p>
          The framework supports future integration with IoT devices,
          automated gas shutoff mechanisms, cloud-based monitoring,
          and remote analytics dashboards.
        </p>
  
        <h3>Interpretability</h3>
        <p>
          The system prioritizes transparent classical machine learning and
          rule-based reasoning to ensure explainable decision outcomes,
          suitable for academic and engineering evaluation.
        </p>
      </>
    );
  }