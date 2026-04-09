import { useGame } from "../../hooks/useGameState";
import { questions } from "../../data/questions";

export default function QuestionDisplay() {
  const { state } = useGame();
  const question = questions[state.currentQuestionIndex];

  if (!question) return null;

  return (
    <header className="race-header" aria-label="レース情報">
      <div className="race-header__badge">{question.label}</div>
      <div className="race-header__info">
        <h1 className="race-header__race-name">
          <span className="race-header__horse">&#127943;</span>
          {question.raceName}
        </h1>
        <p className="race-header__question">{question.text}</p>
      </div>
      <div className="race-header__status">
        {state.phase === "answering" && (
          <span className="race-header__live">LIVE</span>
        )}
        {(state.phase === "revealing" || state.phase === "revealed") && (
          <span className="race-header__result">RESULT</span>
        )}
      </div>
    </header>
  );
}
