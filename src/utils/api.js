const GAS_URL = import.meta.env.VITE_GAS_URL || "";

function generateMockAnswers(questionId, choices, teams) {
  const answers = {};
  teams.forEach((team) => {
    if (Math.random() < 0.7) {
      const randomChoice = choices[Math.floor(Math.random() * choices.length)];
      answers[team.id] = randomChoice.id;
    }
  });
  return answers;
}

/**
 * BETモード用モック回答+BET額を生成
 * BET額は 200/400/600/800/1000 のいずれか
 */
function generateMockAnswersWithBets(questionId, choices, teams) {
  const answers = {};
  const bets = {};
  const betOptions = [200, 400, 600, 800, 1000];
  teams.forEach((team) => {
    if (Math.random() < 0.7) {
      const randomChoice = choices[Math.floor(Math.random() * choices.length)];
      answers[team.id] = randomChoice.id;
      bets[team.id] = betOptions[Math.floor(Math.random() * betOptions.length)];
    }
  });
  return { answers, bets };
}

async function postToGAS(payload) {
  const response = await fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.json();
}

/**
 * チームの回答状況を取得 (問題ごとのシートから)
 */
/**
 * チームの回答状況を取得
 * @param {string} questionId - 問題ID
 * @param {Array} choices - 選択肢配列
 * @param {Array} teams - チーム配列
 * @param {string} mode - "simple" | "bet"
 * @returns {Object} simpleモード: { teamId: choiceId }, betモード: { answers: {}, bets: {} }
 */
export async function fetchTeamAnswers(questionId, choices, teams, mode = "simple") {
  if (!GAS_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (mode === "bet") {
          resolve(generateMockAnswersWithBets(questionId, choices, teams));
        } else {
          resolve(generateMockAnswers(questionId, choices, teams));
        }
      }, 300);
    });
  }

  try {
    const data = await postToGAS({ action: "getAnswers", questionId, mode });
    if (mode === "bet") {
      return { answers: data.answers || {}, bets: data.bets || {} };
    }
    return data.answers || {};
  } catch (error) {
    console.error("fetchTeamAnswers API error:", error);
    if (mode === "bet") return { answers: {}, bets: {} };
    return {};
  }
}

/**
 * 全問題のフォームURLを取得
 * @returns {Object} { questionId: formUrl }
 */
export async function fetchFormUrls() {
  if (!GAS_URL) return {};

  try {
    const data = await postToGAS({ action: "getFormUrls" });
    return data || {};
  } catch (error) {
    console.error("fetchFormUrls API error:", error);
    return {};
  }
}

/**
 * ゲームリセット (全シートのデータクリア)
 */
export async function resetGameAPI() {
  if (!GAS_URL) return { success: true, mock: true };

  try {
    return await postToGAS({ action: "resetGame" });
  } catch (error) {
    console.error("resetGame API error:", error);
    return { success: false, error: error.message };
  }
}

export function isConnected() {
  return !!GAS_URL;
}
