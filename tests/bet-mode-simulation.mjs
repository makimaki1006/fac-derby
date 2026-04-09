// 馬券方式別シミュレーション — 同点解消の効果検証

const TEAMS = "ABCDEFGHIJKLMNOPQRS".split("");
const TOTAL = TEAMS.length;

function calcOdds(choiceIds, teamAnswers) {
  const counts = {};
  choiceIds.forEach(id => { counts[id] = 0; });
  Object.values(teamAnswers).forEach(ans => {
    const pick = typeof ans === "string" ? ans : ans.pick;
    if (counts[pick] !== undefined) counts[pick]++;
  });
  const odds = {};
  choiceIds.forEach(id => {
    if (counts[id] === 0) odds[id] = 10.0;
    else odds[id] = Math.max(1.2, parseFloat((TOTAL / counts[id]).toFixed(1)));
  });
  return odds;
}

// 固定分布から回答を生成（ランダムBET付き）
function buildAnswers(dist, betOptions) {
  const answers = {};
  let idx = 0;
  for (const [choiceId, count] of Object.entries(dist)) {
    for (let i = 0; i < count; i++) {
      if (betOptions) {
        const bet = betOptions[Math.floor(Math.random() * betOptions.length)];
        answers[TEAMS[idx]] = { pick: choiceId, bet };
      } else {
        answers[TEAMS[idx]] = choiceId;
      }
      idx++;
    }
  }
  return answers;
}

function analyzeScores(scores) {
  const ranking = TEAMS.map(t => ({ id: t, score: scores[t] || 0 }))
    .sort((a, b) => b.score - a.score);
  const groups = {};
  ranking.forEach(r => {
    groups[r.score] = (groups[r.score] || []);
    groups[r.score].push(r.id);
  });
  const uniqueScores = Object.keys(groups).length;
  const maxGroup = Math.max(...Object.values(groups).map(g => g.length));
  return { ranking, uniqueScores, maxGroup };
}

// =============================================
// テスト用の5ラウンド（標準偏り）
// =============================================
const rounds = [
  { choices: ["A","B","C","D"], correct: "B", dist: { A:8, B:5, C:4, D:2 } },
  { choices: ["A","B","C","D","E"], correct: "D", dist: { A:7, B:5, C:4, D:2, E:1 } },
  { choices: ["A","B","C","D","E"], correct: "A", dist: { A:6, B:5, C:4, D:3, E:1 } },
  { choices: ["A","B","C"], correct: "C", dist: { A:10, B:7, C:2 } },
  { choices: ["A","B","C","D","E"], correct: "E", dist: { A:8, B:5, C:3, D:2, E:1 } },
];

console.log("=".repeat(70));
console.log("馬券方式別シミュレーション（同点解消効果の比較）");
console.log("=".repeat(70));

// =============================================
// 方式1: 現行（単勝のみ）
// =============================================
console.log("\n[方式1] 現行 -- 単勝のみ (選択肢1つ)");
console.log("  フォーム: 選択肢を1つ選ぶだけ");
console.log("  計算: 正解=odds*100, 不正解=-100");
{
  let scores = {};
  TEAMS.forEach(t => { scores[t] = 0; });
  for (const r of rounds) {
    const answers = buildAnswers(r.dist);
    const odds = calcOdds(r.choices, answers);
    Object.entries(answers).forEach(([tid, pick]) => {
      if (pick === r.correct) scores[tid] += Math.round(odds[pick] * 100);
      else scores[tid] -= 100;
    });
  }
  const a = analyzeScores(scores);
  console.log("  -> ユニークスコア: " + a.uniqueScores + "/19  最大同点: " + a.maxGroup + "チーム");
  console.log("  -> 1位: " + a.ranking[0].score + "pt  最下位: " + a.ranking[18].score + "pt  差: " + (a.ranking[0].score - a.ranking[18].score) + "pt");
  console.log("  -> " + a.ranking.map(r => r.id + "(" + r.score + ")").join(" "));
}

// =============================================
// 方式2: BET方式（単勝+賭け金）
// =============================================
console.log("\n" + "-".repeat(70));
console.log("[方式2] BET方式 -- 単勝 + 賭け金選択");
console.log("  フォーム: 選択肢 + BET額(100/300/500)を選ぶ");
console.log("  計算: 正解=odds*BET, 不正解=-BET");
console.log("  ※同じ選択肢でもBET額が違えばスコアが変わる");

