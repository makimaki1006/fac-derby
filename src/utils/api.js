const GAS_URL = import.meta.env.VITE_GAS_URL || "";

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

/**
 * チームの回答を取得（GETベース）
 * GAS API: GET /exec?q={questionId} → { answers: {}, bets: {} }
 */
export async function fetchTeamAnswers(questionId, choices, teams) {
  if (!GAS_URL) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(generateMockAnswersWithBets(questionId, choices, teams)), 300);
    });
  }

  try {
    const response = await fetch(`${GAS_URL}?q=${questionId}`);
    const data = await response.json();
    return { answers: data.answers || {}, bets: data.bets || {} };
  } catch (error) {
    console.error("fetchTeamAnswers API error:", error);
    return { answers: {}, bets: {} };
  }
}

/**
 * ゲームリセット（全フォーム回答削除）
 * GAS API: GET /exec?action=reset
 */
export async function resetGameAPI() {
  if (!GAS_URL) return { success: true, mock: true };

  try {
    const response = await fetch(`${GAS_URL}?action=reset`);
    return await response.json();
  } catch (error) {
    console.error("resetGame API error:", error);
    return { success: false, error: error.message };
  }
}

export function isConnected() {
  return !!GAS_URL;
}
