import { useState } from "react";
import { useGame } from "../../hooks/useGameState";
import { questions } from "../../data/questions";
import { resetGameAPI, isConnected } from "../../utils/api";
import { formUrls as staticFormUrls } from "../../data/forms";

export default function AdminPanel() {
  const { state, actions } = useGame();
  const [confirming, setConfirming] = useState(null);
  const isAdmin =
    new URLSearchParams(window.location.search).get("admin") === "true";

  if (!isAdmin) return null;

  const isFirstQuestion = state.currentQuestionIndex === 0;
  const isLastQuestion = state.currentQuestionIndex >= questions.length - 1;
  const currentQuestion = questions[state.currentQuestionIndex];
  const currentFormUrl = staticFormUrls[currentQuestion.id];

  const phaseLabels = {
    waiting: "待機中",
    answering: "投票受付中",
    closed: "投票締切",
    revealing: "結果発表中",
    revealed: "発表完了",
    finished: "ゲーム終了",
  };

  const handleConfirmAnswer = () => {
    actions.revealAnswer(confirming);
    setConfirming(null);
  };

  const handleReset = async () => {
    if (window.confirm("ゲームをリセットしますか？")) {
      await resetGameAPI();
      actions.resetGame();
    }
  };

  const answeredCount = Object.keys(state.teamAnswers).length;

  return (
    <div className="admin-panel" role="region" aria-label="管理者パネル">
      <div className="admin-panel__header">
        <span className="admin-panel__title">ADMIN</span>
        <span className="admin-panel__status">
          {isConnected() ? "GAS接続" : "モック"}
        </span>
        <span className="admin-panel__info">
          {currentQuestion?.label} / {questions.length}問 —{" "}
          <span className="admin-panel__phase">
            {phaseLabels[state.phase]}
          </span>
          {(state.phase === "answering" || state.phase === "closed") && (
            <span className="admin-panel__vote-count">
              {" "}({answeredCount}/19チーム投票済)
            </span>
          )}
        </span>
      </div>

      {/* フォームURL */}
      {currentFormUrl && (
        <div className="admin-panel__form-url">
          <span>フォーム:</span>
          <a href={currentFormUrl} target="_blank" rel="noopener noreferrer">
            {currentFormUrl}
          </a>
          <button
            className="admin-panel__btn admin-panel__btn--copy"
            onClick={() => navigator.clipboard.writeText(currentFormUrl)}
          >
            コピー
          </button>
        </div>
      )}

      <div className="admin-panel__controls">
        {/* 前の問題 */}
        <button
          className="admin-panel__btn admin-panel__btn--prev"
          onClick={actions.prevQuestion}
          disabled={isFirstQuestion || state.phase !== "waiting"}
        >
          ◀ 前の問題
        </button>

        {/* 待機中 → 回答開始 */}
        {state.phase === "waiting" && (
          <button
            className="admin-panel__btn admin-panel__btn--start"
            onClick={actions.startQuestion}
          >
            ▶ 投票開始
          </button>
        )}

        {/* 回答受付中 → 投票締切 */}
        {state.phase === "answering" && (
          <button
            className="admin-panel__btn admin-panel__btn--close"
            onClick={actions.closeBetting}
          >
            🔒 投票締切
          </button>
        )}

        {/* 投票締切後 → 正解選択 */}
        {state.phase === "closed" && !confirming && (
          <div className="admin-panel__answer-select">
            <span className="admin-panel__answer-label">正解を選択:</span>
            {currentQuestion.choices.map((choice) => (
              <button
                key={choice.id}
                className="admin-panel__btn admin-panel__btn--answer"
                onClick={() => setConfirming(choice.id)}
              >
                {choice.id}
              </button>
            ))}
          </div>
        )}

        {/* 正解確認 */}
        {confirming && (
          <div className="admin-panel__confirm">
            <span className="admin-panel__confirm-text">
              「{confirming}」を正解にしますか？
            </span>
            <button
              className="admin-panel__btn admin-panel__btn--confirm-yes"
              onClick={handleConfirmAnswer}
            >
              ✓ 確定
            </button>
            <button
              className="admin-panel__btn admin-panel__btn--confirm-no"
              onClick={() => setConfirming(null)}
            >
              ✕ 取消
            </button>
          </div>
        )}

        {/* 次の問題 or 最終結果 */}
        {isLastQuestion && state.phase === "revealed" ? (
          <button
            className="admin-panel__btn admin-panel__btn--finish"
            onClick={actions.finishGame}
          >
            🏁 最終結果へ
          </button>
        ) : (
          <button
            className="admin-panel__btn admin-panel__btn--next"
            onClick={actions.nextQuestion}
            disabled={isLastQuestion || state.phase !== "revealed"}
          >
            次の問題 ▶
          </button>
        )}

        <button
          className="admin-panel__btn admin-panel__btn--reset"
          onClick={handleReset}
        >
          リセット
        </button>
      </div>
    </div>
  );
}
