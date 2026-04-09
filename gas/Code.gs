/**
 * FACダービー - Google Apps Script API
 * 1問 = 1フォーム = 1シート の構成
 * 単勝モード / BETモード 両対応
 */

// ===== 設定 =====
// ※ setupAllForms 実行後に自動設定される。手動の場合はここを編集
var SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("spreadsheetId") || "";

// フォームのカラム名（Google Formの質問タイトルと一致させる）
var TEAM_COLUMN = "チーム名";
var ANSWER_COLUMN_KEYWORDS = ["予想", "回答", "FY9", "時間内", "FAC1", "先に", "最速", "漢字"];
var BET_COLUMN = "BET額";

// チームA〜S（19チーム）
var TEAM_IDS = "ABCDEFGHIJKLMNOPQRS".split("");

// 問題データ（React側 questions.js と一致）
var QUESTIONS = [
  { id: 0, label: "例題", sheetPrefix: "Q0" },
  { id: 1, label: "第1R", sheetPrefix: "Q1" },
  { id: 2, label: "第2R", sheetPrefix: "Q2" },
  { id: 3, label: "第3R", sheetPrefix: "Q3" },
  { id: 4, label: "第4R", sheetPrefix: "Q4" },
  { id: 5, label: "最終R", sheetPrefix: "Q5" },
];

// ===== メインハンドラ =====

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    switch (data.action) {
      case "getAnswers":
        return jsonResponse(getAnswers(data.questionId, data.mode));
      case "getFormUrls":
        return jsonResponse(getFormUrls(data.mode));
      case "resetGame":
        return jsonResponse(resetGame());
      default:
        return jsonResponse({ error: "Unknown action: " + data.action });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doGet() {
  return jsonResponse({
    status: "ok",
    message: "FAC Derby API",
    questions: QUESTIONS.length,
    teams: TEAM_IDS.length,
  });
}

// ===== API関数 =====

/**
 * 指定された問題の回答を取得
 * シート名は「Q{questionId}」または「Q{questionId}_bet」
 *
 * @param {number} questionId - 問題ID (0-5)
 * @param {string} mode - "simple" | "bet"
 * @returns {Object} { answers: {teamId: choiceId}, bets?: {teamId: betAmount} }
 */
function getAnswers(questionId, mode) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var suffix = (mode === "bet") ? "_bet" : "";
  var sheetName = "Q" + questionId + suffix;
  var sheet = ss.getSheetByName(sheetName);

  // シート名のバリエーションを試す
  if (!sheet) {
    // フォーム連携で自動作成された名前を検索
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      var name = sheets[i].getName();
      if (name.indexOf("Q" + questionId) !== -1 ||
          name.indexOf(QUESTIONS[questionId].label) !== -1) {
        if (mode === "bet" && name.indexOf("BET") !== -1) {
          sheet = sheets[i];
          break;
        } else if (mode !== "bet" && name.indexOf("BET") === -1 && name.indexOf("bet") === -1) {
          sheet = sheets[i];
          break;
        }
      }
    }
  }

  if (!sheet) {
    if (mode === "bet") return { answers: {}, bets: {} };
    return { answers: {} };
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    if (mode === "bet") return { answers: {}, bets: {} };
    return { answers: {} };
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // チーム名カラムを検索
  var teamColIdx = -1;
  for (var h = 0; h < headers.length; h++) {
    if (String(headers[h]).indexOf(TEAM_COLUMN) !== -1) {
      teamColIdx = h;
      break;
    }
  }

  // 回答カラムを検索（質問タイトルがそのまま列名になるため、キーワードマッチ）
  var answerColIdx = -1;
  for (var h = 0; h < headers.length; h++) {
    var headerStr = String(headers[h]);
    // タイムスタンプとチーム名以外で、キーワードにマッチするか？
    if (h === teamColIdx) continue;
    if (headerStr === "タイムスタンプ" || headerStr === "Timestamp") continue;
    if (headerStr.indexOf(BET_COLUMN) !== -1) continue;

    for (var k = 0; k < ANSWER_COLUMN_KEYWORDS.length; k++) {
      if (headerStr.indexOf(ANSWER_COLUMN_KEYWORDS[k]) !== -1) {
        answerColIdx = h;
        break;
      }
    }
    if (answerColIdx !== -1) break;

    // キーワードに一致しなくても、タイムスタンプ/チーム名/BET以外の最初の列を候補にする
    if (answerColIdx === -1 && headerStr !== "") {
      answerColIdx = h;
    }
  }

  // BET額カラムを検索
  var betColIdx = -1;
  if (mode === "bet") {
    for (var h = 0; h < headers.length; h++) {
      if (String(headers[h]).indexOf(BET_COLUMN) !== -1) {
        betColIdx = h;
        break;
      }
    }
  }

  if (teamColIdx === -1 || answerColIdx === -1) {
    return {
      answers: {},
      bets: mode === "bet" ? {} : undefined,
      error: "Column not found. Headers: " + headers.join(", "),
    };
  }

  var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var answers = {};
  var bets = {};

  for (var i = 0; i < data.length; i++) {
    var teamRaw = String(data[i][teamColIdx]).trim();
    var answerRaw = String(data[i][answerColIdx]).trim();

    // チームID抽出（"A", "B", ... または "チームA" 等）
    var teamId = extractTeamId(teamRaw);
    if (!teamId || !answerRaw) continue;

    // 回答ID抽出（"A. CyXen：上林選手" → "A"）
    var answerId = extractAnswerId(answerRaw);
    if (!answerId) continue;

    // 同一チームが複数回回答した場合は最新（最後の行）を採用
    answers[teamId] = answerId;

    // BET額
    if (mode === "bet" && betColIdx !== -1) {
      var betRaw = String(data[i][betColIdx]).trim();
      var betAmount = parseInt(betRaw, 10);
      if (!isNaN(betAmount) && betAmount > 0) {
        bets[teamId] = betAmount;
      }
    }
  }

  var result = { answers: answers };
  if (mode === "bet") {
    result.bets = bets;
  }
  return result;
}