// 10回試行して平均同点数を見る
let bet_uniques = [], bet_maxgroups = [];
for (let trial = 0; trial < 10; trial++) {
  let scores = {};
  TEAMS.forEach(t => { scores[t] = 0; });
  for (const r of rounds) {
    const answers = buildAnswers(r.dist, [100, 300, 500]);
    const odds = calcOdds(r.choices, answers);
    Object.entries(answers).forEach(([tid, ans]) => {
      if (ans.pick === r.correct) scores[tid] += Math.round(odds[ans.pick] * ans.bet / 100);
      else scores[tid] -= ans.bet;
    });
  }
  const a = analyzeScores(scores);
  bet_uniques.push(a.uniqueScores);
  bet_maxgroups.push(a.maxGroup);
}
const avgUnique = (bet_uniques.reduce((a,b)=>a+b,0) / bet_uniques.length).toFixed(1);
const avgMaxG = (bet_maxgroups.reduce((a,b)=>a+b,0) / bet_maxgroups.length).toFixed(1);
console.log("  -> 10回試行平均: ユニークスコア " + avgUnique + "/19  最大同点 " + avgMaxG + "チーム");
console.log("  -> (現行: 6/19, 同点6チーム → 改善度: 約" + Math.round(avgUnique/6*100-100) + "%増)");

// 1回分の詳細を表示
{
  let scores = {};
  TEAMS.forEach(t => { scores[t] = 0; });
  const betLog = [];
  for (const r of rounds) {
    const answers = buildAnswers(r.dist, [100, 300, 500]);
    const odds = calcOdds(r.choices, answers);
    Object.entries(answers).forEach(([tid, ans]) => {
      if (ans.pick === r.correct) scores[tid] += Math.round(odds[ans.pick] * ans.bet / 100);
      else scores[tid] -= ans.bet;
    });
  }
  const a = analyzeScores(scores);
  console.log("  -> サンプル: " + a.ranking.map(r => r.id + "(" + r.score + ")").join(" "));
}

// =============================================
// 方式3: ワイド方式（2つ選ぶ）
// =============================================
console.log("\n" + "-".repeat(70));
console.log("[方式3] ワイド方式 -- 2つの選択肢を選ぶ");
console.log("  フォーム: 本命 + 対抗の2つを選ぶ");
console.log("  計算: 本命的中=odds*100, 対抗的中=odds*50, 両方外れ=-150");

let wide_uniques = [], wide_maxgroups = [];
for (let trial = 0; trial < 10; trial++) {
  let scores = {};
  TEAMS.forEach(t => { scores[t] = 0; });
  for (const r of rounds) {
    // 本命は通常の分布、対抗はランダムに別の選択肢
    const mainAnswers = buildAnswers(r.dist);
    Object.entries(mainAnswers).forEach(([tid, mainPick]) => {
      const others = r.choices.filter(c => c !== mainPick);
      const subPick = others[Math.floor(Math.random() * others.length)];
      const odds = calcOdds(r.choices, mainAnswers);
      if (mainPick === r.correct) {
        scores[tid] += Math.round(odds[mainPick] * 100);
      } else if (subPick === r.correct) {
        scores[tid] += Math.round(odds[subPick] * 50);
      } else {
        scores[tid] -= 150;
      }
    });
  }
  const a = analyzeScores(scores);
  wide_uniques.push(a.uniqueScores);
  wide_maxgroups.push(a.maxGroup);
}
const wAvgU = (wide_uniques.reduce((a,b)=>a+b,0) / wide_uniques.length).toFixed(1);
const wAvgG = (wide_maxgroups.reduce((a,b)=>a+b,0) / wide_maxgroups.length).toFixed(1);
console.log("  -> 10回試行平均: ユニークスコア " + wAvgU + "/19  最大同点 " + wAvgG + "チーム");

// =============================================
// 方式4: 3連単方式（1-2-3位を予想）
// =============================================
console.log("\n" + "-".repeat(70));
console.log("[方式4] 3連単方式 -- 1位2位3位を順番予想");
console.log("  フォーム: 1st/2nd/3rdの3つを順番に選ぶ");
console.log("  ※ただし正解が1つしかないので擬似的に:");
console.log("    1st的中=odds*150, 2nd的中=odds*60, 3rd的中=odds*20, 全外れ=-200");

