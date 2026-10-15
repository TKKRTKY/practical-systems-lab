import type { CommunicationPractice } from "@/curriculum/types";

export function CommunicationPanel({
  practice,
}: {
  practice: CommunicationPractice;
}) {
  return (
    <div className="stack">
      <p className="field__help">{practice.prompt}</p>

      <div>
        <div className="guidance__heading">Address these</div>
        <ul className="inline-list">
          {practice.questions.map((question, index) => (
            <li key={index}>{question}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="guidance__heading">Example phrasing</div>
        <div className="phrases">
          {practice.examplePhrases.map((phrase, index) => (
            <p className="phrase" key={index}>
              {phrase}
            </p>
          ))}
        </div>
      </div>

      <div>
        <div className="guidance__heading">Writing notes</div>
        <ul className="inline-list">
          {practice.tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
