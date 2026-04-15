export default function Grocery() {
    return (
      <>
        <h1>Smart Grocery Intelligence Module</h1>
  
        <p>
          The Smart Grocery module extends the kitchen safety framework into
          a personalized nutritional intelligence system capable of analyzing
          food availability and supporting structured dietary planning.
        </p>
  
        <div className="divider" />
  
        <h2>Motivation</h2>
        <p>
          Individuals frequently struggle to maintain consistent nutritional
          intake due to limited awareness of available food resources and
          dietary balance. Manual tracking is inefficient and often inaccurate.
        </p>
  
        <div className="divider" />
  
        <h2>User Goal Definition</h2>
        <p>
          Users specify daily nutritional targets, such as required protein
          intake. These targets function as system-level constraints used to
          evaluate inventory sufficiency and recommendation logic.
        </p>
  
        <div className="divider" />
  
        <h2>Visual Food Identification</h2>
        <p>
          The system reuses the computer vision pipeline to detect food items
          present in the environment. Detected items are mapped to a structured
          nutritional database containing macronutrient values.
        </p>
  
        <h2>Nutritional Estimation</h2>
        <p>
          Each identified food item contributes an estimated protein value.
          Aggregated nutritional availability is computed and compared
          against user-defined intake goals.
        </p>
  
        <div className="divider" />
  
        <h2>Inventory Awareness</h2>
        <p>
          Continuous monitoring enables automatic estimation of food
          availability, reducing dependence on manual grocery tracking
          systems.
        </p>
  
        <div className="divider" />
  
        <h2>Recommendation Engine</h2>
        <p>
          When nutritional requirements are unmet, the system generates
          recommendations restricted to user-authorized preferences
          and dietary constraints.
        </p>
  
        <div className="divider" />
  
        <h2>System Benefits</h2>
        <ul>
          <li>Automated grocery awareness</li>
          <li>Improved nutritional consistency</li>
          <li>Reduced manual inventory tracking</li>
          <li>Personalized dietary support</li>
        </ul>
  
        <div className="divider" />
  
        <h2>Future Extensions</h2>
        <p>
          Future enhancements may include mobile integration, barcode
          scanning support, IoT-enabled pantry monitoring, and adaptive
          dietary analytics.
        </p>
      </>
    );
  }