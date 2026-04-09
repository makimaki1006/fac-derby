import { useGame } from "../../hooks/useGameState";
import { questions, teams } from "../../data/questions";
import { getOddsRank } from "../../utils/odds";

/**
 * 競馬場オッズボード（ターフビジョン風）
 * 枠番色 + オッズ + 投票チーム + BET額をリアルタイム表示
 */
export default function OddsBoard() {
  const { state } = useGame();
  const question = questions[state.currentQuestionIndex];

  if (!question) return null;

  if (state.phase === "waiting") {
    return (
      <div className="gate-screen">
        <div className="gate-screen__icon">🏇</div>
        <div className="gate-screen__text">GATE IN</div>
        <div className="gate-screen__sub">投票開始をお待ちください</div>
      </div>
    );
  }

  const isRevealed = state.phase === "revealing" || state.phase === "revealed";
  const isClosed = state.phase === "closed";

  // 各選択肢に投票したチームを集計
  const votesByChoice = {};
  question.choices.forEach((c) => { votesByChoice[c.id] = []; });
  Object.entries(state.teamAnswers).forEach(([teamId, choiceId]) => {
    if (votesByChoice[choiceId]) {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        votesByChoice[choiceId].push({
          ...team,
          bet: state.teamBets[teamId] || 200,
        });
      }
    }
  });

  // オッズ順（低い順 = 人気順）でソート
  const sortedChoices = [...question.choices].sort((a, b) => {
    const oa = state.odds[a.id] ?? 99;
    const ob = state.odds[b.id] ?? 99;
    return oa - ob;
  });

  const answeredCount = Object.keys(state.teamAnswers).length;

  return (
    <div className="turfvision">
      {/* ヘッダー: 投票状況 */}
      <div className="turfvision__header">
        <span className="turfvision__type">単勝オッズ</span>
        {isClosed && <span className="turfvision__closed">締切</span>}
        {state.phase === "answering" && (
          <span className="turfvision__live">LIVE</span>
        )}
        <span className="turfvision__count">{answeredCount}/19</span>
      </div>

      {/* 出走馬リスト */}
      <div className="turfvision__list">
        {sortedChoices.map((choice, idx) => {
          const odds = state.odds[choice.id];
          const rank = odds !== undefined ? getOddsRank(odds) : "normal";
          const isCorrect = isRevealed && choice.id === state.revealedAnswer;
          const isWrong = isRevealed && choice.id !== state.revealedAnswer;
          const voters = votesByChoice[choice.id] || [];
          const totalBet = voters.reduce((sum, v) => sum + v.bet, 0);

          const rowClass = [
            "horse-row",
            isCorrect ? "horse-row--win" : "",
            isWrong ? "horse-row--lose" : "",
          ].filter(Boolean).join(" ");

          return (
            <div key={choice.id} className={rowClass}>
              {/* 枠番 */}
              <div className={`horse-row__frame frame--${choice.id.toLowerCase()}`}>
                {choice.id}
              </div>

              {/* 馬名（出走者名） */}
              <div className="horse-row__name">{choice.text}</div>

              {/* 人気順 */}
              <div className="horse-row__popularity">
                {odds !== undefined && (
                  <span className={`popularity popularity--${idx < 3 ? "top" : "other"}`}>
                    {idx + 1}番人気
                  </span>
                )}
              </div>

              {/* オッズ */}
              <div className="horse-row__odds">
                <span className={`odds-num odds-num--${rank}`}>
                  {odds !== undefined ? odds.toFixed(1) : "-.-"}
                </span>
              </div>

              {/* BET合計 */}
              <div className="horse-row__bet-total">
                {totalBet > 0 && <span className="bet-amount">{totalBet.toLocaleString()}</span>}
              </div>

              {/* 投票チーム */}
              <div className="horse-row__voters">
                {voters.map((v) => (
                  <span key={v.id} className="voter-tag" style={{ borderColor: v.color }}>
                    <span className="voter-tag__id" style={{ backgroundColor: v.color }}>{v.name}</span>
                    <span className="voter-tag__bet">{v.bet}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
