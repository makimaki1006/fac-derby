/**
 * Quiz Odds Battle - ゲームロジック検証テスト
 * Node.js で直接実行可能な ESM テストスクリプト
 *
 * 実行: node tests/logic-test.mjs
 */

// === テスト対象モジュールのインポート ===
import { calculateOdds, getOddsRank } from "../src/utils/odds.js";
import { calculateScores, getScoreDelta } from "../src/utils/scoring.js";
import { questions, teams } from "../src/data/questions.js";

// === テストユーティリティ ===
let passed = 0;
let failed = 0;
let totalTests = 0;

function assert(condition, testName, expected, actual) {
  totalTests++;
  if (condition) {
    passed++;
    console.log(`  PASS: ${testName}`);
  } else {
    failed++;
    console.log(`  FAIL: ${testName}`);
    console.log(`    期待値: ${JSON.stringify(expected)}`);
    console.log(`    実際値: ${JSON.stringify(actual)}`);
  }
}

function assertEqual(actual, expected, testName) {
  assert(actual === expected, testName, expected, actual);
}

function assertDeepEqual(actual, expected, testName) {
  const actualStr = JSON.stringify(actual, null, 0);
  const expectedStr = JSON.stringify(expected, null, 0);
  assert(actualStr === expectedStr, testName, expected, actual);
}

