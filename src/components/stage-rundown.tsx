import { DEBATE_STAGE_SEQUENCE, stageCopy, type DebateStage } from "@/domain";

export function StageRundown({ current }: { current: DebateStage }) {
  const currentIndex = DEBATE_STAGE_SEQUENCE.indexOf(
    current as (typeof DEBATE_STAGE_SEQUENCE)[number],
  );

  return (
    <ol className="stage-rundown" aria-label="Etapas do debate">
      {DEBATE_STAGE_SEQUENCE.map((stage, index) => {
        const state = current === "completed" || current === "judging"
          ? "done"
          : index < currentIndex
            ? "done"
            : index === currentIndex
              ? "active"
              : "upcoming";
        return (
          <li className={`stage-step stage-step--${state}`} key={stage} aria-current={state === "active" ? "step" : undefined}>
            <span className="stage-index">{String(index + 1).padStart(2, "0")}</span>
            <span>{stageCopy[stage].shortLabel}</span>
          </li>
        );
      })}
    </ol>
  );
}
