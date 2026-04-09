#!/bin/bash
# FACダービー BET版フォーム作成（6フォーム）

TEAMS='[{"value":"A"},{"value":"B"},{"value":"C"},{"value":"D"},{"value":"E"},{"value":"F"},{"value":"G"},{"value":"H"},{"value":"I"},{"value":"J"},{"value":"K"},{"value":"L"},{"value":"M"},{"value":"N"},{"value":"O"},{"value":"P"},{"value":"Q"},{"value":"R"},{"value":"S"}]'

BET_OPTIONS='[{"value":"200"},{"value":"400"},{"value":"600"},{"value":"800"},{"value":"1000"}]'

declare -a LABELS=("例題" "第1R" "第2R" "第3R" "第4R" "最終R")
declare -a TITLES=(
  "FACダービー 例題"
  "FACダービー 第1R 爆速エンジン決定戦"
  "FACダービー 第2R シンクロ・サバイバル"
  "FACダービー 第3R FACビンゴ"
  "FACダービー 第4R 最速王を決めろ"
  "FACダービー 最終R 漢字を当てろ"
)
declare -a QUESTIONS=(
  "FY9の「For A-career BOOK」に施された、驚きの工夫とは？"
  "時間内に「最も大きい風船」を膨らませるのは誰だ！？"
  "FAC1の最強タッグは誰だ！？"
  "先にビンゴするのはどのチームだ！？"
  "最速王は誰だ！？"
  "FY9の漢字を的中させたマネージャーは何人？"
)
declare -a CHOICES=(
  '[{"value":"A. 人のイラストが役員の人数になっている"},{"value":"B. 山の数がFY9にちなんで9峰になっている"},{"value":"C. 創業1周年の時の浅尾さんの写真が載っている"},{"value":"D. 2030年度の売上高が1000億円になっている"}]'
  '[{"value":"A. CyXen：上林選手"},{"value":"B. リクロジ：根本選手"},{"value":"C. えーかお：沼澤選手"},{"value":"D. boom：志賀選手"},{"value":"E. 管理本部：菊川選手"}]'
  '[{"value":"A. CyXen：岸根・牧野ペア"},{"value":"B. リクロジ：野口・島渕ペア"},{"value":"C. えーかお：會澤・竹内ペア"},{"value":"D. boom：小笠原・水野ペア"},{"value":"E. 管理本部：重田・伊藤ペア"}]'
  '[{"value":"A. リクロジチーム"},{"value":"B. CyXenチーム"},{"value":"C. 時間内クリアなし"}]'
  '[{"value":"A. ハットリ ショウタロウ"},{"value":"B. クボ ジュンタ"},{"value":"C. シマタニ ソウ"},{"value":"D. アサカワ ヒロキ"},{"value":"E. コバヤシ コウタ"}]'
  '[{"value":"A. 1人"},{"value":"B. 2人"},{"value":"C. 3人"},{"value":"D. 4人"},{"value":"E. 5人"},{"value":"F. 全員正解"},{"value":"G. 正解者なし"}]'
)

echo "["
for i in "${!LABELS[@]}"; do
  TITLE="${TITLES[$i]}"
  LABEL="${LABELS[$i]}"
  QUESTION="${QUESTIONS[$i]}"
  CHOICE="${CHOICES[$i]}"

  RESULT=$(gws forms forms create --json "{\"info\":{\"title\":\"${TITLE}\"}}" 2>&1)
  FORM_ID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['formId'])")
  RESP_URI=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['responderUri'])")

  gws forms forms batchUpdate --params "{\"formId\":\"${FORM_ID}\"}" --json "{
    \"requests\": [
      {
        \"createItem\": {
          \"item\": {
            \"title\": \"チーム名\",
            \"description\": \"あなたのチームを選んでください\",
            \"questionItem\": {
              \"question\": {
                \"required\": true,
                \"choiceQuestion\": {
                  \"type\": \"RADIO\",
                  \"options\": ${TEAMS}
                }
              }
            }
          },
          \"location\": {\"index\": 0}
        }
      },
      {
        \"createItem\": {
          \"item\": {
            \"title\": \"${QUESTION}\",
            \"questionItem\": {
              \"question\": {
                \"required\": true,
                \"choiceQuestion\": {
                  \"type\": \"RADIO\",
                  \"options\": ${CHOICE}
                }
              }
            }
          },
          \"location\": {\"index\": 1}
        }
      },
      {
        \"createItem\": {
          \"item\": {
            \"title\": \"BET額\",
            \"description\": \"この問題にいくら賭けますか？\",
            \"questionItem\": {
              \"question\": {
                \"required\": true,
                \"choiceQuestion\": {
                  \"type\": \"RADIO\",
                  \"options\": ${BET_OPTIONS}
                }
              }
            }
          },
          \"location\": {\"index\": 2}
        }
      }
    ]
  }" > /dev/null 2>&1

  COMMA=","
  if [ $i -eq 5 ]; then COMMA=""; fi
  echo "  {\"label\":\"${LABEL}\", \"formId\":\"${FORM_ID}\", \"url\":\"${RESP_URI}\"}${COMMA}"
done
echo "]"
