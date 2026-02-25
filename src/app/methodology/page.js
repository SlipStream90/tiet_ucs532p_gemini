export default function Methodology() {
    return (
      <div className="prose prose-invert max-w-none">
        <h1>Methodology</h1>
  
        <p>
          The proposed system follows a structured computer vision and
          machine learning pipeline designed to interpret kitchen activity
          in real time. The methodology emphasizes lightweight computation,
          explainable decision making, and deployability on edge hardware.
        </p>
  
        <h2>System Overview</h2>
        <p>
          The methodology converts raw visual information obtained from
          camera input into meaningful safety and nutritional decisions.
          Each processing stage progressively transforms image data into
          structured representations suitable for analysis.
        </p>
  
        <h2>Step 1: Image Acquisition</h2>
        <p>
          Continuous video frames are captured using a fixed camera placed
          within the kitchen environment. Frames serve as temporal inputs
          enabling activity monitoring over time rather than isolated
          observations.
        </p>
  
        <h2>Step 2: Preprocessing</h2>
        <p>
          Captured frames undergo resizing and grayscale conversion to
          reduce computational complexity while preserving structural
          information required for feature extraction.
        </p>
  
        <h2>Step 3: Feature Extraction using HOG</h2>
        <p>
          Histogram of Oriented Gradients (HOG) is employed to extract
          gradient orientation patterns representing object shape and edge
          distribution. Unlike deep neural networks, HOG provides explicit
          and interpretable feature representations.
        </p>
  
        <p>
          The image is divided into cells where gradient directions are
          computed and normalized across blocks to achieve illumination
          invariance.
        </p>
  
        <h2>Step 4: Machine Learning Classification</h2>
        <p>
          Extracted HOG descriptors are supplied to supervised learning
          models such as Support Vector Machines and Random Forest
          classifiers. These models categorize detected regions into
          predefined classes including:
        </p>
  
        <ul>
          <li>Human presence</li>
          <li>Stove or flame region</li>
          <li>Knife or sharp object</li>
          <li>Food items</li>
        </ul>
  
        <h2>Step 5: Spatial Relationship Analysis</h2>
        <p>
          Object coordinates obtained from classification are analyzed
          geometrically. The Euclidean distance between entities is
          calculated to determine interaction proximity.
        </p>
  
        <pre>
  D = √((x₁ − x₂)² + (y₁ − y₂)²)
        </pre>
  
        <h2>Step 6: Temporal Monitoring</h2>
        <p>
          Safety risks are evaluated across consecutive frames.
          Time-based thresholds prevent false alarms caused by
          momentary detections.
        </p>
  
        <h2>Step 7: Decision Engine</h2>
        <p>
          A rule-based reasoning module combines spatial and temporal
          information to classify system states as safe, warning,
          or hazardous conditions.
        </p>
  
        <h2>Design Philosophy</h2>
        <p>
          The methodology intentionally prioritizes classical computer
          vision techniques to ensure interpretability, computational
          efficiency, and feasibility for real-time embedded deployment.
        </p>
      </div>
    );
  }