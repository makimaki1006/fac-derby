import { useGame } from "../../hooks/useGameState";
import { teams } from "../../data/questions";

/**
 * 結果履歴: 各問題の正解・オッズ・チーム別結果を表示
 */
export default function ResultHistory() {
  const { state } = useGame();

  if (state.results.length === 0) return null;

  return (
    <section className="result-history" aria-label="結果履歴">
      <h3 className="result-history__title">結果履歴</h3>
      <div className="result-history__list">
        {state.results.map((result, idx) => (
          <div key={idx} className="result-history__item">
            <div className="result-history__question">
              <span className="result-history__q-num">{result.questionLabel || `Q.${result.questionIndex + 1}`}</span>
              <span className="result-history__q-text">{result.questionText}</span>
              <span className="result-history__answer">
                正解: {result.correctAnswer} ({result.correctChoiceText})
                <span className="result-history__odds-value">
                  {result.odds[result.correctAnswer]?.toFixed(1)}倍
                </span>
              </span>
            </div>
            <div className="result-history__teams">
              {teams.map((team) => {
                const tr = result.teamResults[team.id];
                if (!tr || !tr.answer) return null;
                return (
                  <span
                    key={team.id}
                    className={`result-history__team ${
                      tr.isCorrect
                        ? "result-history__team--correct"
                        : "result-history__team--wrong"
                    }`}
                  >
                    {team.name}: {tr.answer}
                    {tr.isCorrect ? ` (+${tr.delta})` : ` (${tr.delta})`}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
