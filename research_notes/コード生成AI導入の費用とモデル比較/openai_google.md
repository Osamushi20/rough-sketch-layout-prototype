# OpenAI / Google Gemini API:構造化レイアウト生成(JSON出力)向けのモデル選定・費用比較(2026年9月23日時点)

前提:
- 対象アプリ:ポスター/フライヤー編集アプリが LLM に CSS Grid 用のレイアウト・スタイル値を JSON で出力させる(コードベース視覚生成)。参照画像の解析はオプション。
- 想定リクエスト:入力 ~3,000 tokens、出力 ~800 tokens(JSON)。画像付き変種は ~1MP(1024×1024)の画像1枚を追加。
- 通貨:USD。円換算は **1 USD = 150 JPY と仮定**(本調査では為替レートの実勢を検証していない。9月時点の実勢で再計算のこと)。
- 調査の注意:2026年9月時点、OpenAI は GPT-6 世代(Astra / Sol / Luna)、Google は Gemini 3.8 Flash まで進んでおり、依頼文にある「GPT-5 family / Gemini 2.5・3 Flash」は旧世代または併売世代になっている。旧世代も価格表に残っているため併記する。
- 公式価格ページの取得は WebFetch(要約モデル経由)で行ったため、数値の転記ミスの可能性がゼロではない。契約前に必ず原ページで再確認すること。

---

## 1. 現在のモデルラインナップと公式価格(OpenAI)

### Takeaway
2026年9月22日に GPT-6 Sol($2 / $10)と GPT-6 Luna($0.10 / $0.50 per 1M tokens)が発表され、GPT-5.6 比で半額かつ恒久価格とされた。JSON レイアウト生成の用途では GPT-6 Luna が「最新世代で最安」、GPT-5-nano($0.05 / $0.40)が「価格表上の絶対最安」。

