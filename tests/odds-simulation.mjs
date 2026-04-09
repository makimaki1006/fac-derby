// オッズ差シミュレーション — 19チーム × 各問題パターン

function calculateOdds(choices, teamAnswers, totalTeams) {
  const counts = {};
  choices.forEach((c) => { counts[c.id] = 0; });
  Object.values(teamAnswers).forEach((choiceId) => {
    if (counts[choiceId] !== undefined) counts[choiceId]++;
  });
  const odds = {};
  choices.forEach((c) => {
    if (counts[c.id] === 0) {
      odds[c.id] = 10.0;
    } else {
      odds[c.id] = Math.max(1.2, parseFloat((totalTeams / counts[c.id]).toFixed(1)));
    }
  });
  return odds;
}

function calculateScores(currentScores, teamAnswers, correctAnswer, odds) {
  const newScores = { ...currentScores };
  Object.entries(teamAnswers).forEach(([teamId, choiceId]) => {
    if (choiceId === correctAnswer) {
      newScores[teamId] = (newScores[teamId] || 0) + Math.round(odds[choiceId] * 100);
    } else {
      newScores[teamId] = (newScores[teamId] || 0) - 100;
    }
  });
  return newScores;
}

const TEAMS = "ABCDEFGHIJKLMNOPQRS".split("");
const TOTAL = TEAMS.length;

function buildAnswers(dist) {
  const teamAnswers = {};
  let idx = 0;
  for (const [choiceId, count] of Object.entries(dist)) {
    for (let i = 0; i < count; i++) {
      teamAnswers[TEAMS[idx]] = choiceId;
      idx++;
    }
  }
  return teamAnswers;
}

// =============================================
// 1. 各問題形式でのオッズ分布
// =============================================
console.log("=".repeat(70));
console.log("[1] 選択肢数別・投票分布パターンとオッズ差");
console.log("=".repeat(70));

const scenarios = [
  { label: "4択 (例題) -- 均等分布", choices: ["A","B","C","D"], dist: { A:5, B:5, C:5, D:4 } },
  { label: "4択 (例題) -- 一極集中", choices: ["A","B","C","D"], dist: { A:13, B:3, C:2, D:1 } },
  { label: "5択 (第1,2,4R) -- 均等", choices: ["A","B","C","D","E"], dist: { A:4, B:4, C:4, D:4, E:3 } },
  { label: "5択 -- やや偏り", choices: ["A","B","C","D","E"], dist: { A:8, B:5, C:3, D:2, E:1 } },
  { label: "5択 -- 2強", choices: ["A","B","C","D","E"], dist: { A:8, B:7, C:2, D:1, E:1 } },
  { label: "5択 -- 一極集中", choices: ["A","B","C","D","E"], dist: { A:14, B:2, C:1, D:1, E:1 } },
  { label: "3択 (第3R) -- 均等", choices: ["A","B","C"], dist: { A:7, B:7, C:5 } },
  { label: "3択 -- 偏り", choices: ["A","B","C"], dist: { A:12, B:5, C:2 } },
  { label: "3択 -- 極端", choices: ["A","B","C"], dist: { A:10, B:8, C:1 } },
  { label: "7択 (第5R) -- 均等分散", choices: ["A","B","C","D","E","F","G"], dist: { A:3, B:3, C:3, D:3, E:3, F:2, G:2 } },
  { label: "7択 -- 偏り", choices: ["A","B","C","D","E","F","G"], dist: { A:6, B:5, C:4, D:2, E:1, F:1, G:0 } },
  { label: "7択 -- 一極集中", choices: ["A","B","C","D","E","F","G"], dist: { A:10, B:3, C:2, D:2, E:1, F:1, G:0 } },
];

for (const s of scenarios) {
  const choices = s.choices.map(id => ({ id }));
  const teamAnswers = buildAnswers(s.dist);
  const odds = calculateOdds(choices, teamAnswers, TOTAL);

  const oddsArr = Object.entries(odds)
    .map(([id, v]) => ({ id, odds: v, votes: s.dist[id] || 0 }))
    .sort((a, b) => a.odds - b.odds);

  const maxOdds = Math.max(...oddsArr.map(o => o.odds));
  const minOdds = Math.min(...oddsArr.map(o => o.odds));

  console.log("");
  console.log("  " + s.label);
  console.log("  " + Object.entries(s.dist).map(([k,v]) => k + "=" + v).join(", "));
  for (const o of oddsArr) {
    const pts = Math.round(o.odds * 100);
    const rank = o.odds <= 2.0 ? "本命" : o.odds >= 5.0 ? "大穴" : "中穴";
    console.log("    " + o.id + "  " + String(o.votes).padStart(2) + "票  " + o.odds.toFixed(1).padStart(5) + "倍  +" + String(pts).padStart(4) + "pt  " + rank);
  }
  console.log("  -> 差: " + minOdds.toFixed(1) + " ~ " + maxOdds.toFixed(1) + " (得点差 " + Math.round((maxOdds - minOdds) * 100) + "pt)");
}

// =============================================
// 2. 5問通しシミュレーション
// =============================================
console.log("");
console.log("=".repeat(70));
console.log("[2] 5問通しシミュレーション -- 最終スコアと順位差");
console.log("=".repeat(70));

