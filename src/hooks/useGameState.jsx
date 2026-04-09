import { createContext, useContext, useReducer, useCallback } from "react";
import { questions, teams } from "../data/questions";
import { calculateOdds } from "../utils/odds";
import { calculateScores, getScoreDelta } from "../utils/scoring";
import { calculateScoresWithBet, getScoreDeltaWithBet } from "../utils/scoring";

const ActionTypes = {
  START_QUESTION: "START_QUESTION",
  UPDATE_ANSWERS: "UPDATE_ANSWERS",
  CLOSE_BETTING: "CLOSE_BETTING",
  REVEAL_ANSWER: "REVEAL_ANSWER",
  COMPLETE_REVEAL: "COMPLETE_REVEAL",
  NEXT_QUESTION: "NEXT_QUESTION",
  PREV_QUESTION: "PREV_QUESTION",
  FINISH_GAME: "FINISH_GAME",
  RESET_GAME: "RESET_GAME",
};

/**
 * 初期ステートを生成
 * @param {string} mode - "simple" | "bet"
 */
function createInitialState(mode = "simple") {
  const initialScores = {};
  teams.forEach((team) => {
    initialScores[team.id] = 0;
  });

  return {
    phase: "waiting", // waiting | answering | closed | revealing | revealed | finished
    currentQuestionIndex: 0,
    teamAnswers: {},
    teamBets: {}, // BETモード用: { teamId: betAmount }
    scores: initialScores,
    odds: {},
    revealedAnswer: null,
    results: [],
    mode, // "simple" | "bet"
  };
}

function gameReducer(state, action) {
  switch (action.type) {
    case ActionTypes.START_QUESTION: {
      return {
        ...state,
        phase: "answering",
        teamAnswers: {},
        teamBets: {},
        odds: {},
        revealedAnswer: null,
      };
    }

    case ActionTypes.UPDATE_ANSWERS: {
      const { teamAnswers, teamBets } = action.payload;
      const currentQuestion = questions[state.currentQuestionIndex];
      const newOdds = calculateOdds(
        currentQuestion.choices,
        teamAnswers,
        teams.length
      );
      return {
        ...state,
        teamAnswers,
        teamBets: teamBets || state.teamBets,
        odds: newOdds,
      };
    }

    case ActionTypes.CLOSE_BETTING: {
      return { ...state, phase: "closed" };
    }

    case ActionTypes.REVEAL_ANSWER: {
      const { correctAnswer } = action.payload;
      return { ...state, phase: "revealing", revealedAnswer: correctAnswer };
    }

    case ActionTypes.COMPLETE_REVEAL: {
      const currentQuestion = questions[state.currentQuestionIndex];
      const correctAnswer = state.revealedAnswer;

      // モードに応じたスコア計算
      const newScores = state.mode === "bet"
        ? calculateScoresWithBet(
            state.scores, state.teamAnswers, state.teamBets, correctAnswer, state.odds
          )
        : calculateScores(
            state.scores, state.teamAnswers, correctAnswer, state.odds
          );

      const teamResults = {};
      teams.forEach((team) => {
        // モードに応じたdelta計算
        const delta = state.mode === "bet"
          ? getScoreDeltaWithBet(
              team.id, state.teamAnswers, state.teamBets, correctAnswer, state.odds
            )
          : getScoreDelta(
              team.id, state.teamAnswers, correctAnswer, state.odds
            );
        teamResults[team.id] = {
          answer: state.teamAnswers[team.id] || null,
          bet: state.mode === "bet" ? (state.teamBets[team.id] || null) : null,
          delta,
          isCorrect: state.teamAnswers[team.id] === correctAnswer,
        };
      });

      const result = {
        questionIndex: state.currentQuestionIndex,
        questionLabel: currentQuestion.label,
        questionText: currentQuestion.text,
        correctAnswer,
        correctChoiceText: currentQuestion.choices.find(
          (c) => c.id === correctAnswer
        )?.text,
        odds: { ...state.odds },
        teamBets: state.mode === "bet" ? { ...state.teamBets } : null,
        teamResults,
      };

      return {
        ...state,
        phase: "revealed",
        scores: newScores,
        results: [...state.results, result],
      };
    }

    case ActionTypes.NEXT_QUESTION: {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= questions.length) return state;

      // 例題から本番に移る時はスコアと結果履歴をリセット
      const currentQ = questions[state.currentQuestionIndex];
      const resetScores = currentQ.isPractice;
      const cleanScores = {};
      if (resetScores) {
        teams.forEach((t) => { cleanScores[t.id] = 0; });
      }

      return {
        ...state,
        phase: "waiting",
        currentQuestionIndex: nextIndex,
        teamAnswers: {},
        teamBets: {},
        odds: {},
        revealedAnswer: null,
        ...(resetScores ? { scores: cleanScores, results: [] } : {}),
      };
    }

    case ActionTypes.PREV_QUESTION: {
      const prevIndex = state.currentQuestionIndex - 1;
      if (prevIndex < 0) return state;
      return {
        ...state,
        phase: "waiting",
        currentQuestionIndex: prevIndex,
        teamAnswers: {},
        teamBets: {},
        odds: {},
        revealedAnswer: null,
      };
    }

    case ActionTypes.FINISH_GAME: {
      return { ...state, phase: "finished" };
    }

    case ActionTypes.RESET_GAME: {
      return createInitialState(state.mode);
    }

    default:
      return state;
  }
}

