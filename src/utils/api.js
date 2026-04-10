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
 * GAS APIをfetchで呼び出す
 * GASは302リダイレクトするため、JSONP風のscriptタグ方式でフォールバック
 */
async function callGAS(params) {
  const url = `${GAS_URL}?${new URLSearchParams(params).toString()}`;

  // まずfetchを試す
  try {
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // CORSエラーの場合はここに来る
    console.warn("fetch failed, trying script injection:", e.message);
  }

  // フォールバック: script要素でGASを呼び、callback経由でデータ取得
  // GASがJSONP未対応の場合はこれも失敗するが、もう1つの方法を試す
  try {
    // XMLHttpRequestで試す（一部環境でfetchより緩い）
    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onload = () => {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch (e) { reject(e); }
      };
      xhr.onerror = () => reject(new Error("XHR failed"));
      xhr.send();
    });
  } catch (e) {
    console.error("All API methods failed:", e.message);
    return null;
  }
}

/**
 * チームの回答を取得
 */
export async function fetchTeamAnswers(questionId, choices, teams) {
  if (!GAS_URL) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(generateMockAnswersWithBets(questionId, choices, teams)), 300);
    });
  }

  const data = await callGAS({ q: questionId });
  if (data && data.answers) {
    return { answers: data.answers, bets: data.bets || {} };
  }
  return { answers: {}, bets: {} };
}

/**
 * ゲームリセット
 */
export async function resetGameAPI() {
  if (!GAS_URL) return { success: true, mock: true };

  const data = await callGAS({ action: "reset" });
  return data || { success: false };
}

export function isConnected() {
  return !!GAS_URL;
}
