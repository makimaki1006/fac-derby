/**
 * FACダービー - Google Apps Script API
 * Google Forms APIから直接回答を読み取る方式
 */

// 各フォームの設定（formId + 各質問のquestionId）
var FORMS = {
  0: { formId: "1Z7qCW2YBnoJINAwPp25Cu8Rqe9xQ-M8zr5Gg8syUNw8", teamQid: "4c58d9e1", answerQid: "36897438", betQid: "7c91925f" },
  1: { formId: "1DkYGBuHqRJ_vpWBfbNJ_zJTR_RH5qc9aQVlViNelCpo", teamQid: "0785790c", answerQid: "7de2fb3e", betQid: "639735fa" },
  2: { formId: "1ggAAyRx2v8qW6Oli2VxB3IEOBA33kd_ni4ugKCHqPZ0", teamQid: "38446daa", answerQid: "15f1a1e5", betQid: "6e76b1b3" },
  3: { formId: "1m0Z0oB2H7uNAQRYqNUibONN-4SxbdlDC1uz1NT_IGEU", teamQid: "12c59de4", answerQid: "3bbbfd72", betQid: "39b565e4" },
  4: { formId: "16h5GzCc1cGcQtdoN01RCpj5UgrpatbtWuJRcIl4AWhE", teamQid: "4dba3c96", answerQid: "77f78acd", betQid: "77495bc1" },
  5: { formId: "1PYaI5PbhSBgK7VqVcQR2ZtSXpC_M8UQDCKwL20s4-Yc", teamQid: "53c9013b", answerQid: "1dff85f9", betQid: "4a160ed9" },
};

// ===== メインハンドラ =====

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    switch (data.action) {
      case "getAnswers":
        return jsonResponse(getAnswers(data.questionId));
      case "resetGame":
        return jsonResponse(resetGame());
      default:
        return jsonResponse({ error: "Unknown action: " + data.action });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doGet(e) {
  // GETリクエストでも回答取得可能にする（デバッグ用）
  var qid = (e && e.parameter && e.parameter.q) ? parseInt(e.parameter.q) : -1;
  if (qid >= 0 && qid <= 5) {
    return jsonResponse(getAnswers(qid));
  }
  return jsonResponse({ status: "ok", message: "FAC Derby API" });
}

// ===== API関数 =====

/**
 * 指定された問題のフォーム回答を直接取得
 * Google Forms API (FormApp) で回答を読み取り
 * 同一チームの重複回答は最新のみ採用
 */
function getAnswers(questionId) {
  var config = FORMS[questionId];
  if (!config) {
    return { answers: {}, bets: {}, error: "Unknown questionId: " + questionId };
  }

  var form = FormApp.openById(config.formId);
  var responses = form.getResponses();

  var answers = {};
  var bets = {};

  for (var i = 0; i < responses.length; i++) {
    var itemResponses = responses[i].getItemResponses();
    var teamRaw = "";
    var answerRaw = "";
    var betRaw = "";

    for (var j = 0; j < itemResponses.length; j++) {
      var ir = itemResponses[j];
      var itemTitle = ir.getItem().getTitle();

      if (itemTitle === "チーム名") {
        teamRaw = String(ir.getResponse()).trim();
      } else if (itemTitle === "BET額") {
        betRaw = String(ir.getResponse()).trim();
      } else {
        // 予想（質問タイトルは問題文そのもの）
        answerRaw = String(ir.getResponse()).trim();
      }
    }

    var teamId = extractTeamId(teamRaw);
    var answerId = extractAnswerId(answerRaw);
    if (!teamId || !answerId) continue;

    // 重複は上書き（後の回答が優先）
    answers[teamId] = answerId;

    var betAmount = parseInt(betRaw, 10);
    if (!isNaN(betAmount) && betAmount > 0) {
      bets[teamId] = betAmount;
    }
  }

  return { answers: answers, bets: bets };
}

/**
 * 全フォームの回答を削除（ゲームリセット）
 */
function resetGame() {
  var cleared = [];
  for (var qid in FORMS) {
    try {
      var form = FormApp.openById(FORMS[qid].formId);
      form.deleteAllResponses();
      cleared.push("Q" + qid);
    } catch (e) {
      // フォームが見つからない等のエラーはスキップ
    }
  }
  return { success: true, cleared: cleared };
}

// ===== ヘルパー =====

/**
 * チームID抽出: "A" → "A"
 */
function extractTeamId(raw) {
  var s = raw.toUpperCase().trim();
  if (s.length === 1 && /^[A-S]$/.test(s)) return s;
  // "チームA" 等
  var last = s.charAt(s.length - 1);
  if (/^[A-S]$/.test(last)) return last;
  return null;
}

/**
 * 回答ID抽出: "A. CyXen：上林選手" → "A"
 */
function extractAnswerId(raw) {
  var match = raw.match(/^([A-G])\s*[\.\．\:：]/);
  if (match) return match[1];
  var upper = raw.toUpperCase().trim();
  if (upper.length === 1 && /^[A-G]$/.test(upper)) return upper;
  if (/^[A-G]/.test(upper)) return upper.charAt(0);
  return null;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== テスト用 =====

/**
 * GASエディタで実行してデバッグ用
 */
function testGetAnswers() {
  var result = getAnswers(0);
  Logger.log(JSON.stringify(result));
}
