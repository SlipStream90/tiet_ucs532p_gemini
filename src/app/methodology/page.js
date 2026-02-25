export default function Methodology() {
    return (
      <>
        <h1>Methodology</h1>
  
        <p>
          The proposed system follows a structured computer vision and
          machine learning pipeline designed to interpret kitchen activity
          in real time. The methodology emphasizes lightweight computation,
          explainable decision-making, and deployability on edge hardware.
        </p>
  
        <div className="divider" />
  
        <h2>System Overview</h2>
        <p>
          Raw visual data obtained from camera input is progressively
          transformed into structured representations suitable for safety
          evaluation and nutritional analysis. Each processing stage refines
          the information hierarchy from pixels to actionable decisions.
        </p>
  
        <div className="divider" />
  
        <h2>Processing Pipeline</h2>
  
        <h3>Step 1: Image Acquisition</h3>
        <p>
          Continuous video frames are captured using a fixed camera
          positioned within the kitchen environment. Temporal continuity
          enables behavior monitoring rather than isolated frame analysis.
        </p>
  
        <h3>Step 2: Preprocessing</h3>
        <p>
          Frames undergo resizing and grayscale conversion to reduce
          computational complexity while preserving structural information
          necessary for gradient-based feature extraction.
        </p>
  
        <h3>Step 3: Feature Extraction (HOG)</h3>
        <p>
          Histogram of Oriented Gradients (HOG) extracts gradient
          orientation patterns representing object shape and edge structure.
          Unlike deep neural networks, HOG provides explicit and interpretable
          feature representations.
        </p>
  
        <p>
          The image is divided into cells where gradient magnitudes and
          orientations are computed and normalized across blocks to achieve
          illumination invariance.
        </p>
  
        <h3>Step 4: Machine Learning Classification</h3>
        <p>
          Extracted HOG descriptors are supplied to supervised learning
          models such as Support Vector Machines and Random Forest
          classifiers. Detected regions are categorized into predefined
          classes including:
        </p>
  
        <ul>
          <li>Human presence</li>
          <li>Stove or flame region</li>
          <li>Knife or sharp object</li>
          <li>Food items</li>
        </ul>
  
        <h3>Step 5: Spatial Relationship Analysis</h3>
        <p>
          Object coordinates are analyzed geometrically to evaluate
          interaction proximity. The Euclidean distance between detected
          entities is computed as:
        </p>
  
        <div className="bg-zinc-900 border border-zinc-800 rounded-md px-6 py-4 text-sm text-zinc-300 font-mono mt-4">
          D = √((x₁ − x₂)² + (y₁ − y₂)²)
        </div>
  
        <h3>Step 6: Temporal Monitoring</h3>
        <p>
          Risk conditions are evaluated across consecutive frames.
          Time-based thresholds mitigate false alarms caused by
          transient detections.
        </p>
  
        <h3>Step 7: Decision Engine</h3>
        <p>
          A rule-based reasoning module integrates spatial and temporal
          parameters to classify system states as safe, warning, or
          hazardous.
        </p>
  
        <div className="divider" />
  
        <h2>Design Philosophy</h2>
        <p>
          The methodology intentionally prioritizes classical computer
          vision techniques to ensure interpretability, computational
          efficiency, and feasibility for real-time embedded deployment.
          The structured pipeline architecture enables modular upgrades
          without architectural redesign.
        </p>
      </>
    );
  }