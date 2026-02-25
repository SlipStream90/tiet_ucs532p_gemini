export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <div className="relative mb-20">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600/20 blur-3xl rounded-full" />
        <div className="absolute -top-10 right-0 w-72 h-72 bg-blue-600/20 blur-3xl rounded-full" />

        <h1 className="text-5xl font-semibold tracking-tight mb-6">
          AI Kitchen Safety & Smart Grocery System
        </h1>

        <p className="text-xl text-zinc-400 max-w-3xl leading-relaxed">
          A real-time intelligent monitoring framework designed to enhance
          kitchen safety through contextual computer vision and structured
          decision modeling.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-24">
        <FeatureCard
          title="Hazard Detection"
          desc="Identifies unsafe stove usage, sharp object proximity, and risk conditions using HOG-based classifiers."
        />
        <FeatureCard
          title="Spatial Intelligence"
          desc="Analyzes bounding-box proximity and interaction duration to determine contextual safety levels."
        />
        <FeatureCard
          title="Smart Grocery Engine"
          desc="Evaluates detected food items and aligns nutritional availability with protein intake goals."
        />
        <FeatureCard
          title="Rule-Based Decisions"
          desc="Combines temporal and spatial reasoning to classify system states into safe, warning, or hazard."
        />
      </div>

      {/* Technical Stack */}
      <h2>Technical Stack</h2>
      <div className="divider" />

      <ul>
        <li>Histogram of Oriented Gradients (HOG)</li>
        <li>Classical Machine Learning</li>
        <li>Bounding Box Spatial Analysis</li>
        <li>Rule-Based Decision Engine</li>
      </ul>
    </>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 transition-all duration-300">
      <h3 className="text-lg font-semibold text-white mb-3">
        {title}
      </h3>
      <p className="text-zinc-400 text-sm leading-relaxed">
        {desc}
      </p>
    </div>
  );
}