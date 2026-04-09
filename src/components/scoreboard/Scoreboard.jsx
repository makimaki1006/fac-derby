import { useGame } from "../../hooks/useGameState";
import { teams } from "../../data/questions";

/**
 * 横型コンパクトスコアランキング
 * 上位はゴールド/シルバー/ブロンズ強調
 * BETモード時は累積損益を表示
 */
export default function Scoreboard() {
  const { state } = useGame();
  const isBetMode = state.mode === "bet";

  const sorted = [...teams]
    .map((team) => ({ ...team, score: state.scores[team.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <section className="score-strip" aria-label="スコアランキング">
      <span className="score-strip__label">
        {isBetMode ? "損益" : "順位"}
      </span>
      <div className="score-strip__list">
        {sorted.map((team, idx) => (
          <div
            key={team.id}
            className={`score-strip__item ${idx < 3 ? `score-strip__item--top${idx + 1}` : ""}`}
          >
            <span className="score-strip__rank">
              {idx === 0 ? "\uD83E\uDD47" : idx === 1 ? "\uD83E\uDD48" : idx === 2 ? "\uD83E\uDD49" : `${idx + 1}`}
            </span>
            <span
              className="score-strip__chip"
              style={{ backgroundColor: team.color }}
            >
              {team.name}
            </span>
            <span className={`score-strip__pts ${isBetMode && team.score < 0 ? "score-strip__pts--negative" : ""}`}>
              {isBetMode && team.score > 0 ? "+" : ""}{team.score}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