const gameSims = [
  {
    name: "パターンA: 均等 (差がつきにくい)",
    rounds: [
      { choices: ["A","B","C","D"], correct: "B", dist: { A:5, B:5, C:5, D:4 } },
      { choices: ["A","B","C","D","E"], correct: "A", dist: { A:4, B:4, C:4, D:4, E:3 } },
      { choices: ["A","B","C","D","E"], correct: "C", dist: { A:4, B:4, C:4, D:4, E:3 } },
      { choices: ["A","B","C"], correct: "A", dist: { A:7, B:7, C:5 } },
      { choices: ["A","B","C","D","E"], correct: "B", dist: { A:4, B:4, C:4, D:4, E:3 } },
    ]
  },
  {
    name: "パターンB: 適度に偏り (標準的)",
    rounds: [
      { choices: ["A","B","C","D"], correct: "B", dist: { A:8, B:5, C:4, D:2 } },
      { choices: ["A","B","C","D","E"], correct: "D", dist: { A:7, B:5, C:4, D:2, E:1 } },
      { choices: ["A","B","C","D","E"], correct: "A", dist: { A:6, B:5, C:4, D:3, E:1 } },
      { choices: ["A","B","C"], correct: "C", dist: { A:10, B:7, C:2 } },
      { choices: ["A","B","C","D","E"], correct: "E", dist: { A:8, B:5, C:3, D:2, E:1 } },
    ]
  },
  {
    name: "パターンC: 大穴連発 (劇的展開)",
    rounds: [
      { choices: ["A","B","C","D"], correct: "D", dist: { A:10, B:5, C:3, D:1 } },
      { choices: ["A","B","C","D","E"], correct: "E", dist: { A:8, B:5, C:3, D:2, E:1 } },
      { choices: ["A","B","C","D","E"], correct: "A", dist: { A:2, B:6, C:5, D:4, E:2 } },
      { choices: ["A","B","C"], correct: "C", dist: { A:12, B:6, C:1 } },
      { choices: ["A","B","C","D","E","F","G"], correct: "G", dist: { A:6, B:4, C:3, D:3, E:2, F:1, G:0 } },
    ]
  },
];

for (const sim of gameSims) {
  console.log("");
  console.log("--- " + sim.name + " ---");

  let scores = {};
  TEAMS.forEach(t => { scores[t] = 0; });

  for (let r = 0; r < sim.rounds.length; r++) {
    const round = sim.rounds[r];
    const choices = round.choices.map(id => ({ id }));
    const teamAnswers = buildAnswers(round.dist);
    const odds = calculateOdds(choices, teamAnswers, TOTAL);
    scores = calculateScores(scores, teamAnswers, round.correct, odds);

    const cOdds = odds[round.correct];
    const cVotes = round.dist[round.correct] || 0;
    console.log("  R" + (r+1) + ": 正解=" + round.correct + "(" + cVotes + "票) " + cOdds.toFixed(1) + "倍 -> +" + Math.round(cOdds*100) + "pt / 不正解 -100pt");
  }

  const ranking = TEAMS.map(t => ({ id: t, score: scores[t] })).sort((a,b) => b.score - a.score);
  const groups = {};
  ranking.forEach(r => {
    groups[r.score] = (groups[r.score] || []);
    groups[r.score].push(r.id);
  });
  const uniqueScores = Object.keys(groups).length;
  const maxGroup = Math.max(...Object.values(groups).map(g => g.length));

  console.log("");
  console.log("  1位: " + ranking[0].id + " = " + ranking[0].score + "pt");
  console.log("  2位: " + ranking[1].id + " = " + ranking[1].score + "pt");
  console.log("  3位: " + ranking[2].id + " = " + ranking[2].score + "pt");
  console.log("  最下位: " + ranking[ranking.length-1].id + " = " + ranking[ranking.length-1].score + "pt");
  console.log("  1位-最下位差: " + (ranking[0].score - ranking[ranking.length-1].score) + "pt");
  console.log("  ユニークスコア: " + uniqueScores + "/19 (最大同点" + maxGroup + "チーム)");
  console.log("  全順位: " + ranking.map(r => r.id + "(" + r.score + ")").join(" "));
}

// =============================================
// 3. 構造的分析
// =============================================
console.log("");
console.log("=".repeat(70));
console.log("[3] オッズ計算の構造的分析");
console.log("=".repeat(70));
console.log("");
console.log("現在の計算式: odds = max(1.2, 19 / 投票数)");
console.log("");
console.log("  投票数  オッズ  正解得点  不正解  差分");
for (const n of [19, 10, 7, 5, 4, 3, 2, 1, 0]) {
  const o = n === 0 ? 10.0 : Math.max(1.2, parseFloat((19 / n).toFixed(1)));
  const pts = Math.round(o * 100);
  const label = n === 0 ? "(固定)" : "";
  console.log("  " + String(n).padStart(2) + "票   " + o.toFixed(1).padStart(5) + "倍  +" + String(pts).padStart(4) + "pt   -100pt  " + (pts + 100) + "pt差 " + label);
}
console.log("");
console.log("問題点:");
console.log("  1. 3択+19チーム: 均等で6-7票/選択肢 -> 全て2.7倍前後 -> 差なし");
console.log("  2. 5択+均等: 3-4票/選択肢 -> 4.8~6.3倍 -> 得点差150pt程度");
console.log("  3. 不正解-100ptが軽すぎ: 5倍の正解+500pt vs -100pt -> ほぼノーリスク");
console.log("  4. 0票=10.0倍 < 1票=19.0倍: 直感に反する");
console.log("  5. 5問で最大同点チームが多発 -> 順位が決まらない");
