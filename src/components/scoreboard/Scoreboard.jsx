import { useGame } from "../../hooks/useGameState";
import { teams } from "../../data/questions";

/**
 * スコアボード
 * - answering/closed: 横型コンパクトストリップ
 * - revealed: 全チームランキングを大きく展開表示
 */
export default function Scoreboard() {
  const { state } = useGame();
  const isExpanded = state.phase === "revealed";

  const sorted = [...teams]
    .map((team) => ({ ...team, score: state.scores[team.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  // 直近のresultからdeltaを取得
  const lastResult = state.results[state.results.length - 1];

  if (isExpanded) {
    return (
      <section className="scoreboard-full" aria-label="スコアランキング">
        <h2 className="scoreboard-full__title">
          {lastResult?.questionLabel || ""} 終了時点 — 総合順位
        </h2>
        <div className="scoreboard-full__list">
          {sorted.map((team, idx) => {
            const delta = lastResult?.teamResults?.[team.id]?.delta || 0;
            return (
              <div
                key={team.id}
                className={`scoreboard-full__row ${idx === 0 ? "scoreboard-full__row--1st" : ""} ${idx === 1 ? "scoreboard-full__row--2nd" : ""} ${idx === 2 ? "scoreboard-full__row--3rd" : ""}`}
              >
                <span className="scoreboard-full__rank">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                </span>
                <span
                  className="scoreboard-full__chip"
                  style={{ backgroundColor: team.color }}
                >
                  {team.name}
                </span>
                <span className="scoreboard-full__name">チーム{team.name}</span>
                <span className="scoreboard-full__score">{team.score}pt</span>
                {delta !== 0 && (
                  <span className={`scoreboard-full__delta ${delta > 0 ? "scoreboard-full__delta--plus" : "scoreboard-full__delta--minus"}`}>
                    {delta > 0 ? "+" : ""}{delta}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // コンパクト表示（投票中・待機中）
  return (
    <section className="score-strip" aria-label="スコアランキング">
      <span className="score-strip__label">順位</span>
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
            <span className={`score-strip__pts ${team.score < 0 ? "score-strip__pts--negative" : ""}`}>
              {team.score > 0 ? "+" : ""}{team.score}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
