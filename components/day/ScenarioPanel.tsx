import type { Scenario } from "@/curriculum/types";

export function ScenarioPanel({ scenario }: { scenario: Scenario }) {
  return (
    <div className="scenario">
      <h2 className="scenario__title">{scenario.title}</h2>
      <div className="prose scenario__situation">
        {scenario.situation.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="scenario__facts">
        <div className="fact-box">
          <div className="fact-box__label">What is known</div>
          <ul>
            {scenario.known.map((fact, index) => (
              <li key={index}>{fact}</li>
            ))}
          </ul>
        </div>
        <div className="fact-box">
          <div className="fact-box__label">What is unknown</div>
          <ul>
            {scenario.unknown.map((fact, index) => (
              <li key={index}>{fact}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="scenario__task">
        <b>Your task:</b> {scenario.task}
      </p>
    </div>
  );
}
