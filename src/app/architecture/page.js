export default function Architecture() {
    return (
      <div className="prose prose-invert max-w-none">
        <h1>System Architecture</h1>
  
        <p>
          The system architecture integrates perception, analysis,
          and decision-making modules to transform visual input
          into actionable safety intelligence.
        </p>
  
        <h2>Architectural Layers</h2>
  
        <h3>1. Input Layer</h3>
        <p>
          A camera continuously captures the kitchen environment,
          providing real-time visual data to the processing pipeline.
        </p>
  
        <h3>2. Vision Processing Layer</h3>
        <p>
          Image frames undergo preprocessing followed by HOG feature
          extraction. This layer converts pixel information into
          structured descriptors representing object geometry.
        </p>
  
        <h3>3. Classification Layer</h3>
        <p>
          Machine learning classifiers interpret extracted features
          to recognize relevant kitchen entities including humans,
          appliances, and food items.
        </p>
  
        <h3>4. Interaction Analysis Layer</h3>
        <p>
          Detected objects are spatially correlated to understand
          interactions such as human proximity to stove regions
          or unsafe tool positioning.
        </p>
  
        <h3>5. Decision Layer</h3>
        <p>
          Logical rules evaluate risk conditions using distance,
          duration, and object state information.
        </p>
  
        <h3>6. Output Layer</h3>
        <p>
          Alerts or system notifications are generated when hazardous
          scenarios or nutritional deficiencies are detected.
        </p>
  
        <h2>Modularity</h2>
        <p>
          The architecture is modular, allowing independent replacement
          of classifiers, sensors, or monitoring strategies without
          redesigning the entire system.
        </p>
  
        <h2>Scalability</h2>
        <p>
          Future extensions may include IoT integration, automated
          gas shutoff mechanisms, or cloud-based analytics.
        </p>
      </div>
    );
  }