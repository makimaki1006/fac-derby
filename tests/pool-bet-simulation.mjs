// 持ち点BET制シミュレーション

const TEAMS = "ABCDEFGHIJKLMNOPQRS".split("");
const TOTAL = TEAMS.length;

function calcOdds(choiceIds, picks) {
  const counts = {};
  choiceIds.forEach(id => { counts[id] = 0; });
  Object.values(picks).forEach(p => {
    if (counts[p] !== undefined) counts[p]++;
  });
  const odds = {};
  choiceIds.forEach(id => {
    if (counts[id] === 0) odds[id] = 10.0;
    else odds[id] = Math.max(1.2, parseFloat((TOTAL / counts[id]).toFixed(1)));
  });
  return odds;
}

// =============================================
// 持ち点制のパラメータ候補
// =============================================
const configs = [
  {
    name: "案A: 初期1000pt / 自由BET(100刻み) / 正解=BET*odds / 不正解=BET没収",
    initial: 1000,
    betOptions: [100, 200, 300, 400, 500], // 100刻みで自由選択
    calcScore: (bet, odds, isCorrect) => isCorrect ? Math.round(bet * odds) : -bet,
  },
  {
    name: "案B: 初期1000pt / 3段階BET(100/300/500) / 正解=BET*odds / 不正解=BET没収",
    initial: 1000,
    betOptions: [100, 300, 500],
    calcScore: (bet, odds, isCorrect) => isCorrect ? Math.round(bet * odds) : -bet,
  },
  {
    name: "案C: 初期3000pt / 自由BET(100~1000) / 正解=BET*odds / 不正解=BET没収",
    initial: 3000,
    betOptions: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    calcScore: (bet, odds, isCorrect) => isCorrect ? Math.round(bet * odds) : -bet,
  },
  {
    name: "案D: 初期1000pt / 3段階(100/300/ALL-IN) / 正解=BET*odds / 不正解=BET没収",
    initial: 1000,
    betOptions: "dynamic", // 後で処理
    calcScore: (bet, odds, isCorrect) => isCorrect ? Math.round(bet * odds) : -bet,
  },
];

const rounds = [
  { choices: ["A","B","C","D"], correct: "B", dist: { A:8, B:5, C:4, D:2 } },
  { choices: ["A","B","C","D","E"], correct: "D", dist: { A:7, B:5, C:4, D:2, E:1 } },
  { choices: ["A","B","C","D","E"], correct: "A", dist: { A:6, B:5, C:4, D:3, E:1 } },
  { choices: ["A","B","C"], correct: "C", dist: { A:10, B:7, C:2 } },
  { choices: ["A","B","C","D","E"], correct: "E", dist: { A:8, B:5, C:3, D:2, E:1 } },
];

console.log("=".repeat(70));
console.log("持ち点BET制シミュレーション");
console.log("=".repeat(70));

for (const cfg of configs) {
  console.log("\n" + "-".repeat(70));
  console.log(cfg.name);
  console.log("-".repeat(70));

  // 10回試行
  let allUniques = [], allMaxGroups = [], allSpread = [];
  let detailRun = null;

  for (let trial = 0; trial < 20; trial++) {
    let pool = {};
    let earned = {};
    TEAMS.forEach(t => { pool[t] = cfg.initial; earned[t] = 0; });

    const roundLog = [];

    for (let ri = 0; ri < rounds.length; ri++) {
      const r = rounds[ri];
      // 投票分布に従ってpickを割り当て
      const picks = {};
      let idx = 0;
      for (const [choiceId, count] of Object.entries(r.dist)) {
        for (let i = 0; i < count; i++) {
          picks[TEAMS[idx]] = choiceId;
          idx++;
        }
      }

      const odds = calcOdds(r.choices, picks);

      // BET額を決定
      const bets = {};
      TEAMS.forEach(t => {
        let options;
        if (cfg.betOptions === "dynamic") {
          // ALL-IN可能な3段階
          const remaining = pool[t];
          if (remaining <= 0) {
            options = [0];
          } else {
            options = [
              Math.min(100, remaining),
              Math.min(300, remaining),
              remaining, // ALL-IN
            ].filter(v => v > 0);
          }
        } else {
          options = cfg.betOptions.filter(v => v <= pool[t] && v > 0);
          if (options.length === 0) options = [Math.max(0, pool[t])];
        }
        bets[t] = options[Math.floor(Math.random() * options.length)];
      });

      // スコア計算
      TEAMS.forEach(t => {
        const isCorrect = picks[t] === r.correct;
        const delta = cfg.calcScore(bets[t], odds[picks[t]], isCorrect);
        pool[t] += delta;
        earned[t] += delta;
      });

      if (trial === 0) {
        const cOdds = odds[r.correct];
        const cVotes = r.dist[r.correct] || 0;
        roundLog.push("  R" + (ri+1) + ": 正解=" + r.correct + "(" + cVotes + "票) " + cOdds.toFixed(1) + "倍");
      }
    }

    // 分析（最終持ち点 = initial + earned）
    const finalScores = {};
    TEAMS.forEach(t => { finalScores[t] = pool[t]; });
    const ranking = TEAMS.map(t => ({ id: t, score: finalScores[t] }))
      .sort((a, b) => b.score - a.score);

    const groups = {};
    ranking.forEach(r => {
      groups[r.score] = (groups[r.score] || []);
      groups[r.score].push(r.id);
    });
    const uniqueScores = Object.keys(groups).length;
    const maxGroup = Math.max(...Object.values(groups).map(g => g.length));

    allUniques.push(uniqueScores);
    allMaxGroups.push(maxGroup);
    allSpread.push(ranking[0].score - ranking[18].score);

    if (trial === 0) {
      detailRun = { roundLog, ranking, uniqueScores, maxGroup, pool };
    }
  }

  // 詳細表示（1回目）
  for (const log of detailRun.roundLog) console.log(log);
  console.log("");
  console.log("  サンプル最終持ち点:");
  // 上位5 + 下位3
  const r = detailRun.ranking;
  for (let i = 0; i < Math.min(5, r.length); i++) {
    console.log("    " + (i+1) + "位: " + r[i].id + " = " + r[i].score + "pt");
  }
  console.log("    ...");
  for (let i = Math.max(r.length - 3, 5); i < r.length; i++) {
    console.log("    " + (i+1) + "位: " + r[i].id + " = " + r[i].score + "pt");
  }

  const avgU = (allUniques.reduce((a,b)=>a+b,0) / allUniques.length).toFixed(1);
  const avgG = (allMaxGroups.reduce((a,b)=>a+b,0) / allMaxGroups.length).toFixed(1);
  const avgS = Math.round(allSpread.reduce((a,b)=>a+b,0) / allSpread.length);

  console.log("");
  console.log("  20回試行平均:");
  console.log("    ユニークスコア: " + avgU + " / 19");
  console.log("    最大同点: " + avgG + "チーム");
  console.log("    1位-最下位差: " + avgS + "pt");
}

