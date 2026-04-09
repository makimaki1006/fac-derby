import { useCallback } from "react";
import { useGame } from "../../hooks/useGameState";
import { usePolling } from "../../hooks/usePolling";
import { fetchTeamAnswers } from "../../utils/api";
import { questions, teams } from "../../data/questions";
import QuestionDisplay from "../question/QuestionDisplay";
import OddsBoard from "../odds/OddsBoard";
import TeamStatus from "../teams/TeamStatus";
import Scoreboard from "../scoreboard/Scoreboard";
import ResultHistory from "../scoreboard/ResultHistory";
import FinalResults from "../scoreboard/FinalResults";
import AdminPanel from "../admin/AdminPanel";
import ConfettiEffect from "../effects/ConfettiEffect";
import RevealAnimation from "../effects/RevealAnimation";

export default function Dashboard() {
  const { state, actions } = useGame();
  const currentQuestion = questions[state.currentQuestionIndex];

  /**
   * 回答ポーリング
   * BETモード時は answers + bets の両方を取得して更新
   */
  const pollAnswers = useCallback(async () => {
    if (state.phase !== "answering" || !currentQuestion) return;
    const result = await fetchTeamAnswers(
      currentQuestion.id,
      currentQuestion.choices,
      teams,
      state.mode
    );

    if (state.mode === "bet") {
      // BETモード: { answers, bets } を受け取る
      actions.updateAnswers(result.answers, result.bets);
    } else {
      // 単勝モード: answers のみ
      actions.updateAnswers(result);
    }
  }, [state.phase, state.mode, currentQuestion, actions]);

  usePolling(pollAnswers, 5000, state.phase === "answering");

  // 最終結果画面
  if (state.phase === "finished") {
    return (
      <div className="derby">
        <FinalResults />
        <AdminPanel />
      </div>
    );
  }

  return (
    <div className="derby">
      {/* レースヘッダー */}
      <QuestionDisplay />

      {/* チーム回答状況バー */}
      <TeamStatus />

      {/* メイン: 出馬表オッズボード */}
      <main className="derby__main">
        <OddsBoard />
      </main>

      {/* スコアランキングバー */}
      <Scoreboard />

      {/* 結果履歴 */}
      <ResultHistory />

      {/* 管理者パネル */}
      <AdminPanel />

      {/* エフェクト */}
      <ConfettiEffect />
      <RevealAnimation />
    </div>
  );
}
