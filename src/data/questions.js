// FY9総会エンタメ「ステークス」問題データ
// answer フィールドなし — 正解はその場で管理者が決定する

export const questions = [
  {
    id: 0,
    label: "例題",
    raceName: "パドック（練習走行）",
    text: "FY9の「For A-career BOOK」に施された、驚きの工夫とは？",
    choices: [
      { id: "A", text: "人のイラストが役員の人数になっている" },
      { id: "B", text: "山の数がFY9にちなんで9峰になっている" },
      { id: "C", text: "創業1周年の時の浅尾さんの写真が載っている" },
      { id: "D", text: "2030年度の売上高が1000億円になっている" },
    ],
  },
  {
    id: 1,
    label: "第1R",
    raceName: "「爆速エンジン」決定戦！",
    text: "時間内に「最も大きい風船」を膨らませるのは誰だ！？",
    choices: [
      { id: "A", text: "CyXen：上林選手" },
      { id: "B", text: "リクロジ：根本選手" },
      { id: "C", text: "えーかお：沼澤選手" },
      { id: "D", text: "boom：志賀選手" },
      { id: "E", text: "管理本部：菊川選手" },
    ],
  },
  {
    id: 2,
    label: "第2R",
    raceName: "シンクロ・サバイバル",
    text: "FAC1の最強タッグは誰だ！？",
    choices: [
      { id: "A", text: "CyXen：岸根・牧野ペア" },
      { id: "B", text: "リクロジ：野口・島渕ペア" },
      { id: "C", text: "えーかお：會澤・竹内ペア" },
      { id: "D", text: "boom：小笠原・水野ペア" },
      { id: "E", text: "管理本部：重田・伊藤ペア" },
    ],
  },
  {
    id: 3,
    label: "第3R",
    raceName: "新卒が挑む！FACビンゴ",
    text: "先にビンゴするのはどのチームだ！？",
    choices: [
      { id: "A", text: "リクロジチーム" },
      { id: "B", text: "CyXenチーム" },
      { id: "C", text: "時間内クリアなし" },
    ],
  },
  {
    id: 4,
    label: "第4R",
    raceName: "限界突破！最速王を決めろ",
    text: "最速王は誰だ！？",
    choices: [
      { id: "A", text: "ハットリ ショウタロウ" },
      { id: "B", text: "クボ ジュンタ" },
      { id: "C", text: "シマタニ ソウ" },
      { id: "D", text: "アサカワ ヒロキ" },
      { id: "E", text: "コバヤシ コウタ" },
    ],
  },
  {
    id: 5,
    label: "最終R",
    raceName: "FY9の漢字を当てろ",
    text: "FY9の漢字を的中させたマネージャーは何人？",
    choices: [
      { id: "A", text: "1人" },
      { id: "B", text: "2人" },
      { id: "C", text: "3人" },
      { id: "D", text: "4人" },
      { id: "E", text: "5人" },
      { id: "F", text: "全員正解" },
      { id: "G", text: "正解者なし" },
    ],
  },
];

// チーム A～S（19チーム）— 競馬枠番風カラー
export const teams = [
  { id: "A", name: "A", color: "#e94560" },
  { id: "B", name: "B", color: "#0f3460" },
  { id: "C", name: "C", color: "#00b894" },
  { id: "D", name: "D", color: "#e2b714" },
  { id: "E", name: "E", color: "#6c5ce7" },
  { id: "F", name: "F", color: "#00cec9" },
  { id: "G", name: "G", color: "#fd79a8" },
  { id: "H", name: "H", color: "#e17055" },
  { id: "I", name: "I", color: "#74b9ff" },
  { id: "J", name: "J", color: "#a29bfe" },
  { id: "K", name: "K", color: "#55efc4" },
  { id: "L", name: "L", color: "#ff7675" },
  { id: "M", name: "M", color: "#fdcb6e" },
  { id: "N", name: "N", color: "#81ecec" },
  { id: "O", name: "O", color: "#fab1a0" },
  { id: "P", name: "P", color: "#c8d6e5" },
  { id: "Q", name: "Q", color: "#ffeaa7" },
  { id: "R", name: "R", color: "#dfe6e9" },
  { id: "S", name: "S", color: "#b8e994" },
];
