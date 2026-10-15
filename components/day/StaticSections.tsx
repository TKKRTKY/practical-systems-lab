import { CopyButton } from "@/components/ui/CopyButton";
import type {
  CommandExample,
  Explanation,
  KeyConcept,
} from "@/curriculum/types";

export function ConceptList({ concepts }: { concepts: KeyConcept[] }) {
  return (
    <div className="concepts">
      {concepts.map((concept) => (
        <div className="concept" key={concept.term}>
          <div className="concept__term">{concept.term}</div>
          <div className="concept__summary">{concept.summary}</div>
        </div>
      ))}
    </div>
  );
}

export function ExplanationList({
  explanations,
}: {
  explanations: Explanation[];
}) {
  return (
    <div className="prose">
      {explanations.map((explanation) => (
        <div key={explanation.heading}>
          <h3>{explanation.heading}</h3>
          {explanation.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CommandList({ commands }: { commands: CommandExample[] }) {
  return (
    <div className="commands">
      {commands.map((command) => (
        <div className="command" key={command.command}>
          <div className="command__bar">
            <code className="command__code">{command.command}</code>
            <CopyButton value={command.command} />
          </div>
          <div className="command__body">
            <p className="command__purpose">{command.purpose}</p>
            {command.lookFor && (
              <p className="command__look">
                <b>Look for:</b> {command.lookFor}
              </p>
            )}
            {command.caution && (
              <p className="command__caution">
                <b>Note:</b> {command.caution}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
