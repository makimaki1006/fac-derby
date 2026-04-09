import { useGame } from "../../hooks/useGameState";
import { questions } from "../../data/questions";

/**
 * レースヘッダー（競馬場の出走表示風）
 */
export default function QuestionDisplay() {
  const { state } = useGame();
  const question = questions[state.currentQuestionIndex];

  if (!question) return null;

  return (
    <header className="race-banner">
      <div className="race-banner__number">{question.label}</div>
      <div className="race-banner__info">
        <div className="race-banner__name">🏇 {question.raceName}</div>
        <div className="race-banner__question">{question.text}</div>
      </div>
      {state.phase === "answering" && (
        <div className="race-banner__status race-banner__status--live">発売中</div>
      )}
      {state.phase === "closed" && (
        <div className="race-banner__status race-banner__status--closed">締切</div>
      )}
      {(state.phase === "revealing" || state.phase === "revealed") && (
        <div className="race-banner__status race-banner__status--result">確定</div>
      )}
    </header>
  );
}
