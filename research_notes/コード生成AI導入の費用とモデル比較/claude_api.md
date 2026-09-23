# Anthropic Claude API — ポスター/フライヤー編集アプリ向け「構造化レイアウトJSON生成」導入調査

調査日: 2026-09-23。価格・仕様は同日に platform.claude.com の一次ドキュメントを直接取得して確認した。
為替換算は **1 USD = 157 JPY**(2026-09-22 NY市場終値 157.07〜157.60円 — [zai.diamond.jp](https://zai.diamond.jp/articles/-/496041))で統一。
用途の前提: アプリ側が CSS Grid でレンダリングするための **レイアウト/スタイルパラメータ JSON** を LLM に出力させる(ラスター画像生成ではない)。1リクエスト ≈ 入力3,000トークン(system+schema+現在レイアウト)、出力800トークン(JSON)。参照画像1枚(≈1MP)を付ける変種あり。

---

## 1. 現行モデルと公式価格(2026年9月時点)

### Takeaway
2026-09-23時点の第一次API(platform.claude.com)の現行ラインナップは Fable 5.1 / Opus 5.5(9/22発売)/ Sonnet 5 / Haiku 4.5 の4本柱で、旧世代(Fable 5, Opus 5/4.8/4.7/4.6/4.5, Sonnet 4.6/4.5)はLegacyとして提供継続。本用途のコスト帯は Haiku 4.5 ($1/$5) → Sonnet 5 ($2/$10) → Opus 5.5 ($4/$20) の順で、Sonnet 5 の $2/$10 は「導入価格」から恒久価格に変更済み。

### Cited Findings
- 公式価格表(USD / MTok、基本入力 / 5分キャッシュ書込 / 1時間キャッシュ書込 / キャッシュ読出 / 出力) — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
  | モデル | 入力 | 5m書込 | 1h書込 | 読出 | 出力 | 読出倍率 |
  |---|---|---|---|---|---|---|
  | Claude Fable 5.1 | $10 | $12.50 | $20 | $0.25 | $50 | 0.025x |
  | Claude Fable 5 | $10 | $12.50 | $20 | $1 | $50 | 0.1x |
  | Claude Opus 5.5 | $4 | $5 | $8 | $0.20 | $20 | 0.05x |
  | Claude Opus 5 / 4.8 / 4.7 / 4.6 / 4.5 | $5 | $6.25 | $10 | $0.50 | $25 | 0.1x |
  | Claude Sonnet 5 | $2 | $2.50 | $4 | $0.20 | $10 | 0.1x |
  | Claude Sonnet 4.6 / 4.5 | $3 | $3.75 | $6 | $0.30 | $15 | 0.1x |
  | Claude Haiku 4.5 | $1 | $1.25 | $2 | $0.10 | $5 | 0.1x |
- 円換算(157円/USD): Haiku 4.5 = 入力 ¥157/MTok・出力 ¥785/MTok、Sonnet 5 = ¥314 / ¥1,570、Opus 5.5 = ¥628 / ¥3,140、Opus 5 = ¥785 / ¥3,925、Fable 5.1 = ¥1,570 / ¥7,850(筆者計算)。
- Sonnet 5 の $2/$10 は「2026-08-31までの導入価格」として発表されたが、公式ページに「now the standard price. The previously scheduled increase to $3/$15 on September 1, 2026 will not occur」と明記 — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- モデル比較表(公式): Fable 5.1 = 1Mコンテキスト・128K出力・知識カットオフ2026年6月・API ID `claude-fable-5-1`;Opus 5.5 = 1M・128K・2026年6月・`claude-opus-5-5`・デフォルトeffort `medium`;Sonnet 5 = 1M・128K・2026年1月・`claude-sonnet-5`;Haiku 4.5 = **200K**・64K・2025年2月・`claude-haiku-4-5-20251001`(エイリアス `claude-haiku-4-5`)、effort非対応。全現行モデルが画像入力・多言語・tool use対応 — [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- Opus 5.5 は 2026-09-22 発売。Opus 5 比で入力/出力 −20%、キャッシュ読出 −60%、典型ワークロードで −40%、出力速度 +30%。「Claude Sonnet 5.5 and Claude Haiku 5.5 will follow in the coming weeks」 — [Anthropic news](https://www.anthropic.com/news/claude-opus-5-5)
- 廃止予定(Anthropic運営プラットフォーム): `claude-haiku-4-5-20251001` は「Not sooner than **October 15, 2026**」、`claude-sonnet-4-5` は 2026-09-29 以降、Sonnet 5 は 2027-06-30 以降、Opus 5.5 は 2027-09-22 以降、Fable 5.1 は 2027-09-01 以降。公開モデルの廃止は最低60日前通知 — [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)
- トークナイザ: 「Claude 4.7 and later models ... use a newer tokenizer ... produces approximately 30% more tokens for the same text」。Sonnet 4.6 以前(Haiku 4.5 含む)は旧トークナイザ — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- 4.7以降では `temperature`/`top_p`/`top_k` を非デフォルト値にすると 400 エラー(廃止) — [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)
- Fable 5.1 は「Covered Model」で30日データ保持が必須、ZDR組織では 400 エラー(§6参照)。

### Inferences
- 本用途(JSON生成)に Fable 5.1 はオーバースペックかつ出力単価が Sonnet 5 の5倍。候補は Haiku 4.5 / Sonnet 5 / Opus 5.5 の3つに絞れる。
- Haiku 4.5 は 2026-10-15 以降いつでも廃止告知され得るうえ Haiku 5.5 が「数週間以内」に来るため、**2026年10月以降に開始する授業・研究では Haiku 4.5 に固定しない設計**(モデルIDを設定値化)が必要。
- 同じプロンプトでも Sonnet 5 / Opus 5.5(新トークナイザ)は Haiku 4.5(旧)より英語/JSON部分のトークン数が約1.3〜1.4倍になるため、モデル間比較は「単価×トークン数」で行う必要がある(§3参照)。

### Gaps
- Haiku 5.5 / Sonnet 5.5 の価格・発売日は未発表(2026-09-23時点)。
- Fable 5.1 のキャッシュ読出 0.025x が Mythos 5.1 にも適用されるかは本用途に無関係のため未確認。

---

## 2. 日本語テキストを含むスキーマ準拠JSONを確実に返す最安モデル / 構造化出力の仕組み

### Takeaway
構造化出力(`output_config.format`、JSON Schema)と strict tool use(`strict: true`)は Haiku 4.5 を含む全現行モデルで GA、ベータヘッダ不要、文法制約サンプリングでスキーマ準拠を保証する。したがって「有効なJSON」自体はどのモデルでも保証され、差が出るのは**レイアウト判断の質と日本語の質**。最安の Haiku 4.5 で構造は担保できるが、複数ルールを守る判断では Sonnet 5 が優位という第三者評価があり、日本語ベンチマークでは Sonnet 系 ≥ 0.82(Nejumi 4)と実用域。

### Cited Findings
- 構造化出力は `output_config: {format: {type: "json_schema", schema: {...}}}` で指定。旧 `output_format` は非推奨(Python SDK v1.0+ は TypeError)。ベータヘッダ `structured-outputs-2025-11-13` は不要(移行期間中は受理) — [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- 対応モデル(GA): Opus 5.5 / 5 / 4.8 / 4.7 / 4.6 / 4.5、Sonnet 5 / 4.6 / 4.5、**Haiku 4.5**、Fable 5.1 / 5、Mythos 系。Claude API・AWS・Bedrock・Google Cloud・Foundry で GA — 同上
- 時系列: 2025-11-14 公開ベータ(Sonnet 4.5, Opus 4.1)→ 2025-12-04 Haiku 4.5 対応 → 2026-02-04 GA(より複雑なスキーマに対応) — [Claude blog](https://claude.com/blog/structured-outputs-on-the-claude-developer-platform)
- strict tool use: ツール定義のトップレベルに `strict: true`、スキーマは `additionalProperties: false` と `required` が必須。`tool_use.input` がスキーマに厳密一致することを保証 — [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- **スキーマ制約(重要)**: 非対応 = 再帰スキーマ、`minimum`/`maximum`/`multipleOf`、`minLength`/`maxLength`、`maxItems`、`minItems` > 1、`uniqueItems`、`pattern`、`if/then/else`、外部 `$ref`。対応 = 基本型、`enum`(プリミティブのみ)、`const`、`anyOf`/`allOf`(制限あり)、`$ref`/`$defs`、`required`、`additionalProperties:false`、`minItems` 0/1、string format は `date-time`/`date`/`uri`/`uuid` 等のみ — 同上
- SDK(Python/TS 等)は非対応キーワードを自動的に除去して description に制約文を追記し、応答をローカルで元スキーマに対して検証する — 同上
- 文法(grammar)コンパイル: 初回リクエストにレイテンシ上乗せ、**24時間キャッシュ**(最終使用から)。スキーマ構造やツール集合を変えると無効化、`name`/`description` 変更は無効化しない — 同上
- 構造化出力使用時は出力形式を説明する system prompt が自動注入され、その分の入力トークンが課金される。`output_config.format` を変えると当該スレッドのプロンプトキャッシュも無効化 — 同上
- 非英語: JSON の文字列値は任意の Unicode 可。フィールド名は ASCII 推奨(相互運用性)。description や enum 値は日本語可 — 同上
- assistant prefill は 4.6 以降で 400 エラー(削除)。JSON 強制には構造化出力か system 指示を使う — [claude-api skill 内部リファレンス, 2026-06-24 キャッシュ](file:///private/tmp/claude-501/bundled-skills/2.1.280/ede8fde21af2b1ba456a2120672afe94/claude-api)(※Anthropic 提供スキル文書。公開ページで未再確認)
- Opus 5.5 / Fable 5.1 では強制ツール呼び出し(`tool_choice: any/tool`)が 400。JSON 取得目的なら構造化出力を使う — 同上(※同スキル文書、公開ページで未再確認)
- 第三者比較(Haiku vs Sonnet): 「Haiku wins on tasks where the bottleneck is speed or cost rather than reasoning depth … extracting structured data … is a task where Haiku performs well」「Sonnet followed instructions more closely when the task had several rules or decisions to keep track of」 — [emergent.sh](https://emergent.sh/learn/claude-sonnet-vs-haiku), [morphllm.com](https://www.morphllm.com/sonnet-vs-haiku)(morphllm は取得時 429 で本文未確認、検索スニペットのみ)
- 日本語ベンチマーク Nejumi Leaderboard 4(2026-09-01版、Qualiteg 集計): Opus 5(adaptive max)0.8720 で1位、Fable 5 0.8699、Opus 4.8 0.8523、Opus 4.7 0.8509、Opus 4.6 0.8394、**Sonnet 4.6 0.8230(24位)**、Opus 4.5 0.8064、Sonnet 4.5 0.7954。コスパ枠の推奨は Sonnet 4.6(0.82〜0.83) — [Qualiteg](https://journal.qualiteg.com/llm-ranking-2026/)
- 公式モデルページは全現行モデルで「multilingual capabilities」を謳うが、日本語固有の数値は掲載なし — [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)

### Inferences
- レイアウトJSONのスキーマ設計上の含意: (a) フォントサイズ等の数値範囲(`minimum`/`maximum`)はサーバ側で強制されないので **enum 化(例: 8/9/10/12/14/18/24/36/48/72pt)またはアプリ側バリデーション**が必要。(b) 要素数上限(`maxItems`)も強制されないため、要素配列は description で上限を書き、アプリ側で切り詰める。(c) 入れ子ツリー(グループの中のグループ)は再帰スキーマ不可のため、**固定深さ**または平坦なID参照(`parentId`)で表現する。
- JSONの妥当性は文法制約で保証されるため、「最安で有効なJSON」は Haiku 4.5($1/$5)。ただし「見出しは本文より大きく」「余白は3段階から選ぶ」等の複数制約を守る質は Sonnet 5 が安全側。教育用途では Haiku 4.5(または後継 Haiku 5.5)で開始し、評価で不足なら Sonnet 5 に上げる二段構えが合理的。
- 日本語文字列を含む JSON は、Unicode エスケープ(`\uXXXX`)で返る可能性があるため、必ず `JSON.parse` で復号する(文字列一致で扱わない)。
- スキーマの初回コンパイル遅延は 24h キャッシュされるので、授業開始前にウォームアップ呼び出しを1回入れると初学者の初回体験が安定する。

### Gaps
- Sonnet 5 / Haiku 4.5 / Opus 5.5 の Nejumi 4 スコアは今回参照した集計に未掲載(Sonnet 5 は 2026-06-30 発売、Haiku 4.5 は集計対象外の模様)。
- 「JSON出力の信頼性」を日本語テキスト込みで定量比較した2026年の第三者レポートは見つからなかった(構造保証がGAになったため、比較の関心が「妥当性」から「内容の質」に移っている)。
- 構造化出力の注入 system prompt の具体トークン数は非公開。tool use の注入プロンプトは Sonnet 5 で 354、Haiku 4.5 で 496、Opus 5.5 で 286 トークン(`auto`時)と公開されており同程度と推測 — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

---

## 3. プロンプトキャッシュ・Batch API とリクエスト単価への影響

### Takeaway
キャッシュ書込は 1.25x(5分)/2x(1時間)、読出は 0.1x(Opus 5.5 は 0.05x、Fable 5.1 は 0.025x)。**最小キャッシュ長がモデル依存で、Haiku 4.5 は 4,096 トークン、Sonnet 5 は 1,024、Opus 5.5 は 512** — 想定の ~2,500 トークン system prompt は Haiku 4.5 ではキャッシュされない。Batch は入出力とも 50% 引きだが最大24時間の非同期処理なので対話型エディタには不向き、研究の事後一括生成には有効。

### Cited Findings
- 倍率: 5分書込 1.25x、1時間書込 2x、読出 0.1x(Fable 5.1/Mythos 5.1 は 0.025x、Opus 5.5 は 0.05x)。5分キャッシュは読出1回で元が取れ、1時間は2回で元が取れる。Batch 割引やデータレジデンシ倍率と乗算で重なる — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- 最小キャッシュ可能プレフィックス: Fable 5.1/5, Opus 5.5/5 = **512**;Opus 4.8, Sonnet 5, Sonnet 4.6/4.5 = **1,024**;Opus 4.7 = 2,048;Opus 4.6/4.5, **Haiku 4.5 = 4,096**。短いとエラーなく単に `cache_creation_input_tokens`/`cache_read_input_tokens` が 0 になる — [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- ブレークポイントは最大4、トップレベル `cache_control` の自動キャッシュも可。5分TTLはヒットのたびに無料で延長。`tools → system → messages` の順でプレフィックス一致。ツール定義変更や画像の追加/削除、`tool_choice` 変更はキャッシュ無効化 — 同上
- キャッシュはワークスペース単位で分離。プロンプトと出力は保存されず、KV表現とハッシュが TTL の間だけメモリ保持 — [API and data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention)
- レート制限上、`cache_read_input_tokens` は ITPM に**算入されない**(Haiku 3.5 を除く) — [Rate limits](https://platform.claude.com/docs/en/api/rate-limits)
- Batch: 入出力 50% 引き(Haiku 4.5 $0.50/$2.50、Sonnet 5 $1/$5、Opus 5.5 $2/$10、Opus 5 $2.50/$12.50、Fable 5.1 $5/$25)。1バッチ最大 100,000 リクエストまたは 256MB。多くは1時間以内に完了、24時間で期限切れ(期限切れ分は課金なし)。結果は作成後29日間取得可 — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- Batch は Vision・構造化出力・extended thinking に対応。プロンプトキャッシュと併用可だがヒットはベストエフォート(30〜98%)。1時間TTL推奨。`max_tokens: 0` のプリウォームは不可 — [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- トークナイザ実測(zenn, 2026-07-25、`count_tokens` で Sonnet 4.6 vs Opus 5/Sonnet 5/Opus 4.8): 日本語 −2.2%、英語 +37.9%、JSON +41.3%、日本語コメント付き Python +10.0%。同一内容の JA/EN トークン比は 1.78x → 1.21x — [zenn.dev](https://zenn.dev/ai_worklab/articles/claude-tokenizer-ja-en-tokens)
- 日本語の目安: 4.7以降で日本語1文字 ≈ 1〜2トークン(平均約1.5) — [Clauder Navi](https://www.clauder-navi.com/en/claude-token)(二次情報)

### 単価試算(筆者計算、USD、157円換算)
前提: 入力 3,000 トークン(うち 2,500 が固定 system+schema、500 が可変の現在レイアウト+指示)、出力 800 トークン。キャッシュ定常状態(書込は5分に1回のため無視)。tool use/構造化出力の注入プロンプト分は含まない。

| モデル | キャッシュなし | キャッシュあり(2,500読出+500入力) | 画像1枚(1000×1000=1,296tok)追加・キャッシュあり |
|---|---|---|---|
| Haiku 4.5 | $0.0070 (¥1.10) | **キャッシュ不可**(2,500 < 4,096)→ $0.0070 | $0.0083 (¥1.30) |
| Sonnet 5 | $0.0140 (¥2.20) | $0.0095 (¥1.49) | $0.0121 (¥1.90) |
| Opus 5.5 | $0.0280 (¥4.40) | $0.0185 (¥2.90) | $0.0237 (¥3.72) |
| Opus 5 | $0.0350 (¥5.50) | $0.0238 (¥3.73) | $0.0302 (¥4.75) |
| Fable 5.1 | $0.0700 (¥10.99) | $0.0456 (¥7.16) | $0.0586 (¥9.20) |

計算式例(Sonnet 5 キャッシュあり): 2,500×$0.20/M + 500×$2/M + 800×$10/M = $0.0005 + $0.001 + $0.008 = $0.0095。
Haiku 4.5 で system prompt を 4,096 トークン以上に増やせばキャッシュ可能となり、4,096×$0.10/M + 500×$1/M + 800×$5/M ≈ $0.0049(¥0.77)。
Batch 使用時は各セルを 0.5 倍(Sonnet 5 キャッシュなし $0.0070、Haiku 4.5 $0.0035)。

### Inferences
- 出力 800 トークンが単価の 57〜71% を占めるため、**出力を短くする(キー名短縮、差分のみ返す、`null` 省略)方がキャッシュより効く**。
- Sonnet 5 はキャッシュで −32%、Opus 5.5 は −34%。Haiku 4.5 は 4,096 未満では効かないので、Haiku を使うなら system prompt を意図的に 4,096 以上にするか、キャッシュを諦める。
- 新トークナイザ(Sonnet 5 / Opus 5.5)ではスキーマ/JSON 部分が Haiku 4.5 比 +40% 程度になるため、上表の Sonnet 5 / Opus 5.5 の入力は実測で 3,000 → 約 3,900 トークン相当になり得る。その場合 Sonnet 5 キャッシュなしは約 $0.0158。日本語比率が高いプロンプトなら影響は小さい。
- 対話型の授業アプリでは Batch は使えないが、研究で「同じ入力に対し複数モデル/複数試行を後から一括生成」する評価には Batch + 1時間キャッシュが最適(半額+キャッシュ)。

### Gaps
- 構造化出力が注入する system prompt のトークン数(数百トークン規模と推定)は未公開のため上表に含めていない。
- 実プロンプトのトークン数は `/v1/messages/count_tokens`(無料・ZDR対象)で事前計測すべき。

---

## 4. 新規アカウントのレート制限・利用ティア・月額上限・教育/研究向けクレジット

### Takeaway
ティアは Start($500/月上限)→ Build($1,000)→ Scale($200,000)→ Custom で、利用履歴に応じて自動昇格。ただし新規組織は「Evaluation tier」としてページ記載未満の制限から始まる場合がある。Start tier でも Sonnet 5 / Haiku 4.5 は 1,000 RPM・2M ITPM・400K OTPM と授業規模(40人)には十分。学術割引は「may be available」との記載のみで、明確な教育向けAPIクレジット制度は AI for Science(生命科学中心)と Claude Campus(学生ビルダー)に限られる。

### Cited Findings
- 2種類の制限: 月額支出上限(spend limit)とレート制限。組織単位で適用、ワークスペース単位で下限設定可 — [Rate limits](https://platform.claude.com/docs/en/api/rate-limits)
- 「New organizations and organizations with limited usage history may start in the **Evaluation tier**, with limits below the standard limits shown on this page … increase automatically as your organization builds usage history」 — 同上
- 月額上限: Start **$500**、Build **$1,000**、Scale **$200,000**、Custom は上限なし。上限到達で翌月1日 00:00 UTC まで 429(`enforced_spend_limit_reached`、`retry-after` なし)。Billing ページで自前の上限も設定可(超過時は 400) — 同上
- Start tier のレート制限(RPM / ITPM / OTPM): Sonnet 5、Opus 5.5、Opus 5、Haiku 4.5 いずれも **1,000 / 2,000,000 / 400,000**;Fable 5.x は 1,000 / 500,000 / 100,000。Build tier は 5,000 / 5M / 1M、Scale は 10,000 / 10M / 2M — 同上
- Batch API のレート制限(Start): 1,000 RPM、処理キュー 200,000、1バッチ 100,000 — 同上
- ITPM はキャッシュ読出を除いた入力のみ算入。`max_tokens` は OTPM に影響しない。急増トラフィックには acceleration limit があるため徐々に増やす — 同上
- 引き上げは Console の「Request rate limit increase」から — 同上
- 無料枠: 「New users receive a small amount of free credits to test the API」(金額の公式記載なし)。「Academic and research discounts may be available」(具体条件なし)。企業・大口は sales@anthropic.com — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- 新規アカウントの無料クレジットは $5 分との第三者記事(クレカ不要、有効期限あり) — [Uravation](https://uravation.com/media/anthropic-free-credits-april-2026-guide/), [DotAI TIMES](https://dot-ai.myuuu.co.jp/times/articles/795)(※非公式・要確認)
- AI for Science Program(2025-05-05 発表): 研究機関所属の研究者に API クレジット。分野は生物学・生命科学中心(創薬、農業等)。Google Form で申請 — [Anthropic](https://www.anthropic.com/news/ai-for-science-program)。2026年募集は1件あたり最大 $30,000、50件、締切 2026-07-15、実施 2026-09-01〜12-01 — [Granted AI](https://grantedai.com/blog/anthropic-claude-science-2026-30k-api-credits-50-projects-july-15-deadline-ai-for-science-researchers-strategy)(二次情報)
- Claude Campus Program: 学生向け $50 API クレジットを Builder Club 経由に統合、2026-27年度の申請締切 2026-09-12 — [aistudentdiscount.com](https://aistudentdiscount.com/claude-api-student-builder/)(二次情報)

### Inferences
- 40人×30リクエスト=1,200リクエストを90分の演習で処理する場合、ピーク時でも例えば 1リクエスト/10秒/人 → 240 RPM、非キャッシュ入力 ≈ 240×3,000 = 720K ITPM、出力 192K OTPM で Start tier 内に収まる。ただし Evaluation tier の実数値は非公開なので、**初回授業の前にクレジットを購入して数百リクエスト分の履歴を作り、Console の Limits ページで実値を確認**しておくべき。
- 月額 $500 の Start 上限は、本用途(1セッション $10〜30)なら十分。研究(§5)も 1回 $100 以下。
- デザイン教育/HCI 研究は AI for Science の対象外と読めるため、実質的にクレジット制度は期待できず、通常課金(数千円〜数万円規模)で計画するのが現実的。

### Gaps
- Evaluation tier の具体的な RPM/ITPM/OTPM は公式に未記載。
- 「Academic and research discounts」の申請窓口・条件は公式ページに記載なし(sales へ問い合わせが必要)。
- 新規無料クレジット $5 は第三者情報のみ。

---

## 5. コスト試算: 授業(40人×30回)と研究(60人×50回)

### Takeaway
1セッション 1,200 リクエストは Haiku 4.5 で約 $8(¥1,300)、Sonnet 5 で $10〜17(¥1,800〜2,600)、Opus 5.5 で $22〜34(¥3,500〜5,300)。研究 3,000 リクエストでも Sonnet 5 で $30〜42(¥4,500〜6,600)、Opus 5.5 で $56〜84(¥8,700〜13,200)に収まり、いずれも Start tier の月額 $500 上限内。

### Cited Findings
- 単価は §1 の公式価格、画像トークンは §7 の公式表(1000×1000px = 1,296 トークン)に基づく筆者計算 — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Vision](https://platform.claude.com/docs/en/build-with-claude/vision)

### 試算表(筆者計算、USD、括弧は 157円換算)
**A. 授業: 40人 × 30リクエスト = 1,200リクエスト/セッション**(入力3,000/出力800)

| モデル | キャッシュなし | キャッシュあり | 全リクエストに1MP画像付き(キャッシュあり) |
|---|---|---|---|
| Haiku 4.5 | $8.40 (¥1,319) | $8.40(不可)/ 4,096tok化で $5.88 (¥923) | $9.96 (¥1,564) |
| Sonnet 5 | $16.80 (¥2,638) | $11.40 (¥1,790) | $14.52 (¥2,280) |
| Opus 5.5 | $33.60 (¥5,275) | $22.20 (¥3,485) | $28.44 (¥4,465) |
| Opus 5 | $42.00 (¥6,594) | $28.50 (¥4,475) | $36.24 (¥5,690) |
| Fable 5.1 | $84.00 (¥13,188) | $54.72 (¥8,591) | $70.32 (¥11,040) |

**B. 研究: 60人 × 50リクエスト = 3,000リクエスト**

| モデル | キャッシュなし | キャッシュあり | 画像付き(キャッシュあり) |
|---|---|---|---|
| Haiku 4.5 | $21.00 (¥3,297) | $21.00 / 4,096tok化で $14.70 (¥2,308) | $24.90 (¥3,909) |
| Sonnet 5 | $42.00 (¥6,594) | $28.50 (¥4,475) | $36.30 (¥5,699) |
| Opus 5.5 | $84.00 (¥13,188) | $55.50 (¥8,714) | $71.10 (¥11,163) |
| Opus 5 | $105.00 (¥16,485) | $71.25 (¥11,186) | $90.60 (¥14,224) |
| Fable 5.1 | $210.00 (¥32,970) | $136.80 (¥21,478) | $175.80 (¥27,601) |

安全係数: 新トークナイザ(Sonnet 5/Opus 5.5)で英語・JSON 部分が +30〜40% になること、構造化出力の注入プロンプト、再試行、学生の想定超え利用を見込み、**予算は上表の 1.5〜2 倍**で計上するのが妥当。Sonnet 5 で1セッション ¥3,000〜5,000、研究全体 ¥7,000〜13,000 程度。

### Inferences
- 15回授業を Sonnet 5 キャッシュありで運用しても年間 ≈ $171(¥27,000)+安全係数で ¥5万前後。研究費としては消耗品レベル。
- 研究で「同一入力に対する複数モデル比較」を後追いで行う場合、Batch(半額)を使えば Opus 5.5 でも 3,000 リクエスト ≈ $28〜42。

### Gaps
- 上記は思考(thinking)トークンを含まない。Sonnet 5 / Opus 5.5 はデフォルトで adaptive thinking が有効で、思考トークンは出力単価で課金される。JSON 生成では `output_config.effort: "low"` 等で抑える必要があり、実測なしには上振れ幅が不明(§8 参照)。

---

## 6. データ利用・保持・処理地域(大学の倫理審査向け)

### Takeaway
商用(API)データは**デフォルトで学習に使われない**(商用利用規約に明記、2026-08-18更新のプライバシー記事も同旨)。標準保持は「受領/生成から30日以内に自動削除」、Usage Policy 違反フラグ時のみ分類スコアを最長7年保持。ZDR(ゼロ保持)は営業経由の個別契約で、Fable 5.1 等の Covered Model は対象外。推論地域は既定で `global`(どこで実行されるか不定)、`inference_geo: "us"` で米国限定(1.1x課金)。**日本国内での処理・保存を指定するオプションは存在しない**。

### Cited Findings
- 商用利用規約(2025-06-17 発効): 「Anthropic may not train models on Customer Content from Services」。DPA を参照組込み、EEA/スイス/UK はアイルランド法、その他はカリフォルニア法 — [Commercial Terms](https://www.anthropic.com/legal/commercial-terms)
- プライバシーセンター(2026-08-18 更新): 「By default, we will not use your inputs or outputs from our commercial products to train our models」。例外は明示的なフィードバック/バグ報告(最長5年保持、学習利用の可能性) — [privacy.claude.com](https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training)
- 保持期間(2026-07-01 更新): 「automatically delete inputs and outputs on our backend within 30 days of receipt or generation」。例外: Files API 等ユーザ管理の保持、個別契約(ZDR)、Usage Policy 執行(フラグ時に分類スコアを最長7年)、法令遵守 — [privacy.claude.com](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-personal-data)
- 公式 API ドキュメント: 「Retained data is never used for model training without your express permission」「Conversation content … is not retained by default; the exception is Covered Models, which require 30-day retention」 — [API and data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention)(※プライバシー記事の「30日以内に削除」と表現が異なる。前者は保持設計の原則、後者は商用データ保持ポリシー。両方を併記して審査書類に載せるのが安全)
- ZDR: 組織単位、営業チーム経由で有効化。Messages / count_tokens は対象。**構造化出力/strict tool use は「Yes (qualified)」— プロンプト/出力は保存しないが JSON スキーマのみ最大24時間キャッシュ**。プロンプトキャッシュは Yes(KV 表現のみ TTL 間メモリ保持)。Files API は No(削除まで保持)。ZDR 組織では **CORS 非対応**(ブラウザから直接呼べない、バックエンド経由必須)。Console/Playground は ZDR 対象外 — 同上
- Covered Models(Fable 5.1 / Mythos 5.1 / Fable 5 / Mythos 5)は 30日保持必須、ZDR 組織からのリクエストは 400。ワークスペース単位で 30日保持を有効化して回避可能 — 同上
- データレジデンシ: `inference_geo` は `"global"`(既定、任意の地域で推論)と `"us"`(米国内のみ、全トークン種別 1.1x)。Workspace geo(保存・画像トランスコード等の処理地)は現在 `"us"` のみ。4.6 以降のモデルのみ対応、Haiku 4.5 では 400 — [Data residency](https://platform.claude.com/docs/en/manage-claude/data-residency)
- 画像: 「Image uploads are ephemeral and not stored beyond the duration of the API request」「Anthropic does not use uploaded images to train models」。画像メタデータは読まない。人物の同定は AUP で禁止 — [Vision](https://platform.claude.com/docs/en/build-with-claude/vision)
- Bedrock / Google Cloud 経由ではデータ処理者がクラウド事業者になり、Bedrock には東京リージョン等の地域指定エンドポイントがある(地域指定は +10%) — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [API and data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention)

### Inferences
- 倫理審査向けの整理: (1) 送信内容はレイアウトパラメータ・テキスト・参照画像であり、**学生の氏名・学籍番号等を送らない設計**(アプリ側で匿名IDに置換)にすれば API 側の個人情報リスクは最小化できる。(2) 学習利用なし・30日削除・米国等国外での処理、をそのまま説明文に書ける。(3) 「参照画像に人物が写る場合」は、人物同定禁止と一時的処理のみである旨を記載。
- 日本国内処理が審査要件になる場合、第一次 API では満たせず、**Amazon Bedrock 東京リージョン**(データ処理者 = AWS、リージョン固定 +10%)が唯一の現実的選択肢。ただし Bedrock の構造化出力対応モデルは Opus 4.6 / Sonnet 4.6 / 4.5 / Opus 4.5 / Haiku 4.5 と記載(Sonnet 5 の Bedrock 構造化出力対応は要確認)。
- ZDR は小規模研究には過剰(営業契約が必要、CORS 不可)。標準の30日保持で十分と考えられる。

### Gaps
- 日本の個人情報保護法上の「外国にある第三者への提供」に相当するかの法的評価は本調査の範囲外(Anthropic の DPA/Supported Regions Policy の本文は未取得)。
- Bedrock 東京リージョンでの Sonnet 5 / Opus 5.5 提供状況と構造化出力の対応は未確認。

---

## 7. 画像入力(Vision)のコストと制約

### Takeaway
画像は 28×28px パッチ単位で `⌈w/28⌉×⌈h/28⌉` トークン。1000×1000px(1MP)= 1,296 トークンで、Haiku 4.5 なら $0.0013、Sonnet 5 $0.0026、Opus 5.5 $0.0052。4.7 以降の高解像度ティアは長辺 2576px/最大 4,784 トークンまで縮小しないため、大きい参照画像は**送信前に長辺 ~1000〜1500px に縮小**するとコストを抑えられる。

### Cited Findings
- トークン式と上限: 「⌈width / 28⌉ × ⌈height / 28⌉ visual tokens」。高解像度ティア(4.7 以降)= 長辺 2576px / 4,784 トークン、標準ティア(Haiku 4.5 等)= 1568px / 1,568 トークン。例: 1000×1000 = 1,296、1092×1092 = 1,521、1920×1080 = 標準 1,560 / 高解像度 2,691、2000×1500 = 標準 1,564 / 高解像度 3,888、3840×2160 = 標準 1,560 / 高解像度 4,784 — [Vision](https://platform.claude.com/docs/en/build-with-claude/vision)
- 公式コスト例: Haiku 4.5 で 1000×1000 画像は 1,000枚あたり約 $1.30、Opus 5(高解像度)で約 $6.48、4K 画像は約 $23.92 — 同上
- 制限: 1画像 8000×8000px まで、10MB(base64)まで、1リクエスト 100枚(200Kコンテキストモデル)/600枚。JPEG/PNG/GIF/WebP。画像はテキストの前に置くと精度が良い — 同上
- Files API で `file_id` 参照にすれば複数ターンで再送不要 — 同上
- 画像の追加/削除はプロンプトキャッシュを無効化する — [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### Inferences
- 参照画像分析(色・レイアウト傾向の抽出)は、system prompt キャッシュの**後**(messages 側)に置けばキャッシュを壊さない。
- 参照画像から「配色・余白・グリッド傾向」を抽出する呼び出しは1回だけ行い、結果を JSON で保持して以降のレイアウト生成に文字列で渡す方が、毎回画像を送るより安い(1,296 トークン × リクエスト数を節約)。

### Gaps
- Sonnet 5 / Opus 5.5 のレイアウト/配色理解の精度に関する定量評価は見つからなかった。

---

## 8. 実装上の注意(API仕様の変更点)

### Takeaway
2025〜2026 年に API の形が大きく変わっており、学習データ上の記憶で書くと 400 エラーになりやすい。JSON 生成用途では「構造化出力 + adaptive thinking を低 effort + streaming」が現行の定石。

### Cited Findings
- `thinking: {type: "adaptive"}` が現行モデルの標準。Fable 5.x / Opus 5.5 は思考を無効化不可(`disabled` は 400)、`budget_tokens` は 4.7 以降で 400。Haiku 4.5 のみ `{type: "enabled", budget_tokens: N}` 形式 — [claude-api skill 内部リファレンス, 2026-06-24 キャッシュ](file:///private/tmp/claude-501/bundled-skills/2.1.280/ede8fde21af2b1ba456a2120672afe94/claude-api)(※Anthropic 提供スキル文書)、Opus 5.5 のデフォルト effort は `medium`、Sonnet 5 は `high` — [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- `output_config: {effort: "low"|"medium"|"high"|"xhigh"|"max"}` で思考量とトークン消費を制御(GA、ベータ不要)。Haiku 4.5 は非対応 — 同上
- 4.6 以降で assistant prefill は 400。Opus 5.5 / Fable 5.1 で `tool_choice: any/tool` は 400 — [claude-api skill 内部リファレンス](file:///private/tmp/claude-501/bundled-skills/2.1.280/ede8fde21af2b1ba456a2120672afe94/claude-api)(※同上)
- Models API(`GET /v1/models`)は `max_input_tokens`、`max_tokens`、`capabilities` を返すため、対応機能をプログラムで確認できる — [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- 4.7 以降のツール入力 JSON はエスケープ形式が変わり得る(Unicode/スラッシュ)。必ず `JSON.parse` で扱う — [claude-api skill 内部リファレンス](file:///private/tmp/claude-501/bundled-skills/2.1.280/ede8fde21af2b1ba456a2120672afe94/claude-api)(※同上)

### Inferences
- 推奨構成(TypeScript、`@anthropic-ai/sdk`): `client.messages.create({ model, max_tokens: ~2000, system: [{type:"text", text: SYSTEM_AND_SCHEMA_GUIDE, cache_control:{type:"ephemeral"}}], messages:[...現在レイアウト JSON + 指示], output_config: { format: {type:"json_schema", schema}, effort: "low" } })`。Sonnet 5 / Opus 5.5 では `effort: "low"` で思考トークンを抑え、Haiku 4.5 では `thinking` を省略(思考なし)。
- API キーはブラウザに置かず、バックエンド(Vite アプリなら軽量サーバ or Cloudflare Workers 等)経由で呼ぶ。ZDR にしないなら CORS 制約はないが、キー漏洩とレート/支出上限の観点で必須。
- モデル ID・effort・スキーマは設定ファイル化し、Haiku 5.5 / Sonnet 5.5 登場時に即切替できるようにする。

### Gaps
- Sonnet 5 / Opus 5.5 の `effort: "low"` 時の平均思考トークン数(JSON 生成タスク)は公開データがなく、実測が必要。