let tri_uniques = [], tri_maxgroups = [];
for (let trial = 0; trial < 10; trial++) {
  let scores = {};
  TEAMS.forEach(t => { scores[t] = 0; });
  for (const r of rounds) {
    const mainAnswers = buildAnswers(r.dist);
    Object.entries(mainAnswers).forEach(([tid, mainPick]) => {
      const others = r.choices.filter(c => c !== mainPick);
      const shuffled = others.sort(() => Math.random() - 0.5);
      const picks = [mainPick, shuffled[0], shuffled[1]];
      const odds = calcOdds(r.choices, mainAnswers);
      if (picks[0] === r.correct) scores[tid] += Math.round(odds[picks[0]] * 150);
      else if (picks[1] === r.correct) scores[tid] += Math.round(odds[picks[1]] * 60);
      else if (picks[2] === r.correct) scores[tid] += Math.round(odds[picks[2]] * 20);
      else scores[tid] -= 200;
    });
  }
  const a = analyzeScores(scores);
  tri_uniques.push(a.uniqueScores);
  tri_maxgroups.push(a.maxGroup);
}
const tAvgU = (tri_uniques.reduce((a,b)=>a+b,0) / tri_uniques.length).toFixed(1);
const tAvgG = (tri_maxgroups.reduce((a,b)=>a+b,0) / tri_maxgroups.length).toFixed(1);
console.log("  -> 10回試行平均: ユニークスコア " + tAvgU + "/19  最大同点 " + tAvgG + "チーム");

// =============================================
// 方式5: BET+ワイド（ハイブリッド）
// =============================================
console.log("\n" + "-".repeat(70));
console.log("[方式5] BET + ワイド ハイブリッド");
console.log("  フォーム: 本命 + 対抗 + BET額(100/300/500)");
console.log("  計算: 本命=odds*BET, 対抗=odds*BET/2, 全外れ=-BET*1.5");

let hybrid_uniques = [], hybrid_maxgroups = [];
for (let trial = 0; trial < 10; trial++) {
  let scores = {};
  TEAMS.forEach(t => { scores[t] = 0; });
  for (const r of rounds) {
    const answers = buildAnswers(r.dist, [100, 300, 500]);
    const odds = calcOdds(r.choices, answers);
    Object.entries(answers).forEach(([tid, ans]) => {
      const others = r.choices.filter(c => c !== ans.pick);
      const subPick = others[Math.floor(Math.random() * others.length)];
      if (ans.pick === r.correct) {
        scores[tid] += Math.round(odds[ans.pick] * ans.bet / 100);
      } else if (subPick === r.correct) {
        scores[tid] += Math.round(odds[subPick] * ans.bet / 200);
      } else {
        scores[tid] -= Math.round(ans.bet * 1.5);
      }
    });
  }
  const a = analyzeScores(scores);
  hybrid_uniques.push(a.uniqueScores);
  hybrid_maxgroups.push(a.maxGroup);
}
const hAvgU = (hybrid_uniques.reduce((a,b)=>a+b,0) / hybrid_uniques.length).toFixed(1);
const hAvgG = (hybrid_maxgroups.reduce((a,b)=>a+b,0) / hybrid_maxgroups.length).toFixed(1);
console.log("  -> 10回試行平均: ユニークスコア " + hAvgU + "/19  最大同点 " + hAvgG + "チーム");

// =============================================
// 比較まとめ
// =============================================
console.log("\n" + "=".repeat(70));
console.log("比較まとめ");
console.log("=".repeat(70));
console.log("");
console.log("  方式               ユニーク/19  最大同点  フォーム追加  運営負荷");
console.log("  ---------------------------------------------------------------");
console.log("  1. 単勝(現行)          6.0       6.0      なし         ★☆☆");
console.log("  2. 単勝+BET額        " + avgUnique.padStart(5) + "     " + avgMaxG.padStart(5) + "      +1項目       ★★☆");
console.log("  3. ワイド(2択)       " + wAvgU.padStart(5) + "     " + wAvgG.padStart(5) + "      +1項目       ★★☆");
console.log("  4. 3連単(3択)        " + tAvgU.padStart(5) + "     " + tAvgG.padStart(5) + "      +2項目       ★★★");
console.log("  5. BET+ワイド        " + hAvgU.padStart(5) + "     " + hAvgG.padStart(5) + "      +2項目       ★★★");
console.log("");
console.log("推奨:");
console.log("  コスパ最強 = 方式2(BET方式)");
console.log("    理由: フォームに「BET額」1項目追加するだけで同点が大幅に減る");
console.log("    Google Form: 選択肢 + ドロップダウン(100/300/500)");
console.log("    計算式: 正解=オッズ*BET額/100, 不正解=-BET額");
console.log("    戦略性: 「自信があるなら大きく賭ける」という競馬の本質");
console.log("");
console.log("  盛り上がり重視 = 方式3(ワイド)");
console.log("    理由: 「対抗馬」を選ぶ行為自体がチーム内で議論を生む");
console.log("    的中率が上がるので「惜しい！」体験が増える");