// =============================================
// 戦略パターン検証
// =============================================
console.log("\n" + "=".repeat(70));
console.log("戦略パターン別 最終結果（初期1000pt / BET 100-500）");
console.log("=".repeat(70));

const strategies = [
  { name: "堅実型（毎回100BET）", getBet: (pool) => 100 },
  { name: "中間型（毎回300BET）", getBet: (pool) => 300 },
  { name: "攻撃型（毎回500BET）", getBet: (pool) => Math.min(500, pool) },
  { name: "温存→最終全賭け", getBet: (pool, round) => round < 4 ? 100 : Math.max(pool, 0) },
  { name: "序盤全力→後半温存", getBet: (pool, round) => round < 2 ? Math.min(500, pool) : 100 },
  { name: "ALL-IN毎回", getBet: (pool) => Math.max(pool, 0) },
];

// 全問正解 / 全問不正解 / 3勝2敗 のケースで比較
const correctPatterns = [
  { name: "全問正解(5/5)", pattern: [true, true, true, true, true] },
  { name: "3勝2敗",       pattern: [true, false, true, false, true] },
  { name: "1勝4敗",       pattern: [true, false, false, false, false] },
  { name: "全問不正解(0/5)", pattern: [false, false, false, false, false] },
];

// 固定オッズ（典型的な中穴3.8倍で計算）
const fixedOdds = 3.8;

for (const cp of correctPatterns) {
  console.log("\n--- " + cp.name + " (オッズ固定" + fixedOdds + "倍) ---");
  console.log("  戦略                      最終持ち点    収支");
  for (const s of strategies) {
    let pool = 1000;
    let totalBet = 0;
    for (let ri = 0; ri < 5; ri++) {
      if (pool <= 0) break;
      const bet = Math.min(s.getBet(pool, ri), pool);
      if (bet <= 0) continue;
      totalBet += bet;
      if (cp.pattern[ri]) {
        pool += Math.round(bet * fixedOdds);
      } else {
        pool -= bet;
      }
    }
    const delta = pool - 1000;
    const sign = delta >= 0 ? "+" : "";
    console.log("  " + s.name.padEnd(24) + " " + String(pool).padStart(6) + "pt   " + sign + delta + "pt");
  }
}

// =============================================
// 最終比較
// =============================================
console.log("\n" + "=".repeat(70));
console.log("持ち点制の設計推奨");
console.log("=".repeat(70));
console.log("");
console.log("推奨設定:");
console.log("  初期持ち点: 1000pt");
console.log("  BET方式: 3段階（100 / 300 / 500）");
console.log("  正解: +BET x オッズ（持ち点に加算）");
console.log("  不正解: -BET（持ち点から没収）");
console.log("  下限: 0pt（マイナスにはならない → 最終問で復活不能を防ぐため）");
console.log("  表示: リアルタイムで各チームの残り持ち点を表示");
console.log("");
console.log("Google Formの変更:");
console.log("  追加項目: 「BET額」ドロップダウン（100 / 300 / 500）");
console.log("  ※持ち点がBET額未満の場合は自動的にALL-IN扱い");
console.log("");
console.log("盛り上がりポイント:");
console.log("  - 序盤温存 vs 序盤攻め の戦略差が生まれる");
console.log("  - 最終問で「逆転するにはALL-INしかない！」というドラマ");
console.log("  - 持ち点0のチームが出ると会場が沸く");
console.log("  - BET額がリアルタイムで見えると「あのチーム500賭けた！」と反応");
