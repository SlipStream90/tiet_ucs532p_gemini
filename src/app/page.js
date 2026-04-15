export default function Home() {
  return (
    <>
      <section className="mb-20">
        <h1 className="text-5xl font-semibold tracking-tight text-white mb-6">
          AI Kitchen Safety & Smart Grocery System
        </h1>

        <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
          A real-time contextual monitoring framework that enhances
          kitchen safety and nutritional intelligence through
          structured computer vision pipelines.
        </p>
      </section>

      <section className="space-y-16">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Project Overview
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Traditional surveillance systems record footage but
            fail to interpret object interactions or contextual risks.
            This system introduces modular AI-based spatial reasoning
            and rule-based hazard modeling.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-6">
            Core Capabilities
          </h2>

          <div className="grid md:grid-cols-2 gap-10">
            <FeatureBlock
              title="Hazard Detection"
              description="Identifies unsafe stove usage and sharp object proximity using HOG-based classifiers."
            />
            <FeatureBlock
              title="Spatial Intelligence"
              description="Analyzes interaction proximity and duration to determine contextual risk."
            />
            <FeatureBlock
              title="Smart Grocery Engine"
              description="Aligns detected inventory with user-defined protein goals."
            />
            <FeatureBlock
              title="Rule-Based Decision Layer"
              description="Combines spatial and temporal reasoning for explainable safety classification."
            />
          </div>
        </div>
      </section>
    </>
  );
}

function FeatureBlock({ title, description }) {
  return (
    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
      <h3 className="text-white font-medium mb-3">
        {title}
      </h3>
      <p className="text-zinc-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}