/**
 * チーム名からIDを抽出
 * "A" → "A", "チームA" → "A", "a" → "A"
 */
function extractTeamId(raw) {
  var upper = raw.toUpperCase().trim();
  // 単一文字の場合
  if (upper.length === 1 && TEAM_IDS.indexOf(upper) !== -1) {
    return upper;
  }
  // 末尾の1文字を確認
  var last = upper.charAt(upper.length - 1);
  if (TEAM_IDS.indexOf(last) !== -1) {
    return last;
  }
  return null;
}

/**
 * 回答文字列からChoice IDを抽出
 * "A. CyXen：上林選手" → "A"
 * "A" → "A"
 * "B. 山の数がFY9にちなんで9峰になっている" → "B"
 */
function extractAnswerId(raw) {
  // "A. ..." のパターン
  var match = raw.match(/^([A-G])\s*[\.\．\:：]/);
  if (match) return match[1];

  // 単一文字
  var upper = raw.toUpperCase().trim();
  if (upper.length === 1 && /^[A-G]$/.test(upper)) {
    return upper;
  }

  // 先頭文字が選択肢
  if (/^[A-G]/.test(upper)) {
    return upper.charAt(0);
  }

  return null;
}

/**
 * 全問題のフォームURLを返す
 */
function getFormUrls(mode) {
  var props = PropertiesService.getScriptProperties();
  var prefix = (mode === "bet") ? "formUrl_bet_" : "formUrl_";
  var urls = {};
  for (var i = 0; i < QUESTIONS.length; i++) {
    var qId = QUESTIONS[i].id;
    var url = props.getProperty(prefix + qId);
    if (url) {
      urls[qId] = url;
    }
  }
  return urls;
}

/**
 * ゲームリセット: 全シートの回答データをクリア (ヘッダーは残す)
 */
function resetGame() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var cleared = [];

  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    // Qで始まるシートのみクリア
    if (/^Q\d/.test(name) && sheets[i].getLastRow() > 1) {
      sheets[i].deleteRows(2, sheets[i].getLastRow() - 1);
      cleared.push(name);
    }
  }

  return { success: true, cleared: cleared };
}

// ===== セットアップ =====

/**
 * フォームURLをScript Propertiesに登録する
 * gws CLIで作成済みのフォームURLを紐付け
 */
function registerFormUrls() {
  var props = PropertiesService.getScriptProperties();

  // 単勝モード
  var simpleUrls = {
    0: "https://docs.google.com/forms/d/e/1FAIpQLScBIw3GR6ok9CG8DbYaLY2TqsYGkl95dEaMNLmieI9hF9NBPQ/viewform",
    1: "https://docs.google.com/forms/d/e/1FAIpQLSdx2i4XNweY1_Ahs8-XebPD3LIfEuYLgY93s6Z6sWJj6Fo1UA/viewform",
    2: "https://docs.google.com/forms/d/e/1FAIpQLSeOLadadpn1wKSoCZjEJzYSONUqlaySLNIdviBugOFhhoYsdQ/viewform",
    3: "https://docs.google.com/forms/d/e/1FAIpQLSdB9YGg2dQ0R1ANY7FUY-5EYOojawjNWdPif29cwpYQczynBQ/viewform",
    4: "https://docs.google.com/forms/d/e/1FAIpQLSfZDN-13VpT8MYPydo0C78x2h_kw24BVUqkeUs4UrOyUDoCxA/viewform",
    5: "https://docs.google.com/forms/d/e/1FAIpQLSehM-qzjFaDQZUz24HkAc-irDRO1d5KaAS1nS3HI1nQE44QNA/viewform",
  };

  // BETモード
  var betUrls = {
    0: "https://docs.google.com/forms/d/e/1FAIpQLSeW64jFlcblEff-CCABOs8mhdQoQ8OiHAX8kmGOlrF2AtDSfQ/viewform",
    1: "https://docs.google.com/forms/d/e/1FAIpQLSfdg50L24IbPoLcPD_WCdqcDguWuP6JXmCLKyL_6h0aSp6u2Q/viewform",
    2: "https://docs.google.com/forms/d/e/1FAIpQLSfds3IDbDWHQNixL62OZtImjrcaZqiEOVLtQclwUPV9ikGeZQ/viewform",
    3: "https://docs.google.com/forms/d/e/1FAIpQLSfgvXufbT4w7ATd5ddXKXVXOMpD8OlS_rr6c2T8DKyrRCBOtw/viewform",
    4: "https://docs.google.com/forms/d/e/1FAIpQLSfSpP7XNFYixR0ZAW4qnHYRX6-skCUlYMxL3aDbnAobLwa-bg/viewform",
    5: "https://docs.google.com/forms/d/e/1FAIpQLSeSqTnLYaw1KK_Zumq-LzFpxUoY45xQ-Z4nvRlKkhCbNtB99A/viewform",
  };

  for (var id in simpleUrls) {
    props.setProperty("formUrl_" + id, simpleUrls[id]);
  }
  for (var id in betUrls) {
    props.setProperty("formUrl_bet_" + id, betUrls[id]);
  }

  Logger.log("フォームURL登録完了（単勝6 + BET6 = 12フォーム）");
}

// ===== ヘルパー =====

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