function section(title) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[${title}]`);
  console.log("=".repeat(60));
}

// === ヘルパー: チームID一覧 ===
const TEAM_IDS = teams.map((t) => t.id); // ["A","B","C",...,"S"]
const TOTAL_TEAMS = 19;

// 全チームに指定の回答を割り当てる
function makeAllAnswer(choiceId) {
  const answers = {};
  TEAM_IDS.forEach((id) => { answers[id] = choiceId; });
  return answers;
}

// 選択肢配列を生成する
function makeChoices(ids) {
  return ids.map((id) => ({ id, text: `選択肢${id}` }));
}

// ============================================================
// 1. オッズ計算: 19チームでの基本計算
// ============================================================
section("1. オッズ計算: 19チームでの基本計算");
{
  const choices = makeChoices(["A", "B", "C", "D"]);
  // A:5チーム, B:10チーム, C:3チーム, D:1チーム
  const teamAnswers = {};
  TEAM_IDS.slice(0, 5).forEach((id) => { teamAnswers[id] = "A"; });
  TEAM_IDS.slice(5, 15).forEach((id) => { teamAnswers[id] = "B"; });
  TEAM_IDS.slice(15, 18).forEach((id) => { teamAnswers[id] = "C"; });
  teamAnswers["S"] = "D";

  const odds = calculateOdds(choices, teamAnswers, TOTAL_TEAMS);

  // A: 19/5 = 3.8
  assertEqual(odds["A"], 3.8, "A: 19/5 = 3.8倍");
  // B: 19/10 = 1.9
  assertEqual(odds["B"], 1.9, "B: 19/10 = 1.9倍");
  // C: 19/3 = 6.3 (6.333... -> toFixed(1) -> 6.3)
  assertEqual(odds["C"], 6.3, "C: 19/3 = 6.3倍");
  // D: 19/1 = 19.0
  assertEqual(odds["D"], 19.0, "D: 19/1 = 19.0倍");
}

// ============================================================
// 2. スコア計算: 正解・不正解の得点
// ============================================================
section("2. スコア計算: 正解・不正解の得点");
{
  const currentScores = { A: 0, B: 0, C: 0 };
  const teamAnswers = { A: "X", B: "Y", C: "X" };
  const correctAnswer = "X";
  const odds = { X: 3.8, Y: 1.9 };

  const newScores = calculateScores(currentScores, teamAnswers, correctAnswer, odds);

  // A: 正解 -> 3.8 * 100 = 380
  assertEqual(newScores["A"], 380, "正解チームA: +380pt (3.8 * 100)");
  // B: 不正解 -> -100
  assertEqual(newScores["B"], -100, "不正解チームB: -100pt");
  // C: 正解 -> 380
  assertEqual(newScores["C"], 380, "正解チームC: +380pt");
}

// ============================================================
// 3. 可変選択肢数: 各問題の選択肢数でオッズ計算
// ============================================================
section("3. 可変選択肢数: 各問題の選択肢数でオッズ計算");
{
  // 問題データから各問題の選択肢数を検証
  assertEqual(questions[0].choices.length, 4, "例題: 4択");
  assertEqual(questions[1].choices.length, 5, "第1R: 5択");
  assertEqual(questions[2].choices.length, 5, "第2R: 5択");
  assertEqual(questions[3].choices.length, 3, "第3R: 3択");
  assertEqual(questions[4].choices.length, 5, "第4R: 5択");
  assertEqual(questions[5].choices.length, 7, "最終R: 7択");

  // 3択でのオッズ計算 (第3R)
  const q3 = questions[3];
  const answers3 = {};
  TEAM_IDS.slice(0, 10).forEach((id) => { answers3[id] = "A"; });
  TEAM_IDS.slice(10, 16).forEach((id) => { answers3[id] = "B"; });
  TEAM_IDS.slice(16).forEach((id) => { answers3[id] = "C"; });
  const odds3 = calculateOdds(q3.choices, answers3, TOTAL_TEAMS);
  assertEqual(odds3["A"], 1.9, "3択: A(10人) = 1.9倍");
  assertEqual(odds3["B"], 3.2, "3択: B(6人) = 3.2倍 (19/6=3.166...)");
  assertEqual(odds3["C"], 6.3, "3択: C(3人) = 6.3倍");

  // 7択でのオッズ計算 (最終R) - 一部の選択肢に0人
  const q5 = questions[5];
  const answers7 = {};
  TEAM_IDS.slice(0, 5).forEach((id) => { answers7[id] = "A"; });
  TEAM_IDS.slice(5, 10).forEach((id) => { answers7[id] = "B"; });
  TEAM_IDS.slice(10, 14).forEach((id) => { answers7[id] = "C"; });
  TEAM_IDS.slice(14, 17).forEach((id) => { answers7[id] = "D"; });
  TEAM_IDS.slice(17, 19).forEach((id) => { answers7[id] = "E"; });
  // F, G は誰も選ばない
  const odds7 = calculateOdds(q5.choices, answers7, TOTAL_TEAMS);
  assertEqual(odds7["F"], 10.0, "7択: F(0人) = 10.0倍 (大穴)");
  assertEqual(odds7["G"], 10.0, "7択: G(0人) = 10.0倍 (大穴)");
  assertEqual(odds7["E"], 9.5, "7択: E(2人) = 9.5倍");
}

// ============================================================
// 4. チームID文字列: "A"〜"S" で全ロジックが動作するか
// ============================================================
section("4. チームID文字列: A〜S のIDで全ロジック動作確認");
{
  assertEqual(TEAM_IDS.length, 19, "チーム数は19");
  assertEqual(TEAM_IDS[0], "A", "最初のチームID: A");
  assertEqual(TEAM_IDS[18], "S", "最後のチームID: S");

  // 全チームの初期スコアを文字列IDで作成
  const initialScores = {};
  TEAM_IDS.forEach((id) => { initialScores[id] = 0; });
  assertEqual(Object.keys(initialScores).length, 19, "初期スコア: 19チーム分作成");

  // 文字列IDでスコア計算が正しく動くか
  const teamAnswers = { A: "X", S: "Y" };
  const odds = { X: 2.0, Y: 5.0 };
  const scores = calculateScores(initialScores, teamAnswers, "Y", odds);
  assertEqual(scores["A"], -100, "チームA(不正解): -100pt");
  assertEqual(scores["S"], 500, "チームS(正解): +500pt");
  assertEqual(scores["J"], 0, "チームJ(未回答): 0ptのまま");
}

// ============================================================
// 5. 全チーム同一回答: 1.2倍下限が効くか
// ============================================================
section("5. エッジケース: 全チーム同一回答");
{
  const choices = makeChoices(["A", "B", "C"]);
  const teamAnswers = makeAllAnswer("A");

  const odds = calculateOdds(choices, teamAnswers, TOTAL_TEAMS);

  // A: 19/19 = 1.0 -> max(1.2, 1.0) = 1.2
  assertEqual(odds["A"], 1.2, "全員選択: 1.2倍下限が適用される (19/19=1.0 -> 1.2)");
  // B, C: 0人 -> 10.0
  assertEqual(odds["B"], 10.0, "未選択B: 10.0倍");
  assertEqual(odds["C"], 10.0, "未選択C: 10.0倍");
}

// ============================================================
// 6. 誰も回答しない: teamAnswersが空
// ============================================================
section("6. エッジケース: 誰も回答しない");
{
  const choices = makeChoices(["A", "B", "C"]);
  const teamAnswers = {};

  const odds = calculateOdds(choices, teamAnswers, TOTAL_TEAMS);

  // 全選択肢が0人 -> 全て10.0
  assertEqual(odds["A"], 10.0, "回答なし: A = 10.0倍");
  assertEqual(odds["B"], 10.0, "回答なし: B = 10.0倍");
  assertEqual(odds["C"], 10.0, "回答なし: C = 10.0倍");

  // スコアも変動なし
  const scores = calculateScores({ A: 100, B: 200 }, teamAnswers, "A", odds);
  assertEqual(scores["A"], 100, "回答なし時: チームAスコア変動なし");
  assertEqual(scores["B"], 200, "回答なし時: チームBスコア変動なし");
}

// ============================================================
// 7. 1チームだけ回答
// ============================================================
section("7. エッジケース: 1チームだけ回答");
{
  const choices = makeChoices(["A", "B", "C"]);
  const teamAnswers = { A: "B" };

  const odds = calculateOdds(choices, teamAnswers, TOTAL_TEAMS);

  assertEqual(odds["A"], 10.0, "未選択A: 10.0倍");
  // B: 19/1 = 19.0
  assertEqual(odds["B"], 19.0, "1人選択B: 19.0倍");
  assertEqual(odds["C"], 10.0, "未選択C: 10.0倍");
}

// ============================================================
// 8. 大穴発生: 1チームだけ異なる選択肢
// ============================================================
section("8. エッジケース: 大穴発生 (1チームだけ異なる選択肢)");
{
  const choices = makeChoices(["A", "B"]);
  // 18チームがA、1チームがB
  const teamAnswers = {};
  TEAM_IDS.slice(0, 18).forEach((id) => { teamAnswers[id] = "A"; });
  teamAnswers["S"] = "B";

  const odds = calculateOdds(choices, teamAnswers, TOTAL_TEAMS);

  // A: 19/18 = 1.055... -> toFixed(1) -> 1.1 -> max(1.2, 1.1) = 1.2
  assertEqual(odds["A"], 1.2, "人気A(18人): 1.2倍下限適用");
  // B: 19/1 = 19.0
  assertEqual(odds["B"], 19.0, "大穴B(1人): 19.0倍");
}

// ============================================================
// 9. 回答なしチームのスコア変動
// ============================================================
section("9. エッジケース: 回答なしチームのスコアが変わらない");
{
  const currentScores = { A: 500, B: 300, C: 200 };
  // AとBだけ回答、Cは未回答
  const teamAnswers = { A: "X", B: "Y" };
  const correctAnswer = "X";
  const odds = { X: 3.0, Y: 2.0 };

  const newScores = calculateScores(currentScores, teamAnswers, correctAnswer, odds);

  assertEqual(newScores["C"], 200, "未回答チームC: スコア変動なし (200のまま)");
  assertEqual(newScores["A"], 800, "回答チームA(正解): 500 + 300 = 800");
  assertEqual(newScores["B"], 200, "回答チームB(不正解): 300 - 100 = 200");
}

// ============================================================
// 10. 不正なchoiceId
// ============================================================
section("10. エッジケース: 不正なchoiceId");
{
  const choices = makeChoices(["A", "B", "C"]);
  // "Z" は存在しないchoiceId
  const teamAnswers = { A: "Z", B: "A" };

  const odds = calculateOdds(choices, teamAnswers, TOTAL_TEAMS);

  // "Z" はcountsに含まれないので無視される
  // A: 1人, B: 0人, C: 0人
  assertEqual(odds["A"], 19.0, "不正ID無視: A(1人) = 19.0倍");
  assertEqual(odds["B"], 10.0, "不正ID無視: B(0人) = 10.0倍");

  // スコア計算: "Z" は正解 "A" と不一致 -> -100
  const scores = calculateScores({ A: 0, B: 0 }, teamAnswers, "A", odds);
  assertEqual(scores["A"], -100, "不正choiceIdのチームA: -100pt (不正解扱い)");
  assertEqual(scores["B"], 1900, "正解チームB: +1900pt (19.0 * 100)");
}

// ============================================================
// 11. スコア累積: 複数問題での累積計算
// ============================================================
section("11. スコア累積: 複数問題での累積計算");
{
  let scores = {};
  TEAM_IDS.forEach((id) => { scores[id] = 0; });

  // 第1問: チームAが正解(3.0倍)、チームBが不正解
  const odds1 = { X: 3.0, Y: 2.0 };
  const answers1 = { A: "X", B: "Y" };
  scores = calculateScores(scores, answers1, "X", odds1);
  assertEqual(scores["A"], 300, "第1問後: チームA = 300");
  assertEqual(scores["B"], -100, "第1問後: チームB = -100");

  // 第2問: チームAが不正解、チームBが正解(5.0倍)
  const odds2 = { P: 5.0, Q: 1.5 };
  const answers2 = { A: "Q", B: "P" };
  scores = calculateScores(scores, answers2, "P", odds2);
  assertEqual(scores["A"], 200, "第2問後: チームA = 300 - 100 = 200");
  assertEqual(scores["B"], 400, "第2問後: チームB = -100 + 500 = 400");

  // 第3問: 両方正解(2.0倍)
  const odds3 = { R: 2.0 };
  const answers3 = { A: "R", B: "R" };
  scores = calculateScores(scores, answers3, "R", odds3);
  assertEqual(scores["A"], 400, "第3問後: チームA = 200 + 200 = 400");
  assertEqual(scores["B"], 600, "第3問後: チームB = 400 + 200 = 600");
}

// ============================================================
// 12. マイナススコア: 全問不正解
// ============================================================
section("12. エッジケース: マイナススコア (全問不正解)");
{
  let scores = { A: 0 };

  // 6問連続不正解
  for (let i = 0; i < 6; i++) {
    const odds = { X: 2.0, Y: 3.0 };
    const answers = { A: "Y" };
    scores = calculateScores(scores, answers, "X", odds);
  }

  assertEqual(scores["A"], -600, "6問連続不正解: -600pt");
  assert(scores["A"] < 0, "スコアがマイナスであること", "< 0", scores["A"]);
}

// ============================================================
// 13. 同点: 全チーム同じ回答 = 同じスコア
// ============================================================
section("13. エッジケース: 同点 (全チーム同じ回答)");
{
  const initialScores = {};
  TEAM_IDS.forEach((id) => { initialScores[id] = 0; });

  const choices = makeChoices(["A", "B"]);
  const teamAnswers = makeAllAnswer("A");
  const odds = calculateOdds(choices, teamAnswers, TOTAL_TEAMS);

  // 全員正解の場合
  const scores = calculateScores(initialScores, teamAnswers, "A", odds);
  // オッズは1.2(下限) -> 1.2 * 100 = 120
  const allSame = TEAM_IDS.every((id) => scores[id] === scores["A"]);
  assert(allSame, "全チーム同一スコアになる", true, allSame);
  assertEqual(scores["A"], 120, "全員正解: 各チーム120pt (1.2 * 100)");

  // 全員不正解の場合
  const scores2 = calculateScores(initialScores, teamAnswers, "B", odds);
  const allSame2 = TEAM_IDS.every((id) => scores2[id] === scores2["A"]);
  assert(allSame2, "全チーム同一スコア(不正解)", true, allSame2);
  assertEqual(scores2["A"], -100, "全員不正解: 各チーム-100pt");
}

// ============================================================
// 14. getScoreDelta: correctAnswer が undefined/null の場合
// ============================================================
section("14. getScoreDelta: correctAnswer が undefined/null");
{
  const teamAnswers = { A: "X", B: "Y" };
  const odds = { X: 3.0, Y: 2.0 };

  // correctAnswer = undefined (管理者が正解未選択)
  const delta1 = getScoreDelta("A", teamAnswers, undefined, odds);
  assertEqual(delta1, -100, "correctAnswer=undefined: 回答済みチームは-100 (不一致扱い)");

  const delta2 = getScoreDelta("A", teamAnswers, null, odds);
  assertEqual(delta2, -100, "correctAnswer=null: 回答済みチームは-100 (不一致扱い)");

  // 回答していないチーム
  const delta3 = getScoreDelta("C", teamAnswers, undefined, odds);
  assertEqual(delta3, 0, "未回答チーム: delta=0");

  // 正常系の確認
  const delta4 = getScoreDelta("A", teamAnswers, "X", odds);
  assertEqual(delta4, 300, "正解チームA: delta=300 (3.0 * 100)");

  const delta5 = getScoreDelta("B", teamAnswers, "X", odds);
  assertEqual(delta5, -100, "不正解チームB: delta=-100");
}

// ============================================================
// 追加: getOddsRank の検証
// ============================================================
section("追加: getOddsRank の境界値テスト");
{
  assertEqual(getOddsRank(1.0), "favorite", "1.0 -> favorite");
  assertEqual(getOddsRank(1.2), "favorite", "1.2 -> favorite");
  assertEqual(getOddsRank(2.0), "favorite", "2.0 -> favorite (境界: <=2.0)");
  assertEqual(getOddsRank(2.1), "normal", "2.1 -> normal");
  assertEqual(getOddsRank(3.5), "normal", "3.5 -> normal");
  assertEqual(getOddsRank(4.9), "normal", "4.9 -> normal");
  assertEqual(getOddsRank(5.0), "longshot", "5.0 -> longshot (境界: >=5.0)");
  assertEqual(getOddsRank(10.0), "longshot", "10.0 -> longshot");
  assertEqual(getOddsRank(19.0), "longshot", "19.0 -> longshot");
}

// ============================================================
// 結果サマリー
// ============================================================
console.log(`\n${"=".repeat(60)}`);
console.log(`テスト結果サマリー`);
console.log("=".repeat(60));
console.log(`  合計: ${totalTests}`);
console.log(`  成功: ${passed}`);
console.log(`  失敗: ${failed}`);
console.log("=".repeat(60));

if (failed > 0) {
  console.log(`\n${failed}件のテストが失敗しました。`);
  process.exit(1);
} else {
  console.log(`\n全テスト合格しました。`);
  process.exit(0);
}
