export default function Grocery() {
    return (
      <div className="prose prose-invert max-w-none">
        <h1>Smart Grocery Intelligence Module</h1>
  
        <p>
          The Smart Grocery module extends the safety monitoring
          framework into a personalized nutritional assistance
          system capable of analyzing food availability and
          supporting dietary planning.
        </p>
  
        <h2>Motivation</h2>
        <p>
          Individuals frequently struggle to maintain consistent
          nutritional intake due to lack of awareness regarding
          available food resources and dietary balance.
        </p>
  
        <h2>User Goal Definition</h2>
        <p>
          Users specify daily nutritional targets such as protein
          intake requirements. These targets act as reference
          constraints for system evaluation.
        </p>
  
        <h2>Visual Food Identification</h2>
        <p>
          Using the existing vision pipeline, the system detects
          food items present within the kitchen environment.
          Identified items are mapped to a predefined nutritional
          database.
        </p>
  
        <h2>Nutritional Estimation</h2>
        <p>
          Each detected food item contributes an estimated protein
          value. Aggregated nutritional availability is compared
          against user-defined goals.
        </p>
  
        <h2>Inventory Awareness</h2>
        <p>
          Continuous monitoring enables automatic estimation of
          food availability, reducing dependence on manual grocery
          tracking.
        </p>
  
        <h2>Recommendation Engine</h2>
        <p>
          When nutritional requirements are unmet, the system
          recommends alternative protein sources restricted to
          user-authorized preferences.
        </p>
  
        <h2>System Benefits</h2>
        <ul>
          <li>Automated grocery awareness</li>
          <li>Nutritional consistency</li>
          <li>Reduced manual tracking</li>
          <li>Personalized dietary assistance</li>
        </ul>
  
        <h2>Future Extensions</h2>
        <p>
          Integration with mobile applications, barcode scanning,
          and smart inventory systems can further enhance
          decision accuracy.
        </p>
      </div>
    );
  }