import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useGame } from "../../hooks/useGameState";
import { teams } from "../../data/questions";

/**
 * 最終結果画面: 全問終了後のランキング + 全問題の結果サマリー
 */
export default function FinalResults() {
  const { state } = useGame();

  // ランキング (スコア降順)
  const ranking = teams
    .map((team) => ({
      ...team,
      score: state.scores[team.id] || 0,
      correctCount: state.results.filter(
        (r) => r.teamResults[team.id]?.isCorrect
      ).length,
    }))
    .sort((a, b) => b.score - a.score);

  const winner = ranking[0];

  // 優勝チームの紙吹雪
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [winner.color, "#e2b714", "#ffffff"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [winner.color, "#e2b714", "#ffffff"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [winner.color]);

  return (
    <div className="final-results">
      <div className="final-results__header">
        <h1 className="final-results__title">最終結果</h1>
        <p className="final-results__subtitle">全 {state.results.length} 問終了</p>
      </div>

      {/* 優勝チーム */}
      <div className="final-results__winner">
        <span className="final-results__crown">👑</span>
        <span
          className="final-results__winner-name"
          style={{ color: winner.color }}
        >
          {winner.name}
        </span>
        <span className="final-results__winner-score">
          {winner.score} pt
        </span>
      </div>

      {/* 全チームランキング */}
      <div className="final-results__ranking">
        {ranking.map((team, idx) => (
          <div
            key={team.id}
            className={`final-results__row ${
              idx === 0 ? "final-results__row--first" : ""
            }`}
          >
            <span className="final-results__rank">
              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
            </span>
            <span
              className="final-results__team-color"
              style={{ backgroundColor: team.color }}
            />
            <span className="final-results__team-name">{team.name}</span>
            <span className="final-results__team-correct">
              {team.correctCount}/{state.results.length} 的中
            </span>
            <span className="final-results__team-score">
              {team.score} pt
            </span>
          </div>
        ))}
      </div>

      {/* 全問題サマリー */}
      <div className="final-results__summary">
        <h2 className="final-results__summary-title">問題別結果</h2>
        {state.results.map((result) => (
          <div key={result.questionIndex} className="final-results__q-row">
            <span className="final-results__q-num">
              {result.questionLabel || `Q.${result.questionIndex + 1}`}
            </span>
            <span className="final-results__q-text">
              {result.questionText}
            </span>
            <span className="final-results__q-answer">
              正解: {result.correctAnswer} ({result.correctChoiceText})
            </span>
            <span className="final-results__q-odds">
              {result.odds[result.correctAnswer]?.toFixed(1)}倍
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
