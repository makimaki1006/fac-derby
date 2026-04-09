/**
 * 正解発表後のスコアを計算する
 * @param {Object} currentScores - { teamId: score }
 * @param {Object} teamAnswers - { teamId: choiceId }
 * @param {string} correctAnswer - 正解の choiceId
 * @param {Object} odds - { choiceId: odds }
 * @returns {Object} { teamId: newScore }
 */
export function calculateScores(currentScores, teamAnswers, correctAnswer, odds) {
  const newScores = { ...currentScores };

  Object.entries(teamAnswers).forEach(([teamId, choiceId]) => {
    if (choiceId === correctAnswer) {
      // 正解: オッズ x 100pt
      newScores[teamId] = (newScores[teamId] || 0) + Math.round(odds[choiceId] * 100);
    } else {
      // 不正解: -100pt
      newScores[teamId] = (newScores[teamId] || 0) - 100;
    }
  });

  return newScores;
}

/**
 * チームのスコア変動を計算する
 * @param {string|number} teamId - チームID
 * @param {Object} teamAnswers - { teamId: choiceId }
 * @param {string} correctAnswer - 正解の choiceId
 * @param {Object} odds - { choiceId: odds }
 * @returns {number} スコア変動値
 */
export function getScoreDelta(teamId, teamAnswers, correctAnswer, odds) {
  const choiceId = teamAnswers[teamId];
  if (!choiceId) return 0;
  if (choiceId === correctAnswer) return Math.round(odds[choiceId] * 100);
  return -100;
}

/**
 * BETモード用スコア計算
 * 正解: BET額 x オッズ を獲得 / 不正解: BET額を没収
 * @param {Object} currentScores - { teamId: score }
 * @param {Object} teamAnswers - { teamId: choiceId } 選択肢
 * @param {Object} teamBets - { teamId: betAmount } 賭け金
 * @param {string} correctAnswer - 正解のchoiceId
 * @param {Object} odds - { choiceId: odds }
 * @returns {Object} { teamId: newScore }
 */
export function calculateScoresWithBet(currentScores, teamAnswers, teamBets, correctAnswer, odds) {
  const newScores = { ...currentScores };
  Object.entries(teamAnswers).forEach(([teamId, choiceId]) => {
    const bet = teamBets[teamId] || 200;
    if (choiceId === correctAnswer) {
      // 正解: BET x オッズ を獲得
      newScores[teamId] = (newScores[teamId] || 0) + Math.round(bet * odds[choiceId]);
    } else {
      // 不正解: BET額を没収
      newScores[teamId] = (newScores[teamId] || 0) - bet;
    }
  });
  return newScores;
}

/**
 * BETモード用のチーム個別スコア変動を計算
 * @param {string|number} teamId - チームID
 * @param {Object} teamAnswers - { teamId: choiceId }
 * @param {Object} teamBets - { teamId: betAmount }
 * @param {string} correctAnswer - 正解のchoiceId
 * @param {Object} odds - { choiceId: odds }
 * @returns {number} スコア変動値
 */
export function getScoreDeltaWithBet(teamId, teamAnswers, teamBets, correctAnswer, odds) {
  const choiceId = teamAnswers[teamId];
  if (!choiceId) return 0;
  const bet = teamBets[teamId] || 200;
  if (choiceId === correctAnswer) return Math.round(bet * odds[choiceId]);
  return -bet;
}
