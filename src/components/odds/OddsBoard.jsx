import { useGame } from "../../hooks/useGameState";
import { questions, teams } from "../../data/questions";
import { getOddsRank } from "../../utils/odds";

/**
 * 競馬出馬表風オッズボード
 * 各選択肢（= 出走馬）のオッズ + 投票チームをリアルタイム表示
 * BETモード時はチップ横にBET額、選択肢ごとの合計BET額も表示
 */
export default function OddsBoard() {
  const { state } = useGame();
  const question = questions[state.currentQuestionIndex];
  const isBetMode = state.mode === "bet";

  if (!question) return null;

  if (state.phase === "waiting") {
    return (
      <div className="waiting-screen">
        <div className="waiting-screen__icon">&#127943;</div>
        <p className="waiting-screen__text">ゲート入り中...</p>
        <p className="waiting-screen__sub">管理者の「回答開始」をお待ちください</p>
      </div>
    );
  }

  const isRevealed = state.phase === "revealing" || state.phase === "revealed";

  // 各選択肢に投票したチームを集計（BETモード時はBET額も含む）
  const votesByChoice = {};
  question.choices.forEach((c) => {
    votesByChoice[c.id] = [];
  });
  Object.entries(state.teamAnswers).forEach(([teamId, choiceId]) => {
    if (votesByChoice[choiceId]) {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        votesByChoice[choiceId].push({
          ...team,
          bet: isBetMode ? (state.teamBets[teamId] || 200) : null,
        });
      }
    }
  });

  // BETモード: 選択肢ごとの合計BET額を計算
  const totalBetByChoice = {};
  if (isBetMode) {
    question.choices.forEach((c) => {
      totalBetByChoice[c.id] = votesByChoice[c.id].reduce(
        (sum, v) => sum + (v.bet || 0), 0
      );
    });
  }

  const answeredCount = Object.keys(state.teamAnswers).length;

  return (
    <div className="odds-table-wrap">
      {/* 投票状況サマリー */}
      <div className="odds-table__summary">
        <span className="odds-table__summary-label">投票状況</span>
        <span className="odds-table__summary-count">
          {answeredCount} / {teams.length} チーム
        </span>
        <div className="odds-table__summary-bar">
          <div
            className="odds-table__summary-fill"
            style={{ width: `${(answeredCount / teams.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 出馬表 */}
      <table className="odds-table" role="table">
        <thead>
          <tr>
            <th className="odds-table__th odds-table__th--num">枠</th>
            <th className="odds-table__th odds-table__th--name">出走馬</th>
            <th className="odds-table__th odds-table__th--odds">オッズ</th>
            <th className="odds-table__th odds-table__th--rank">人気</th>
            {isBetMode && (
              <th className="odds-table__th odds-table__th--total-bet">合計BET</th>
            )}
            <th className="odds-table__th odds-table__th--votes">投票チーム</th>
          </tr>
        </thead>
        <tbody>
          {question.choices.map((choice) => {
            const odds = state.odds[choice.id];
            const rank = odds !== undefined ? getOddsRank(odds) : "normal";
            const isCorrect = isRevealed && choice.id === state.revealedAnswer;
            const isIncorrect = isRevealed && choice.id !== state.revealedAnswer;
            const voters = votesByChoice[choice.id] || [];

            const rowClass = [
              "odds-table__row",
              isCorrect ? "odds-table__row--correct" : "",
              isIncorrect ? "odds-table__row--incorrect" : "",
            ]
              .filter(Boolean)
              .join(" ");

            const rankLabel = {
              favorite: "本命",
              normal: "中穴",
              longshot: "大穴",
            };

            return (
              <tr key={choice.id} className={rowClass}>
                <td className="odds-table__cell odds-table__cell--num">
                  <span className={`odds-table__frame odds-table__frame--${choice.id.toLowerCase()}`}>
                    {choice.id}
                  </span>
                </td>
                <td className="odds-table__cell odds-table__cell--name">
                  {choice.text}
                </td>
                <td className="odds-table__cell odds-table__cell--odds">
                  <span className={`odds-value odds-value--${rank}`}>
                    {odds !== undefined ? odds.toFixed(1) : "-.-"}
                  </span>
                  <span className="odds-suffix">倍</span>
                </td>
                <td className="odds-table__cell odds-table__cell--rank">
                  {odds !== undefined && (
                    <span className={`rank-badge rank-badge--${rank}`}>
                      {rankLabel[rank]}
                    </span>
                  )}
                </td>
                {/* BETモード: 合計BET額列 */}
                {isBetMode && (
                  <td className="odds-table__cell odds-table__cell--total-bet">
                    {totalBetByChoice[choice.id] > 0 && (
                      <span className="bet-total">
                        {totalBetByChoice[choice.id].toLocaleString()}
                      </span>
                    )}
                  </td>
                )}
                <td className="odds-table__cell odds-table__cell--votes">
                  <div className="vote-chips">
                    {voters.map((voter) => (
                      <span
                        key={voter.id}
                        className="vote-chip"
                        style={{ backgroundColor: voter.color }}
                      >
                        {voter.name}
                        {/* BETモード: チップ横にBET額を表示 */}
                        {isBetMode && voter.bet && (
                          <span className="vote-chip__bet">{voter.bet}</span>
                        )}
                      </span>
                    ))}
                    {voters.length === 0 && !isRevealed && (
                      <span className="vote-chips__empty">-</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