### Cited Findings
- OpenAI 公式価格ページ(Standard 処理、USD per 1M tokens、入力 / キャッシュ入力 / 出力):
  - GPT-5.6-Sol: $4.00 / $0.40 / $20.00
  - GPT-5.6-Terra: $2.00 / $0.20 / $12.00
  - GPT-5.6-Luna: $0.20 / $0.02 / $1.20
  - GPT-5.5: $5.00 / $0.50 / $30.00
  - GPT-5.4: $2.50 / $0.25 / $15.00、GPT-5.4-Mini: $0.75 / $0.075 / $4.50、GPT-5.4-Nano: $0.20 / $0.02 / $1.25
  - GPT-5.2: $1.75 / $0.175 / $14.00、GPT-5.1: $1.25 / $0.125 / $10.00
  - GPT-5: $1.25 / $0.125 / $10.00、GPT-5-Mini: $0.25 / $0.025 / $2.00、GPT-5-Nano: $0.05 / $0.005 / $0.40
  - o-series: o3 $2.00 / $0.50 / $8.00、o4-mini $1.10 / $0.275 / $4.40、o3-mini $1.10 / $0.55 / $4.40、o1 $15 / $7.50 / $60、o1-pro $150 / — / $600、o3-pro $20 / — / $80
  - GPT-4.1: $2.00 / $0.50 / $8.00、GPT-4.1-mini $0.40 / $0.10 / $1.60、GPT-4.1-nano $0.10 / $0.025 / $0.40
  - Batch API は全モデル「50% savings」 — [OpenAI API Pricing](https://developers.openai.com/api/docs/pricing)
- OpenAI 公式モデル一覧ページには GPT-6 ファミリーが最上位として掲載:gpt-6-astra $10 / $50、gpt-6-sol $2 / $10、gpt-6-luna $0.10 / $0.50(per 1M tokens)。GPT-5 / GPT-5-mini / GPT-5-nano は「現行推奨」には出てこない(価格表には残存) — [OpenAI Models](https://developers.openai.com/api/docs/models)
- GPT-6 Sol と Luna の API 価格は GPT-5.6 のプロモ価格比で 50% 減、かつ「恒久価格であり期間限定ではない」と OpenAI が明言 — [Introducing GPT-6 Sol and Luna](https://openai.com/index/introducing-gpt-6-sol-and-luna/); [VentureBeat](https://venturebeat.com/technology/openai-releases-gpt-6-sol-and-luna-models-slashing-api-costs-50-or-more); [gHacks 2026-09-23](https://www.ghacks.net/2026/09/23/openai-launches-gpt-6-sol-and-luna-with-50-lower-api-pricing-than-gpt-5-6/)
- 第三者まとめ(2026年8月末〜9月中旬検証)によると Batch は全レートを半額、Fast モードは倍額、272K tokens 超の長文脈は約2倍課金 — [Morph: OpenAI API Pricing 2026](https://www.morphllm.com/openai-api-pricing)
- 画像生成(OpenAI 価格ページ):gpt-image-2 / gpt-image-2.5(sunburst / flare)出力 $30.00、gpt-image-1.5 $32.00、gpt-image-1 $40.00、gpt-image-1-mini $8.00(いずれも「output」欄の数値。単位は per 1M 画像出力トークンと解釈されるが、ページ要約からは per image か per 1M tokens かが確定できない → Gaps 参照)。テキスト入力 $5.00 / 1M(mini は $2.00)。Batch で画像生成も 50% 減(例 gpt-image-2 batch $15.00) — [OpenAI API Pricing](https://developers.openai.com/api/docs/pricing)
- 画像入力トークン計算(OpenAI 公式):GPT-5.4 / 5.5 / 5.6 / GPT-6-Astra は 32px×32px パッチ方式、detail=high は 2,500 パッチ上限、乗数 1.2×。1024×1024 画像 = 1,024 パッチ × 1.2 = **1,229 tokens**。gpt-5-mini は乗数 1.2×(→ 約1,229 tokens)、gpt-5-nano は 1.5×(→ 約1,536 tokens)、gpt-4.1-mini は 1.62×。GPT-5.1 世代はタイル方式(70 base + 140 tokens/512px タイル)で 1024×1024 = **630 tokens** — [OpenAI Images & Vision: Calculating costs](https://developers.openai.com/api/docs/guides/images-vision)

### Inferences
- 用途(JSON レイアウト、日本語テキスト少量、多段推論不要)には GPT-6 Luna(最新・恒久価格・$0.10/$0.50)が OpenAI 側の第一候補。GPT-5-nano はさらに安いが旧世代で「deprecated」扱いの記述があり、長期運用には不向き。
- o-series は価格・用途とも本件には過剰で、もはや選択肢から外してよい(GPT-6 / GPT-5.x が推論を内包)。

### Gaps
- openai.com/api/pricing 本体は 403 で取得不可。developers.openai.com の価格ページで代替した。
- GPT-6 各モデルの「キャッシュ入力」単価は価格ページ要約に出てこなかった(GPT-5.x は入力の 10%)。GPT-6 も同率と推測されるが未確認。
- gpt-image-2 / 2.5 の「1枚あたり」価格(解像度・品質別)は要約から確定できなかった。

---

## 2. 現在のモデルラインナップと公式価格(Google Gemini API / Vertex AI)

### Takeaway
Gemini は 2026年8〜9月に 3.6 → 3.7 → 3.8 Flash を約3週間おきに連続リリースしており、いずれも **$0.75 / $3.75(2026年12月31日までのプロモ価格、2027年1月1日から $1.50 / $7.50)**。本件の最安候補は Gemini 2.5 Flash-Lite($0.10 / $0.40)、次点で Gemini 3.1 Flash-Lite($0.25 / $1.50)。

### Cited Findings
- Gemini API 公式価格ページ(Paid tier、USD per 1M tokens、入力 / 出力):
  - Gemini 3.8 Flash / 3.7 Flash / 3.6 Flash:$0.75 / $3.75(〜2026-12-31)、以降 $1.50 / $7.50。キャッシュ入力 $0.075、キャッシュ保存 $0.50 / 1M tokens / 時。Free tier あり
  - Gemini 3.5 Flash:$1.50 / $9.00、キャッシュ $0.15、Batch $0.75 / $4.50
  - Gemini 3.5 Flash-Lite:$0.30 / $2.50、Batch $0.15 / $1.25、キャッシュ $0.03
  - Gemini 3.1 Flash-Lite:$0.25(text/image/video)/ $1.50、Batch 50% 減
  - Gemini 3 Flash Preview:$0.50(text/image/video)/ $3.00、キャッシュ $0.05
  - Gemini 3.1 Pro Preview:$2.00 / $12.00(≤200k)、$4.00 / $18.00(>200k)。Free tier なし
  - Gemini 2.5 Pro:$1.25 / $10.00(≤200k)、$2.50 / $15.00(>200k)
  - Gemini 2.5 Flash:$0.30(text/image/video)/ $2.50、キャッシュ $0.03、Batch 50% 減
  - Gemini 2.5 Flash-Lite:$0.10 / $0.40、キャッシュ $0.01、Batch 50% 減
  - 画像生成:Gemini 3.1 Flash Image(Nano Banana 2)出力 $60 / 1M tokens ≒ 1枚 $0.045(0.5K)、$0.067(1K)、$0.101(2K)、$0.151(4K);Gemini 3.1 Flash Lite Image(Nano Banana 2 Lite)$30 / 1M ≒ $0.0336(1K);Gemini 3 Pro Image(Nano Banana Pro)$120 / 1M ≒ $0.134(1K/2K)、$0.24(4K);Gemini 2.5 Flash Image $0.039/枚(非推奨・3.1へ移行案内)。いずれも Batch 50% 減
  - Batch API は全モデル一律 50% 減。PDF 等 DOCUMENT モダリティは画像トークン単価で課金 — [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Gemini 3.7 Flash は 2026年8月13日発表、3.6 Flash の3週間後。$0.75 / $3.75 は 2026-12-31 まで、2027-01-01 から $1.50 / $7.50 — [Google Blog: Gemini 3.7 Flash](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/)
- Gemini 3.8 Flash は 2026年9月2日(水)発表、「6週間で3つ目の Flash」。AI Studio / Gemini API で利用可、$0.75 / $3.75 — [Google Blog: 3.8 Flash](https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/); [9to5Google 2026-09-02](https://9to5google.com/2026/09/02/gemini-3-8-flash-launch/); [The Register](https://www.theregister.com/ai-and-ml/2026/09/02/with-gemini-38-flash-google-reminds-everyone-its-still-in-the-race/5294049)
- 画像入力トークン(Gemini 公式):両辺 ≤384px は 258 tokens 固定、それ以上は 768×768 タイルに分割し 1 タイル 258 tokens — [Gemini API Tokens](https://ai.google.dev/gemini-api/docs/tokens)
- Gemini 3 系の media_resolution:unspecified(既定)= 1,120 tokens、low 280、medium 560、high 1,120、ultra_high 2,240 tokens / 画像 — [Gemini API Media resolution](https://ai.google.dev/gemini-api/docs/media-resolution)
- 第三者まとめ:Flash 系のキャッシュ保存 $1.00 / 1M tokens / 時、Batch は全モデル入出力 50% 減 — [Puter: Gemini API Pricing Sep 2026](https://developer.puter.com/tutorials/gemini-api-pricing/); [Curlscape](https://curlscape.com/blog/google-gemini-api-pricing-guide-2026)

### Inferences
- 1024×1024 の参照画像 1 枚は Gemini 2.5 系で 4 タイル = 1,032 tokens、Gemini 3 系で既定 1,120 tokens(low 指定なら 280 tokens)。画像解析の追加費用は Flash-Lite で $0.0001〜0.0003 / 枚と無視できる。
- 「Gemini 3.x Flash のプロモ価格は年内限り」が最大の計画リスク。2027年度予算では倍額で見積もる必要がある。2.5 Flash-Lite は非プロモ価格で安定。

### Gaps
- Vertex AI の価格ページ(cloud.google.com/vertex-ai/generative-ai/pricing)は取得内容が途中で切れ、数値を抽出できなかった。一般に Gemini API と同一単価だが本調査では未検証。
- Gemini 3.x モデルの asia-northeast1(東京)での提供有無は確認できず(後述)。

---

## 3. スキーマ準拠 JSON を日本語で安定生成できる最安モデル

### Takeaway
両社とも Structured Outputs / responseSchema でJSON の構文的妥当性はほぼ保証されるが、2026年の研究では「JSON 合格率 ≈100% でも値の正確性は 15〜25 ポイント低い」ことが示されており、値検証(zod 等)はアプリ側で必須。日本語性能は Nejumi 4(2026-09-01)で Gemini 3.6 Flash が 15位(0.8312)、GPT-5.6 Luna が 33位(0.8145)と、軽量級でも実用水準。

### Cited Findings
- OpenAI Structured Outputs:「latest large language models、GPT-4o 以降」で利用可、新規は gpt-6-astra を推奨。安全上の拒否は `refusal` フィールドで検出可能。一部 JSON Schema 機能は非対応 — [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- Gemini Structured Output:対応型は string / number / integer / boolean / object / array / null、object は properties / required / additionalProperties、string は enum / format、数値は minimum / maximum、array は items / prefixItems / minItems / maxItems。「Very large or deeply nested schemas may be rejected」「While output is syntactically correct JSON, always validate values in your application」。例示は gemini-3.8-flash と gemini-3.1-pro-preview — [Gemini Structured output](https://ai.google.dev/gemini-api/docs/structured-output)
- The Structured Output Benchmark(arXiv 2604.25359):JSON Pass Rate と Value Accuracy に一貫して 15〜25 ポイントの差。Value Accuracy は Qwen3.5-35B 0.801 > GPT-5.4 0.798 > Gemini-2.5-Flash 0.796 > Claude-Sonnet-4.6 0.779。GPT-5.4 は GPT-5(0.769)比 +0.029 に留まり、構造化出力能力は推論ベンチと概ね直交 — [arXiv 2604.25359](https://arxiv.org/pdf/2604.25359)
- 構造化出力モードの比較(OpenAI strict / Anthropic JSON / Gemini schema / Outlines):スキーマ妥当率・品質税・失敗モードを評価 — [FutureAGI 2026](https://futureagi.com/blog/evaluating-llm-structured-output-modes-2026/); [Medium: Structured Output Comparison](https://medium.com/@rosgluk/structured-output-comparison-across-popular-llm-providers-openai-gemini-anthropic-mistral-and-1a5d42fa612a)
- 小型モデルの構造化出力信頼性に関する研究(arXiv 2605.02363)「When Correct Isn't Usable」 — [arXiv 2605.02363](https://arxiv.org/pdf/2605.02363)
- Nejumi Leaderboard 4(Weights & Biases Japan、2026-09-01 スナップショット、GLP + ALT の2軸で日本語タスクを評価)総合順位(抜粋):6位 gpt-5.6-sol 0.8499、7位 gpt-5.6-terra 0.8440、9位 gemini-3.1-pro-preview 0.8430、11位 gpt-5.5 0.8411、12位 gpt-5.4 0.8397、**15位 gemini-3.6-flash 0.8312**、**33位 gpt-5.6-luna 0.8145**。上位 50 に日本製モデルなし — [Qualiteg: Japanese LLM Rankings 2026 (Sep 1)](https://journal.qualiteg.com/llm-ranking-2026/)
- GPT-5 は日本語を含む多言語堅牢性の向上を謳う(医療系試験の再現性研究の記述) — [medRxiv](https://www.medrxiv.org/content/10.1101/2025.08.20.25333981.full.pdf)

### Inferences
- 本件の JSON(数値・enum・短い日本語文字列が中心)では、GPT-6 Luna / Gemini 3.x Flash-Lite / 2.5 Flash-Lite クラスで十分と考えられる。ただし「値の妥当性」(グリッド範囲外、フォントサイズ 0 等)はスキーマの minimum / maximum / enum で縛り、さらにアプリ側でバリデーション+リトライを実装すべき。
- 日本語のキャッチコピー生成やニュアンス理解まで求めるなら Gemini 3.x Flash(15位級)か GPT-6 Sol へ。Luna / Flash-Lite 級はレイアウト数値の決定には足りるが、日本語文章品質は一段落ちる(Nejumi 33位)。
- Gemini 3.x の Flash-Lite / GPT-6 Luna / GPT-5-nano 自体の Nejumi スコアは未確認(Gaps)。

### Gaps
- Gemini 3.1 / 3.5 Flash-Lite、Gemini 3.8 Flash、GPT-6 Luna、GPT-5-nano / mini の Nejumi 順位は取得した要約に含まれず未確認。
- 「日本語 × JSON スキーマ準拠」を直接測った公開ベンチマークは見つからなかった。
- OpenAI Structured Outputs の公式「スキーマ準拠率」数値(以前 100% と喧伝)は現行ページ要約に記載なし。

---

## 4. キャッシュ・Batch 割引と 1 リクエスト費用への影響

### Takeaway
どちらも Batch で入出力 50% 減、キャッシュ入力は OpenAI 90% 減(GPT-5.x 実績)、Gemini 90% 減($0.075 vs $0.75 等)。ただし本件の単価は元々 1 リクエスト $0.001 未満(Luna / Flash-Lite)であり、割引の絶対額は小さい。対話的な編集 UI では Batch は使えない(非同期)ため、実質はキャッシュのみ。

### Cited Findings
- OpenAI:キャッシュ入力は GPT-5 $0.125(入力 $1.25 の 10%)、GPT-5.6-Luna $0.02(入力 $0.20 の 10%)。Batch 50% — [OpenAI API Pricing](https://developers.openai.com/api/docs/pricing)
- Gemini:3.8 Flash キャッシュ入力 $0.075(入力 $0.75 の 10%)、2.5 Flash-Lite $0.01(入力 $0.10 の 10%)、キャッシュ保存 $0.50〜1.00 / 1M tokens / 時。Batch 50% — [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Gemini Batch API はティアごとに「enqueued tokens」上限がある(具体表は公式ページ) — [Gemini Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

### Inferences(試算:入力 3,000 / 出力 800 tokens、USD。円は ×150)
| モデル | 標準 1req | うち 2,000 tokens がキャッシュ命中時 | Batch(50%) | 円/req(標準) |
|---|---|---|---|---|
| GPT-6 Luna | $0.00070 | ≈$0.00052(GPT-6 のキャッシュ率が 10% と仮定) | $0.00035 | ≈0.11円 |
| GPT-5-nano | $0.00047 | $0.00038 | $0.00024 | ≈0.07円 |
| GPT-5-mini | $0.00235 | $0.00190 | $0.00118 | ≈0.35円 |
| GPT-5.6-Luna | $0.00156 | $0.00120 | $0.00078 | ≈0.23円 |
| GPT-5 | $0.01175 | $0.0095 | $0.0059 | ≈1.8円 |
| GPT-6 Sol | $0.0140 | ≈$0.0104 | $0.0070 | ≈2.1円 |
| Gemini 2.5 Flash-Lite | $0.00062 | $0.00044 | $0.00031 | ≈0.09円 |
| Gemini 3.1 Flash-Lite | $0.00195 | ≈$0.0015 | $0.00098 | ≈0.29円 |
| Gemini 2.5 Flash | $0.0029 | $0.00236 | $0.00145 | ≈0.44円 |
| Gemini 3.5 Flash-Lite | $0.0029 | $0.00236 | $0.00145 | ≈0.44円 |
| Gemini 3 Flash Preview | $0.0039 | $0.0030 | $0.00195 | ≈0.59円 |
| Gemini 3.8 Flash(プロモ) | $0.00525 | $0.0039 | $0.0026 | ≈0.79円(2027年〜 ≈1.6円) |
| Gemini 2.5 Pro | $0.01175 | $0.0095 | $0.0059 | ≈1.8円 |
| Gemini 3.1 Pro Preview | $0.0156 | $0.0120 | $0.0078 | ≈2.3円 |

画像 1 枚(1024×1024)追加時の増分:
- GPT-6 Luna / GPT-5.4 系(1,229 tokens):+$0.00012(Luna)〜 +$0.0025(GPT-6 Sol)
- gpt-5-mini(1,229 tokens):+$0.00031 → 合計 $0.00266;gpt-5-nano(1,536 tokens):+$0.00008 → $0.00055
- Gemini 2.5 Flash-Lite(1,032 tokens):+$0.00010 → $0.00072;2.5 Flash:+$0.00031 → $0.0032
- Gemini 3.5 Flash-Lite(1,120 tokens 既定):+$0.00034 → $0.0032;3.8 Flash:+$0.00084 → $0.0061(low 指定 280 tokens なら +$0.00021)
- 計算根拠:[OpenAI Images & Vision](https://developers.openai.com/api/docs/guides/images-vision); [Gemini Tokens](https://ai.google.dev/gemini-api/docs/tokens); [Gemini Media resolution](https://ai.google.dev/gemini-api/docs/media-resolution)

### Gaps
- GPT-6 系のキャッシュ単価は未確認(表中は仮定値)。
- Gemini の「暗黙キャッシュ」(implicit caching)が 3.x で既定有効かどうかは今回確認していない。

---

## 5. レート制限・利用ティア・無料枠

### Takeaway
新規アカウントでは、OpenAI は $5 課金で Tier 1(月 $100 上限)、Gemini は課金アカウント連携で Tier 1(第三者情報で 300 RPM / 1,000 RPD)。Gemini 無料枠は 2.5 Flash-Lite で 15 RPM / 1,000 RPD 程度で、40 人同時の授業には足りない。Google Cloud $300 クレジットは 2026 年時点で AI Studio の Gemini API には使えない。

### Cited Findings
- OpenAI 利用ティア(公式):Free = 「allowed geography」のユーザー、月 $100 上限;Tier 1 = $5 支払いで月 $100;Tier 2 = $50 で月 $500;Tier 3 = $100 で月 $1,000;Tier 4 = $250 で月 $5,000;Tier 5 = $1,000 で月 $200,000。RPM / TPM / IPM はアカウント設定の limits 欄とレスポンスヘッダで確認(例示ヘッダ:150,000 tokens、60 requests) — [OpenAI Rate limits](https://developers.openai.com/api/docs/guides/rate-limits)
- 第三者:Free 行の金額は「承認された利用上限」であって無料クレジットではない。GPT-6 Astra、GPT-5.6 Sol / Terra / Luna、GPT-4.1、GPT-4o、GPT Image 2、Realtime は Free tier では「Not supported」 — [UsagePricing: OpenAI](https://www.usagepricing.com/blueprint/openai); [scriptbyai: OpenAI rate limits 2026](https://www.scriptbyai.com/rate-limits-openai-api/)
- Gemini ティア(公式):Free = アクティブなプロジェクト or 無料トライアル;Tier 1 = 課金アカウント連携($250 billing cap);Tier 2 = $100 以上支払い+初回支払いから 3 日以上($2,000 cap);Tier 3 = $1,000 以上+30 日以上。支出ベース制限(10 分ローリング):Tier 1 $10、Tier 2 $50、Tier 3 $200。モデル別 RPM / TPM / RPD はページに記載がなく AI Studio ダッシュボードで確認 — [Gemini Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- 第三者(2026-01-27 時点):無料枠 Gemini 2.5 Pro 5 RPM / 250k TPM / 100 RPD、2.5 Flash 10 RPM / 250 RPD、2.5 Flash-Lite 15 RPM / 1,000 RPD;Tier 1 300 RPM / 1M TPM / 1,000 RPD — [AI Free API: Gemini free tier limits](https://www.aifreeapi.com/en/posts/gemini-api-free-tier-rate-limits)
- 第三者:API キー認証の無料枠は 250 RPD、Google OAuth 認証なら全モデル合計 1,000 RPD;クレジットカード不要 — [precisionaiacademy 2026-04](https://precisionaiacademy.com/blog/news-2026-04-13-5); [tokenmix](https://tokenmix.ai/blog/gemini-api-free-tier-limits)
- Google Cloud 無料トライアル:$300 クレジット、90 日有効、自動課金なし — [Google Cloud Free Trial FAQs](https://cloud.google.com/signup-faqs); [Google Cloud Free](https://cloud.google.com/free)
- 第三者:「2026 年時点で $300 クレジットは AI Studio の Gemini API や Claude 等パートナーモデルには使えない」 — [daily.dev](https://daily.dev/posts/google-cloud-free-trial-2026-get-300---400-credits-always-free-tier-explained-plszjthsa)

### Inferences
- 授業(40 人 × 30 回 = 1,200 req/回)は同時アクセスで瞬間 40 RPM 超が起こり得る。Gemini 無料枠(10〜15 RPM)では不成立。Gemini Tier 1(300 RPM 相当)または OpenAI Tier 1 で運用し、アプリ側に簡単なキュー/リトライを入れるのが現実的。
- Tier 1 の RPD 1,000(Gemini、第三者値)は 1 回の授業 1,200 req を超える可能性があり、Tier 2($100 支払い済+3 日)への昇格、または複数モデル分散が必要。
- OpenAI の月 $100 上限(Tier 1)は本件の月間コスト(数ドル)に対して十分。

### Gaps
- Gemini 3.x 各モデルの無料枠・Tier 1 の RPM / RPD の公式値は取得できず(公式ページが数値をダッシュボードに委ねている)。第三者値は 2.5 世代・2026年1月時点。
- OpenAI 各ティアのモデル別 RPM / TPM 公式値は未取得。
- OpenAI の教育・研究向けクレジット(Researcher Access Program 等)の 2026 年現状は未調査。

---

## 6. データ利用・保持・リージョン(大学研究利用の観点)

### Takeaway
OpenAI API は既定で学習利用なし・濫用監視ログ 30 日保持、日本リージョン(jp.api.openai.com)は「保存のみ」で 2026-03-05 以降のモデルは 10% 割増。Gemini API は **無料枠では入力・出力が製品改善に使われ人間レビューもあり得る**が、課金アカウント連携(Paid)なら学習利用なし。研究参加者データを扱う本件では、Gemini は必ず Paid(課金連携)で運用すること。

### Cited Findings
- OpenAI(公式):「data sent to the OpenAI API is not used to train or improve OpenAI models (unless you explicitly opt in)」。濫用監視ログは「retained for up to 30 days, unless longer retention is required by law」。Zero Data Retention は /v1/chat/completions、/v1/responses が対象、/v1/conversations、/v1/assistants は対象外。日本は保存リージョン(jp.api.openai.com、text / audio / voice / image)だが「regional processing is not available」(処理は米国)。「Data residency endpoints are charged a 10% uplift for models released on or after March 5, 2026」。Modified Abuse Monitoring / ZDR は OpenAI の承認(営業経由)が必要 — [OpenAI: Data controls](https://developers.openai.com/api/docs/guides/your-data)
- 第三者:ZDR は原則エンタープライズ契約の承認制で、従量課金の一般アカウントには適用されない — [Meetily: OpenAI data retention](https://meetily.ai/llm-privacy/openai); [Humla](https://humla.team/blog/openai-data-retention-policy); [betterclaw 2026-09](https://www.betterclaw.io/blog/ai-provider-training-data-policy-2026)
- Gemini API 利用規約(公式):Unpaid Services では「Google uses the content you submit to the Services and any generated responses to provide, improve, and develop Google products and services」「Human reviewers may read, annotate, and process your API input and output」「Do not submit sensitive, confidential, or personal information to the Unpaid Services」。Paid Services では「Google doesn't use your prompts...or responses to improve our products」、ログは禁止用途検出と法的義務のためのみ、Data Processing Addendum に従う。Paid の定義:AI Studio に「an associated and active Cloud Billing account」がある、または「Gemini API...through a Cloud Project associated with an active billing account」 — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- Gemini 価格ページも「Free tier: Content used to improve our products / Paid: not used to improve our products」と明記 — [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Vertex AI(公式):asia-northeast1(東京)がロケーションとして提供され、「Data stored at rest in the customer selected location remains at rest in that location」「ML processing for Generative AI on Vertex AI services occurs within the specific region or multi-region where the request is made」 — [Vertex AI Data residency](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/data-residency); [Vertex AI Locations](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations)
- OpenAI のデータレジデンシー対象国に Japan を含む(API プラットフォーム顧客が対象、非米国リージョンは承認+Modified Retention 修正契約が必要) — [OpenAI Business data](https://openai.com/business-data/)

### Inferences
- 倫理審査向けの説明:(a) OpenAI API:学習利用なし、30 日で削除、処理は米国。(b) Gemini API Paid:学習利用なし、処理地域は Gemini API では指定不可。(c) 処理まで国内に留めたい場合は Vertex AI の asia-northeast1 を使う(ただし 3.x モデルの東京提供は要確認)。
- 参加者が入力するテキスト・画像に個人情報が含まれない設計(匿名化した課題素材のみ)にすれば、標準の Paid 契約で十分と考えられる。

### Gaps
- Vertex AI asia-northeast1 で Gemini 3.x(3.8 Flash 等)が利用可能かは未確認(APAC は提供が遅れがちという一般的な指摘のみ)。
- OpenAI enterprise-privacy ページは 403 で直接取得できず、公式 docs と第三者要約で代替。
- Gemini API(非 Vertex)の処理リージョンとログ保持日数の公式数値は今回確認していない。

---

## 7. 総費用試算(授業 40 人 × 30 req、研究 60 人 × 50 req)とラスター画像生成との対比

### Takeaway
コードベース生成(JSON)なら、1 授業 1,200 req が **$0.7〜$6(約 100〜900 円)**、1 研究 3,000 req が **$2〜$16(約 300〜2,400 円)**。同じ回数をラスター画像生成で行うと Nano Banana 2 で $80 / $200、gpt-image 系でさらに高く、コード生成の 30〜100 倍のオーダー。

### Cited Findings
- 単価の出典は §1・§2(OpenAI / Gemini 公式価格ページ)。以下は本調査による算術試算(標準価格、キャッシュなし、画像なし):

| モデル | 1 req | 授業 1,200 req | 研究 3,000 req | 授業(円) | 研究(円) |
|---|---|---|---|---|---|
| Gemini 2.5 Flash-Lite | $0.00062 | $0.74 | $1.86 | ≈111円 | ≈279円 |
| GPT-5-nano | $0.00047 | $0.56 | $1.41 | ≈84円 | ≈212円 |
| GPT-6 Luna | $0.00070 | $0.84 | $2.10 | ≈126円 | ≈315円 |
| Gemini 3.1 Flash-Lite | $0.00195 | $2.34 | $5.85 | ≈351円 | ≈878円 |
| GPT-5-mini | $0.00235 | $2.82 | $7.05 | ≈423円 | ≈1,058円 |
| Gemini 2.5 Flash / 3.5 Flash-Lite | $0.0029 | $3.48 | $8.70 | ≈522円 | ≈1,305円 |
| Gemini 3.8 Flash(プロモ) | $0.00525 | $6.30 | $15.75 | ≈945円 | ≈2,363円 |
| GPT-5 / Gemini 2.5 Pro | $0.01175 | $14.10 | $35.25 | ≈2,115円 | ≈5,288円 |
| GPT-6 Sol | $0.0140 | $16.80 | $42.00 | ≈2,520円 | ≈6,300円 |
| Gemini 3.1 Pro Preview | $0.0156 | $18.72 | $46.80 | ≈2,808円 | ≈7,020円 |

- 画像付き(1024×1024 × 1 枚 / req)の場合の加算:Gemini 2.5 Flash-Lite +$0.12 / 授業、+$0.30 / 研究;GPT-6 Luna +$0.15 / +$0.37;Gemini 3.8 Flash +$1.0 / +$2.5;GPT-6 Sol +$2.9 / +$7.4(§4 の画像トークン数に基づく試算)。
- ラスター画像生成の対比条件(1 req = 1 枚、1K 解像度):
  - Gemini 3.1 Flash Image(Nano Banana 2)$0.067/枚 → 授業 $80.4(≈12,060円)、研究 $201(≈30,150円)
  - Nano Banana 2 Lite $0.0336/枚 → $40.3 / $100.8
  - Gemini 3 Pro Image $0.134/枚 → $160.8 / $402
  - Gemini 2.5 Flash Image $0.039/枚(非推奨)→ $46.8 / $117 — [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
  - gpt-image-2 / 2.5:出力 $30(単位要確認)、Batch $15 — [OpenAI API Pricing](https://developers.openai.com/api/docs/pricing)
- 画像生成レイテンシ(第三者ベンチ):Nano Banana 2 は「4〜6 秒」または平均 ~850ms との報告が混在、Nano Banana 2 Lite は 1K 科学図で中央値 3.8 秒;GPT Image 2 は 49.0 秒、GPT Image 2.5 は 1K で 20〜40 秒、4K で 40〜60 秒 — [Atlas Cloud benchmark](https://www.atlascloud.ai/blog/tips/2026-ai-image-api-benchmark-gpt-image-2-vs-nano-banana-2-pro-vs-seedream-5-0); [k-dense: Nano Banana 2 Lite](https://www.k-dense.ai/blog/benchmarking-nano-banana-2-lite-scientific-image-model); [WaveSpeed](https://wavespeed.ai/blog/competitor-comparison/gpt-image-2-5-vs-nano-banana-2/); [Pixo](https://pixo.video/blog/gpt-image-2-vs-nano-banana-2)

### Inferences
- 費用面では「モデル選定」より「Gemini 3.x Flash のプロモ終了(2027-01-01 に倍額)」と「レート制限のティア」が実務上の論点。金額自体は最上位モデルを使っても 1 研究あたり数千円で収まる。
- 対比条件としてラスター生成を入れる場合、Nano Banana 2(4〜6 秒、$0.067)が費用・応答時間ともに現実的。gpt-image 系は 1 枚 20〜50 秒で、対話的な編集実験のペースには合いにくい。
- 研究設計上、「コードベース生成は 1 回 <1 秒・<0.1 円で無数に試行できる」対「ラスター生成は 1 回 5〜50 秒・5〜20 円」という桁違いの差自体が、Tinkerable(いじりやすさ)の議論の裏付けデータとして使える。

### Gaps
- JSON 生成のレイテンシ(TTFT / 800 tokens 出力にかかる秒数)はモデル別の公式値・信頼できる第三者値を取得していない。
- gpt-image-2 / 2.5 の 1 枚あたり単価(品質・解像度別)は未確定のため、OpenAI 側のラスター対比は金額を記載していない。
- 為替は 150 円/USD の仮置き。