const GameContext = createContext(null);

/**
 * ゲーム状態プロバイダー
 * @param {Object} props
 * @param {string} props.mode - "simple" | "bet"
 * @param {React.ReactNode} props.children
 */
export function GameProvider({ mode = "simple", children }) {
  const [state, dispatch] = useReducer(
    gameReducer,
    mode,
    createInitialState
  );
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame は GameProvider 内で使用してください");
  }
  const { state, dispatch } = context;

  const startQuestion = useCallback(() => {
    dispatch({ type: ActionTypes.START_QUESTION });
  }, [dispatch]);

  /**
   * 回答を更新（BETモード時はbetsも受け取る）
   * @param {Object} teamAnswers - { teamId: choiceId }
   * @param {Object} [teamBets] - { teamId: betAmount } BETモード用
   */
  const updateAnswers = useCallback(
    (teamAnswers, teamBets) => {
      dispatch({
        type: ActionTypes.UPDATE_ANSWERS,
        payload: { teamAnswers, teamBets },
      });
    },
    [dispatch]
  );

  const closeBetting = useCallback(() => {
    dispatch({ type: ActionTypes.CLOSE_BETTING });
  }, [dispatch]);

  const revealAnswer = useCallback(
    (correctAnswer) => {
      dispatch({ type: ActionTypes.REVEAL_ANSWER, payload: { correctAnswer } });
    },
    [dispatch]
  );

  const completeReveal = useCallback(() => {
    dispatch({ type: ActionTypes.COMPLETE_REVEAL });
  }, [dispatch]);

  const nextQuestion = useCallback(() => {
    dispatch({ type: ActionTypes.NEXT_QUESTION });
  }, [dispatch]);

  const prevQuestion = useCallback(() => {
    dispatch({ type: ActionTypes.PREV_QUESTION });
  }, [dispatch]);

  const finishGame = useCallback(() => {
    dispatch({ type: ActionTypes.FINISH_GAME });
  }, [dispatch]);

  const resetGame = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_GAME });
  }, [dispatch]);

  return {
    state,
    dispatch,
    actions: {
      startQuestion,
      updateAnswers,
      closeBetting,
      revealAnswer,
      completeReveal,
      nextQuestion,
      prevQuestion,
      finishGame,
      resetGame,
    },
  };
}
