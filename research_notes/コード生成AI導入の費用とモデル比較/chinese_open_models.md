# 中国系LLM・オープンウェイトLLMの選択肢(ポスター/フライヤー編集アプリ向け、2026年9月時点)

前提・注記
- 調査日: 2026-09-23。価格はすべて「公式ページまたは各ホスティング事業者の価格ページを当日取得した値」。為替は **1 USD = 150 JPY と仮定**(調査時点の実勢レートは未確認、概算のため)。
- 用途: 教育・研究用Webアプリ。LLMに構造化されたレイアウト/スタイル・パラメータ(JSON)を出力させ、任意で参照画像を解析。1リクエストあたり入力 ~3,000 tokens・出力 ~800 tokens、1コマ ~40名。
- 本ノートの執筆者(モデル)の知識カットオフは2026年6月であり、以下に登場する「DeepSeek-V4.1-Flash」「Qwen3.8」「GLM-5.3」「Kimi K3」「MiniMax-M3」等は当日取得したページの記載をそのまま採用している。ページ記載以外の裏取りはできていない点に注意。
- 「[未検証]」と付した項目は一次情報で確認できていない。

---

## Q1. 各社公式APIの現行価格(入力/出力・キャッシュ・オフピーク)

### Takeaway
中国系5社の中でも価格帯は2桁違う。最安クラスは DeepSeek Flash(入力$0.30/出力$1.2、オフピークで半額)、GLM-5.3-Flash($0.15/$0.50)、Qwen-Flash(国際版 $0.05〜/$0.40〜)、MiniMax-M3($0.30/$1.20)。旗艦モデル(DeepSeek V4 Pro、Qwen3-Max、GLM-5.3、Kimi K3)は入力$1〜3/出力$4〜15で、本用途(短いJSON出力)にはオーバースペックである。

### Cited Findings

**DeepSeek(api-docs.deepseek.com、日付記載なし)**
- 現行モデルは `deepseek-flash`(DeepSeek-V4.1-Flash)と `deepseek-v4-pro`(DeepSeek-V4-Pro-0813)の2つ — [DeepSeek Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- deepseek-flash: 入力(キャッシュヒット)$0.006 / 入力(ミス)$0.30 / 出力 $1.20 per 1M tokens(ピーク時)。オフピークはそれぞれ半額($0.003 / $0.15 / $0.60) — [DeepSeek Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- deepseek-v4-pro: 入力(ヒット)$0.044 / 入力(ミス)$1.32 / 出力 $3.96(ピーク)。オフピークは半額($0.022 / $0.66 / $1.98) — [DeepSeek Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- ピーク時間帯は UTC 01:00–04:00 と 06:00–10:00 の平日(中国の祝日を除く)。それ以外はオフピーク割引。日本時間では 10:00–13:00 と 15:00–19:00(平日)がピークに相当し、**日本の授業時間帯はほぼピーク価格**になる — [DeepSeek Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- 両モデルともJSON出力・tool callingをサポート。Vision対応は deepseek-flash のみ — [DeepSeek Pricing](https://api-docs.deepseek.com/quick_start/pricing)

**Alibaba Cloud Model Studio(国際版=シンガポール / 中国版=北京、価格ページ)**
- Qwen3-Max: シンガポール 入力$1.2〜3 / 出力$6〜15(入力トークン数に応じた段階制)。北京 入力$0.359〜1.004 / 出力$1.434〜4.014 — [Alibaba Cloud Model Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)
- Qwen-Plus: シンガポール 入力$0.4〜1.2 / 出力$1.2〜3.6(段階制、最大1Mトークン)。北京 入力$0.115〜0.689 / 出力$0.287〜6.881 — [Alibaba Cloud Model Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)
- Qwen-Flash: シンガポール 入力$0.05〜0.25 / 出力$0.4〜2(段階制)。北京 入力$0.022〜0.173 / 出力$0.216〜1.721。バッチ推論は50%引き、context cachingあり — [Alibaba Cloud Model Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)
- Qwen-VL-Max: 入力$0.8 / 出力$3.2。Qwen-VL-Plus: 入力$0.21 / 出力$0.63。いずれもcontext caching割引あり — [Alibaba Cloud Model Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)
- 各モデルに100万トークンの無料枠(Model Studio有効化から90日、シンガポール区域のみのモデルも多い) — [Alibaba Cloud Model Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)
- 北京リージョンの価格はシンガポールより大幅に安い(Qwen3-Maxで約1/3) — [Alibaba Cloud Model Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)

**Moonshot / Kimi(platform.kimi.ai、日付記載なし。旧 platform.moonshot.ai は kimi.ai へ301リダイレクト)**
- kimi-k3: 入力$3.00 / キャッシュ入力$0.30 / 出力$15.00、コンテキスト1,048,576 tokens。キャッシュ書込 $3.00(5分TTL)/$6.00(1時間TTL) — [Kimi Pricing](https://platform.kimi.ai/docs/pricing/chat)
- kimi-k2.6: 入力(ミス)$0.95 / (ヒット)$0.16 / 出力$4.00、コンテキスト262,144 — [Kimi Pricing](https://platform.kimi.ai/docs/pricing/chat)
- kimi-k2.7-code: 入力$0.95 / ヒット$0.19 / 出力$4.00。highspeed版はその2倍($1.90 / $0.38 / $8.00) — [Kimi Pricing](https://platform.kimi.ai/docs/pricing/chat)
- 価格ページにはJSONモード・tool calling・visionの記載なし(別ページの可能性あり) — [Kimi Pricing](https://platform.kimi.ai/docs/pricing/chat)

**Zhipu / Z.ai(docs.z.ai、日付記載なし)**
- GLM-5.3: 入力$1.4 / キャッシュ$0.26 / 出力$4.4。GLM-5.2・GLM-5.1も同額。GLM-5: $1 / $0.2 / $3.2 — [Z.ai Pricing](https://docs.z.ai/guides/overview/pricing)
- GLM-5.3-Flash: 入力$0.15 / キャッシュ$0.03 / 出力$0.50。GLM-5.3-FlashX: $0.37 / $0.075 / $1.25 — [Z.ai Pricing](https://docs.z.ai/guides/overview/pricing)
- GLM-4.7 / GLM-4.5: $0.6 / $0.11 / $2.2。GLM-4.5-Air: $0.2 / $0.03 / $1.1。GLM-4.7-FlashX: $0.07 / $0.01 / $0.4。GLM-4.7-Flash と GLM-4.5-Flash は無料枠あり — [Z.ai Pricing](https://docs.z.ai/guides/overview/pricing)
- Vision: GLM-4.6V $0.3 / $0.05 / $0.9。GLM-4.5V $0.6 / $0.11 / $1.8。GLM-4.6V-FlashX $0.04 / $0.004 / $0.4。GLM-4.6V-Flash は無料 — [Z.ai Pricing](https://docs.z.ai/guides/overview/pricing)
- 「Cached Input Storage」は期間限定無料 — [Z.ai Pricing](https://docs.z.ai/guides/overview/pricing)

**MiniMax(platform.minimax.io、日付記載なし)**
- MiniMax-M3(≤512kトークン): 入力$0.30 / 出力$1.20 / キャッシュ読取$0.06(「永久50%オフ」表示)。>512kは倍額($0.60 / $2.40) — [MiniMax Pay-as-you-go](https://platform.minimax.io/docs/guides/pricing-paygo.md)
- MiniMax-M2.7: 入力$0.3 / 出力$1.2 / キャッシュ読取$0.06 / 書込$0.375。highspeed版 $0.6 / $2.4 — [MiniMax Pay-as-you-go](https://platform.minimax.io/docs/guides/pricing-paygo.md)
- `service_tier=priority` は標準の1.5倍 — [MiniMax Pay-as-you-go](https://platform.minimax.io/docs/guides/pricing-paygo.md)
- MiniMax-M3 は「Agentic Model with exceptional Tool Use capabilities」としてFunction Callingガイドあり — [MiniMax docs index](https://platform.minimax.io/docs/llms.txt)

### Inferences
- 短いJSON出力を大量に返す本用途では、出力単価が支配的になりにくく(出力800 tokens)、入力3,000 tokensの単価が効く。入力$0.05〜0.30帯のFlash系(DeepSeek Flash、Qwen-Flash、GLM-5.3-Flash、MiniMax-M3)で十分。
- DeepSeekのオフピーク割引は日本の授業時間帯(平日昼)には効かない。夜間の宿題用途なら半額になる。
- Alibabaの「北京リージョン」価格は魅力的だが、後述の通り中国本土ホストのため大学利用では選びにくい。国際版(シンガポール)を前提にすべき。

### Gaps
- Kimi K2/K3 の vision 対応モデル(kimi-k2-vision 等)の価格は価格ページに見当たらず未確認。
- MiniMax M3 のコンテキスト長・structured output(json_schema)対応はドキュメント索引からは確認できず。
- DeepSeek・Kimi・Z.ai・MiniMax の価格ページに日付記載がなく、「9月時点」は取得日ベース。

---

## Q2. 米国ホスト経由(OpenRouter / Hugging Face / Together / Fireworks / Groq / DeepInfra)の価格とデータ保持条件

### Takeaway
米国ホスト経由なら同じオープンウェイトモデルを「学習に使わない・ゼロ保持」の条件で使え、価格も本家と同等〜やや高い程度(DeepInfraは本家より安い場合も)。Hugging Face Inference Providers は各プロバイダの価格をそのまま転嫁(マークアップなし)、OpenRouter は既定でプロンプトを保存せず ZDR 設定が可能だが、実際のデータ処理は経路先プロバイダの方針に従う。

### Cited Findings

**DeepInfra(価格ページ、日付記載なし)**
- DeepSeek V4-Flash $0.09 / $0.18、V4-Flash-0731 $0.06 / $0.18、V4-Pro $1.30 / $2.60 — [DeepInfra Pricing](https://deepinfra.com/pricing)
- Qwen3.8-Max $1.65 / $4.951、Qwen3-Max $1.20 / $6.00、Qwen3.6-27B $0.32 / $3.20、Qwen3.5-397B-A17B $0.45 / $3.00、Qwen3.5-35B-A3B $0.14 / $1.00、Qwen3-VL-235B-A22B-Instruct $0.20 / $0.88 — [DeepInfra Pricing](https://deepinfra.com/pricing)
- Kimi-K3 $2.85 / $14.25、Kimi-K2.6 $0.75 / $3.50 — [DeepInfra Pricing](https://deepinfra.com/pricing)
- Gemma-4-31B-it-turbo $0.09 / $0.34、Gemma-4-31B-it $0.13 / $0.38、Llama-4-Scout $0.10 / $0.30、Llama-4-Maverick $0.20 / $0.80、Mistral-Small-3.2-24B $0.075 / $0.20 — [DeepInfra Pricing](https://deepinfra.com/pricing)
- DeepInfraはゼロ保持方針、SOC 2・ISO 27001、プロンプト/補完は短期保持後にディスクとメモリから削除しメタデータ(request ID、コスト、サンプリングパラメータ)のみログ — [morphllm: Fireworks vs DeepInfra](https://www.morphllm.com/comparisons/fireworks-vs-deepinfra)(二次情報。一次は [DeepInfra Privacy](https://deepinfra.com/privacy)、未取得)

**Fireworks**
- Kimi K2.6 $0.95 / $4.00(キャッシュ$0.16)、DeepSeek V4 Pro $1.74 / $3.48(キャッシュ$0.145)、DeepSeek V4 Flash $0.14 / $0.28 — [morphllm: Fireworks vs DeepInfra](https://www.morphllm.com/comparisons/fireworks-vs-deepinfra)(二次情報)
- Fireworks はオープンモデルについて明示的オプトインなしにプロンプト/生成をログ・保存しない Zero Data Retention、学習にも使わない。SOC 2 Type II、HIPAA、TLS 1.2+/AES-256 — [Fireworks Data Security](https://docs.fireworks.ai/guides/security_compliance/data_security)

**Together AI**
- DeepSeek V4 Pro 入力$2.10、Kimi K2.6 $1.20 / $4.50 — [morphllm: Fireworks vs Together](https://www.morphllm.com/comparisons/fireworks-vs-together)(二次情報)
- Together は「学習に使わない(オプトインのみ)、既定ゼロ保持」 — [betterclaw: AI provider training policies, 2026-09-15](https://www.betterclaw.io/blog/ai-provider-training-data-policy-2026)(二次情報)

**Groq**
- gpt-oss-120B $0.15 / $0.60。Llama 3.3 70B、Llama 4 Scout、Qwen3 32B、Kimi K2 を提供 — [AI Pricing Guru: Groq](https://www.aipricing.guru/groq-pricing/)(二次情報)
- Groq は契約で学習を禁止、セルフサーブZDR、米国のみ — [betterclaw](https://www.betterclaw.io/blog/ai-provider-training-data-policy-2026)(二次情報)

**OpenRouter**
- OpenRouter 自身は既定でプロンプト/応答を保存せず(プロンプトログはオプトイン)、保持するのはトークン数・レイテンシ・モデル等のメタデータ。Zero Data Retention を設定として提供 — [Meetily: OpenRouter Data Retention 2026](https://meetily.ai/llm-privacy/openrouter)(二次情報)
- ただし「保持・学習の既定は両者(OpenRouterと下流プロバイダ)の方針の和集合」であり、下流プロバイダの方針も考慮が必要 — [Meetily](https://meetily.ai/llm-privacy/openrouter)
- 公式ドキュメントは「各プロバイダに独自のログ/保持方針がある」とし、「データで学習する可能性のあるプロバイダへのルーティングを許可する」設定が存在。Enterprise では EU/US の域内ルーティング設定あり(データが域外に出ない) — [OpenRouter Provider Logging](https://openrouter.ai/docs/guides/privacy/provider-logging)
- 学習しない西側ホスト(Fireworks、Together、DeepInfra)は本家の約2倍の価格になることがある。Qwen3-235B-A22B-Instruct は DeepInfra 経由 $0.09/$0.10 — [morphllm: OpenRouter alternatives](https://www.morphllm.com/openrouter-alternative)(二次情報)
- OpenRouter 上の DeepSeek は26以上のモデル(v3系、r1系、v4 Flash/Pro、v4.1-flash、`deepseek-flash-latest` 等のローリングエイリアス) — [OpenRouter DeepSeek](https://openrouter.ai/deepseek)
- Gemma 4 31B は OpenRouter で16プロバイダが提供し、入力 $0.09〜0.99 / 出力 $0.34〜1.49 とプロバイダで大きく異なる — [OpenRouter Gemma 4 31B](https://openrouter.ai/google/gemma-4-31b-it)

**Hugging Face Inference Providers**
- 「Hugging Face charges you the same rates as the provider, with no additional fees」— マークアップなしのパススルー課金 — [HF Inference Providers Pricing](https://huggingface.co/docs/inference-providers/en/pricing)
- 月次無料クレジット: Free $0.10、PRO $2.00、Team/Enterprise $2.00/席。超過分は従量課金(クレジット購入) — [HF Inference Providers Pricing](https://huggingface.co/docs/inference-providers/en/pricing)
- OpenAI互換エンドポイント `https://router.huggingface.co/v1`。Custom Provider Key を設定すればプロバイダ直接課金も可能 — [HF Inference Providers Pricing](https://huggingface.co/docs/inference-providers/en/pricing)
- Inference Providers はリクエストをパートナー(Together、SambaNova、Cerebras、Fal、Groq 等)へルーティングするため、HF とプロバイダ双方のプライバシーポリシーを確認する必要がある。Inference Endpoints(専用)は AWS US/EU リージョンのみ — [techjacksolutions: HF Inference API](https://techjacksolutions.com/ai-tools/hugging-face/hugging-face-inference-api/)(二次情報)

### Inferences
- **「中国モデル×米国ホスト」は本家APIとほぼ同価格で、データ保持リスクを大きく下げられる**。DeepSeek V4 Flash は DeepInfra($0.09/$0.18)の方が本家ピーク価格($0.30/$1.20)より安い。
- 研究室での最小構成は「Hugging Face 経由(パススルー価格、請求統合)」か「DeepInfra/Fireworks 直接」。OpenRouter は利便性が高いが、下流プロバイダの選択(学習許可のオフ設定)を必ず行う必要がある。

### Gaps
- OpenRouter の provider-logging ページの表は動的に生成されるため、プロバイダ別の保持/学習方針の一覧を静的に取得できなかった。
- Together AI の「学習しない」条件は一次ソース(利用規約)で未確認、二次情報のみ。
- Groq で中国系モデル(Qwen3 32B、Kimi K2)の正確な単価は未取得。

---

## Q3. JSON Schema / structured output・function calling の対応状況と日本語品質

### Takeaway
DeepSeek は両モデルで JSON 出力と tool calling を明記。Qwen は「JSON Object モード」はほぼ全モデルで対応するが「JSON Schema モード(スキーマ強制)」は Qwen3.7/3.8 の Plus・Flash・Max 系に限られ、**シンガポール(国際)リージョンでは未対応、かつ画像入力時は json_schema が json_object にフォールバックしてスキーマ制約が効かない**。日本語品質では Nejumi Leaderboard 4(2026-09-01)で Qwen3.8-2.4T が0.8598でオープンモデル首位、GLM-5.3-Flash や DeepSeek-V4-Flash も0.82前後と高水準。中国語混入は歴史的に報告されている問題だが、最新世代での定量的報告は見つからなかった。

### Cited Findings

**Structured output / function calling**
- DeepSeek: deepseek-flash と deepseek-v4-pro の両方が JSON 出力と tool calling をサポート — [DeepSeek Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- Qwen JSON Object モード対応: Qwen-Max/Plus/Flash/Turbo/Coder/Long、Qwen-VL(非thinkingモード)、Qwen-Omni、オープンソースの Qwen3.8/3.6/3.5/3/Qwen3-Coder/Qwen2.5。「system か user メッセージに 'JSON' という語を含める必要がある」 — [Alibaba: Qwen structured output(2026-09-18)](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output)
- Qwen JSON Schema モード対応は「Qwen3.7-Plus series, Qwen3.7-Flash series, Qwen3.7-Max series, Qwen3.8-Max series, and Qwen3.8-Flash series」のみ。**シンガポールリージョンのモデルは未対応** — [Alibaba: Qwen structured output](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output)
- 「Multimodal inputs (image, video, audio, etc.) do not support `json_schema` and will automatically fall back to `json_object`; the schema constraints will not take effect.」 — [Alibaba: Qwen structured output](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output)
- thinking モードでは厳密な JSON にならない場合があり、公式は「thinkingで出力→非thinkingのJSON対応モデルで検証・修復」の2段構えを推奨 — [Alibaba: Qwen structured output](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output)
- Qwen3.5-35B-A3B(オープンウェイト)で JSON schema response format 使用時に reasoning content が `message.content` に漏れる報告 — [HF discussion Qwen3.5-35B-A3B #18](https://huggingface.co/Qwen/Qwen3.5-35B-A3B/discussions/18)
- Together AI は structured outputs(JSON schema)を提供 — [Together docs: Structured outputs](https://docs.together.ai/docs/inference/chat/structured-outputs)
- MiniMax-M3 は Function Calling ガイドあり — [MiniMax docs index](https://platform.minimax.io/docs/llms.txt)
- Z.ai と Kimi の価格ページには structured output / function calling の記載なし(別ドキュメントの可能性あり、未確認) — [Z.ai Pricing](https://docs.z.ai/guides/overview/pricing); [Kimi Pricing](https://platform.kimi.ai/docs/pricing/chat)

**日本語品質(ベンチマーク)**
- Nejumi Leaderboard 4(2026-09-01 スナップショット)の Qualiteg 集計: オープン/中国系上位は Qwen3.8-2.4T-A95B 0.8598、Kimi-K3 0.8425、Tencent Hy4-preview 0.8344、Qwen3.8-Flash-Next 0.8291、GLM-5.3 0.8287、GLM-5.3-Flash 0.8260、Qwen3.5-397B-A17B 0.8191、DeepSeek-V4-Flash 0.8169、DeepSeek-V4-Pro 0.8067 — [Qualiteg: Japanese LLM Rankings 2026 (Sept 1)](https://journal.qualiteg.com/llm-ranking-2026/)
- 全体首位は Claude Opus 5 の 0.8720。Qwen3.8-2.4T-A95B は総合3位(0.8598)で「オープンモデルとして初めて0.85超え」。API上位とオープン上位の差は約0.033→0.012に縮小 — [Qualiteg](https://journal.qualiteg.com/llm-ranking-2026/)
- 同レポートは中国語混入や日本語劣化を明示的には指摘していない — [Qualiteg](https://journal.qualiteg.com/llm-ranking-2026/)
- Nejumi Leaderboard 4 の10B未満クラスでは Nemotron Nano 9B JP が1位 — [lilting: Japanese LLMs April 2026](https://lilting.ch/en/articles/japanese-llm-options-compared)(二次情報)
- Qwen3.6 と Gemma 4 は Apache 2.0、Qwen3.6-Max は API のみでオープン版は 27B / 35B-A3B の中位クラス — [DevelopersIO: local LLM guide 2026 summer](https://dev.classmethod.jp/en/articles/local-llm-guide-2026-summer/)(二次情報)

**中国語混入問題(歴史的報告)**
- DeepSeek-V3 系: 英語のみの会話中に孤立した漢字が1〜2文字混入する事象がGitHub Issueで報告 — [deepseek-ai/DeepSeek-V3 issue #1045](https://github.com/deepseek-ai/DeepSeek-V3/issues/1045)
- QwQ-32B-Preview: 応答に中国語が混入する報告 — [HF discussion QwQ-32B-Preview #16](https://huggingface.co/Qwen/QwQ-32B-Preview/discussions/16)
- 初期 Qwen-7B chat: 英語中に中国語で応答する報告。min_p=0.01 が緩和策として有効との記述 — [QwenLM/Qwen issue #543](https://github.com/QwenLM/Qwen/issues/543)
- DeepSeek の日本語対応: 「英語や中国語が混在する文では文字化けや意図しない変換が起こり得る」、言語切替に改善余地 — [Hakky Handbook: DeepSeek Japanese support](https://book.st-hakky.com/en/data-science/deepseek-japanese-support-and-use-cases)(二次情報)

### Inferences
- 本アプリの JSON は「色コード・座標・フォント名・数値」が中心で自然言語は少ないため、中国語混入の実害は主にテキスト系フィールド(キャッチコピー案など)に限られる。**アプリ側で JSON Schema バリデーション + 漢字コードポイント検査(簡体字範囲)を入れれば運用可能**。
- Qwen で「厳密スキーマ+画像入力」を両立させたい場合、公式APIでは不可(json_object にフォールバック)。画像解析は別呼び出し(色抽出→テキスト化)にし、レイアウト生成は json_schema 対応モデルで、と分離する設計が安全。
- 米国ホスト(Together/Fireworks/DeepInfra/vLLM)経由なら、サーバ側の guided decoding(JSON schema 強制)が使えるため、モデル本家APIの制約を回避できる可能性が高い(Together は公式にstructured outputsを提供)。

### Gaps
- Nejumi Leaderboard の「JSON 出力/関数呼び出し」サブスコアや「中国語混入率」の定量値は取得できず。
- Artificial Analysis / LMArena の日本語・structured output に関する数値は今回未取得。
- Kimi K2/K3、GLM-5.x の JSON Schema(厳密モード)対応は一次情報で未確認。
- 最新世代(V4、Qwen3.8、GLM-5.3)における中国語混入の定量報告は見つからなかった(「報告がない」≠「問題がない」)。

---

## Q4. データプライバシー・ガバナンス(日本の大学研究利用の観点)

### Takeaway
DeepSeek の公式プライバシーポリシー(2026-02-10発効)は「収集情報を中華人民共和国内のサーバに保存」し「モデル訓練・技術改善に利用(オプトアウト権あり)」と明記。日本政府(デジタル庁/NISC/個人情報保護委員会)は2025年2月に「DeepSeek等の生成AI」の業務利用に注意喚起を出し、広島大学など国内大学がそれを周知している(「禁止」ではなく「注意」)。米国ホスト(Fireworks/DeepInfra/Together/Groq)経由ならデータは中国に渡らず、学習にも使われない(各社明記)ため、大学の倫理・情報セキュリティ審査上のハードルが大幅に下がる。

### Cited Findings

**中国側の一次情報**
- DeepSeek プライバシーポリシー(発効 2026-02-10): 「当社が収集した情報を中華人民共和国にある安全なサーバーに保存」。利用目的に「機械学習モデルやアルゴリズムなどの当社の技術のトレーニングおよび改善」。ユーザーは「モデル訓練または技術最適化のための個人データ利用を拒否する権利」を持つ。保持期間は「サービス提供に必要な期間」。API(オープンプラットフォーム)については「第三者開発者が独自のデータ方針を持つ」と簡潔に言及するのみ。準拠法条項は本文書には見当たらず — [DeepSeek Privacy Policy](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html)
- DeepSeek(ファーストパーティAPI)は「既定で学習に使用、公開された保持期間なし、PRC 内で処理・保存、越境移転が設計上の前提」 — [betterclaw (2026-09-15)](https://www.betterclaw.io/blog/ai-provider-training-data-policy-2026)(二次情報)
- Alibaba Model Studio は国際版(シンガポール)と中国版(北京)でリージョン・価格が別体系 — [Alibaba Cloud Model Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)

**PRC のデータ法制**
- PIPL は2021-11-01施行。サイバーセキュリティ法・データ安全法と合わせて包括的枠組みを構成 — [VeraSafe: PIPL summary](https://verasafe.com/blog/china-personal-information-protection-law-pipl/)
- PIPL は重要情報インフラ運営者や一定量以上の個人情報を扱う処理者に中国国内での保存(データローカライゼーション)を要求し、越境移転には当局の安全評価等を課す — [FPF: China's PIPL](https://fpf.org/blog/chinas-new-comprehensive-data-protection-law-context-stated-objectives-key-provisions/)
- 「API 事業者が政府へデータ提供する義務」の具体条文(国家情報法など)は今回の検索結果には含まれず — [検索結果に該当なし]

**日本政府・大学の対応**
- デジタル庁 デジタル社会推進会議幹事会事務局「DeepSeek 等の生成AI の業務利用に関する注意喚起(事務連絡)」令和7年2月6日 — [デジタル庁 PDF](https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/d2a5bbd2-ae8f-450c-adaa-33979181d26a/e7bfeba7/20250206_councils_social-promotion-executive_outline_01.pdf)
- 同通知は「DeepSeek社が取得した個人情報を含むデータは中華人民共和国に所在するサーバに保存され、中華人民共和国の法令が適用される」と説明し、業務利用の際は NISC とデジタル庁に助言を求めた上で判断するよう要請 — [日経xTECH](https://xtech.nikkei.com/atcl/nxt/news/24/02148/); [JAPANSecuritySummit](https://japansecuritysummit.org/2025/02/11158/)
- 広島大学 情報セキュリティ推進機構(広大CSIRT)は 2025-02-19 に「DeepSeek 等の生成AIに関する注意喚起」を掲載。個人情報保護委員会事務局とデジタル庁の注意喚起(2月3日〜6日)を引用し、中国サーバ保存・中国法適用を周知。**禁止ではなく注意喚起** — [広島大学CSIRT](https://csirt.hiroshima-u.ac.jp/2025/deepseek-%E7%AD%89%E3%81%AE%E7%94%9F%E6%88%90ai%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E6%B3%A8%E6%84%8F%E5%96%9A%E8%B5%B7/)
- 米国ではアイダホ大学などが DeepSeek アクセス制限メモ(2025年8月)を出している例あり — [University of Idaho KB](https://support.uidaho.edu/TDClient/40/Portal/KB/Article/3671/DeepSeek-Access-Restrictions-Memo-August-2025)
- 世界的に政府機関・企業「数百社」が DeepSeek への接続を遮断 — [coki](https://coki.jp/article/news/45370/)(二次情報)

**米国ホストの条件(再掲)**
- Fireworks: オープンモデルはオプトインなしにプロンプト/生成をログ・保存せず、学習にも使わない — [Fireworks Data Security](https://docs.fireworks.ai/guides/security_compliance/data_security)
- DeepInfra: ゼロ保持、SOC 2 / ISO 27001 — [morphllm](https://www.morphllm.com/comparisons/fireworks-vs-deepinfra)(二次情報)
- Together: 学習オプトインのみ、既定ゼロ保持。Groq: 学習禁止(契約)、ZDR、米国のみ — [betterclaw](https://www.betterclaw.io/blog/ai-provider-training-data-policy-2026)(二次情報)
- OpenRouter: 既定でプロンプト非保存、ZDR 設定、Enterprise で EU/US 域内ルーティング — [Meetily](https://meetily.ai/llm-privacy/openrouter); [OpenRouter Provider Logging](https://openrouter.ai/docs/guides/privacy/provider-logging)
- Hugging Face Inference Endpoints(専用)は AWS US/EU のみ — [techjacksolutions](https://techjacksolutions.com/ai-tools/hugging-face/hugging-face-inference-api/)(二次情報)

### Inferences
- 日本の大学における「中国ホストAPI利用」は法的に禁止されているわけではないが、政府の注意喚起を受けた学内通知が存在するため、**学生データ(氏名・作品・課題文)を中国本土サーバへ送る設計は、倫理審査・情報セキュリティ審査で説明困難**。本アプリの入力(レイアウト指示テキスト+参照画像)は個人情報を含みにくいが、学生が入力する自由文や画像に個人情報が混入し得る。
- 現実的な選択肢は (a) 中国系オープンウェイトモデルを米国ホスト経由で使う、(b) 自前ホスト、の2択。(a) は Fireworks / DeepInfra / Together / Groq のいずれも「学習しない・ゼロ保持」を掲げており、研究計画書に明記しやすい。
- Alibaba 国際版(シンガポール)は「中国本土外」だが Alibaba Group 傘下のため、審査上は米国ホストより説明コストが高い可能性がある(これは推測)。

### Gaps
- 埼玉工業大学を含む個別大学の「生成AI利用ガイドライン」における中国系API明示規制の有無は未調査。
- Alibaba Cloud 国際版、Z.ai、Moonshot、MiniMax の API 利用規約における「学習利用」「保持期間」「準拠法」の一次情報は未取得。
- PRC 国家情報法(2017)の条文と API 事業者への適用に関する一次情報は今回取得できず。

---

## Q5. 画像解析(参照画像から色・ムード抽出)に使えるオープンウェイトVLMとホスト価格

### Takeaway
「支配色・ムード」程度の抽出なら、小〜中規模VLMで十分。ホスト価格は Qwen3-VL-235B-A22B(DeepInfra $0.20/$0.88)、Gemma 4 31B($0.09〜/$0.34〜)、Llama 4 Scout($0.10/$0.30)、Pixtral 12B($0.15/$0.15)、GLM-4.6V-FlashX(Z.ai $0.04/$0.40)、Qwen-VL-Plus(Alibaba $0.21/$0.63)が主な候補で、いずれも1画像あたり1円未満のオーダー。

### Cited Findings
- Qwen3-VL-235B-A22B-Instruct: DeepInfra $0.20 / $0.88 — [DeepInfra Pricing](https://deepinfra.com/pricing)
- Qwen3 VL 30B A3B Instruct: OpenRouter $0.150 per 1M tokens、Qwen3-VL は最大1Mトークンコンテキスト — [aiportalx: vision models 2026](https://aiportalx.com/blog/best-multimodal-vision-models-2026-qwen2-vl-gemini-llama-4)(二次情報)
- Qwen-VL-Max $0.8 / $3.2、Qwen-VL-Plus $0.21 / $0.63(Alibaba 公式、context caching あり) — [Alibaba Cloud Model Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)
- Qwen-VL は JSON Object モード対応(非thinking)だが、画像入力時 json_schema は無効 — [Alibaba: Qwen structured output](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output)
- GLM-4.6V $0.3 / $0.9、GLM-4.6V-FlashX $0.04 / $0.4、GLM-4.6V-Flash 無料 — [Z.ai Pricing](https://docs.z.ai/guides/overview/pricing)
- DeepSeek: vision は deepseek-flash のみ対応($0.30 / $1.20 ピーク) — [DeepSeek Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- Gemma 4 31B: OpenRouter $0.09 / $0.34(最安)、16プロバイダで $0.09〜0.99 / $0.34〜1.49。Gemma 4 26B A4B(MoE): $0.042 / $0.22 — [OpenRouter Gemma 4 31B](https://openrouter.ai/google/gemma-4-31b-it); [OpenRouter Gemma 4 26B A4B](https://openrouter.ai/google/gemma-4-26b-a4b-it)
- Gemma 4 は Apache 2.0 ライセンス — [DevelopersIO](https://dev.classmethod.jp/en/articles/local-llm-guide-2026-summer/)(二次情報)
- Llama 4 Scout: $0.10 / $0.30、コンテキスト1,310,720、最大出力16,384 — [OpenRouter Llama 4 Scout](https://openrouter.ai/meta-llama/llama-4-scout); DeepInfra も同額 — [DeepInfra Pricing](https://deepinfra.com/pricing)
- Pixtral 12B: $0.15 / $0.15。Pixtral Large 2411: $2.00 / $6.00 — [pricepertoken: Pixtral 12B](https://pricepertoken.com/pricing-page/model/mistral-ai-pixtral-12b); [pricepertoken: Pixtral Large](https://pricepertoken.com/pricing-page/model/mistral-ai-pixtral-large-2411)(二次情報)
- Mistral-Small-3.2-24B(vision対応世代): DeepInfra $0.075 / $0.20 — [DeepInfra Pricing](https://deepinfra.com/pricing)

### Inferences
- 画像1枚は多くのVLMで数百〜千数百トークンに換算される(モデル依存、未検証)。$0.10〜0.20/1M の入力単価なら1画像 $0.0001〜0.0003(0.02〜0.05円)程度で、コスト上は無視できる。
- 「支配色抽出」だけなら LLM を使わずブラウザ側の Canvas でヒストグラム/k-means を取る方が確実・無料であり、VLM は「ムード・雰囲気の言語化」「レイアウト傾向の読み取り」に限定して使うのが合理的。
- 本アプリの設計として「VLM でムードを短いテキストに要約 → JSON schema 対応テキストモデルでレイアウト生成」の2段構成にすれば、Qwen の「画像入力時はスキーマ無効」制約を回避できる。

### Gaps
- Gemma 4 / Llama 4 Scout / Pixtral の「画像1枚あたりのトークン換算」および画像入力に対する別料金の有無は未確認。
- Nejumi 等での VLM の日本語画像説明品質の定量値は取得できず。

---

## Q6. セルフホスト vs 従量API(40名/コマ規模)・ブラウザ内モデル

### Takeaway
従量APIなら1コマ(40名×10リクエスト=400リクエスト)のコストは Flash 系で **$0.2〜0.8(30〜120円)、旗艦でも $3程度**。レンタルGPUは A100 80GB が $0.89〜1.59/時、H100 が $2.20〜3.49/時で、90分授業1回あたり $2〜5 + 立ち上げ・運用の手間がかかり、**このスケールでは従量APIが圧倒的に安く簡単**。Mac Studio は同時40名の32Bクラス配信については確かな数値が見つからず未検証。ブラウザ内モデル(WebLLM/Transformers.js)は ≤2B パラメータが実用上限で、複雑な JSON 生成には力不足。

### Cited Findings

**レンタルGPU価格(2026)**
- RunPod: RTX 4090 Community $0.34/時・Secure $0.59/時(別記事では $0.74/時)。A100 80GB Secure $1.59/時(PCIe $1.39、SXM $1.59)。H100 80GB PCIe $2.89/時・SXM $2.99〜3.29/時、Community $3.49/時。秒課金 — [Thunder Compute: RunPod pricing](https://www.thundercompute.com/blog/runpod-pricing-vs-thunder-compute); [Northflank: RunPod pricing](https://northflank.com/blog/runpod-gpu-pricing); [Spheron: RunPod H100 2026](https://www.spheron.network/blog/runpod-h100-pricing-2026/)(いずれも二次情報、数値は記事間で若干差あり)
- DeepInfra GPU レンタル: H100 80GB $2.20/時、A100 80GB $0.89/時、B200 180GB $3.69/時 — [DeepInfra Pricing](https://deepinfra.com/pricing)

**スループット(vLLM)**
- デュアル A100 40GB + vLLM で 32B モデル(DeepSeek/Qwen)は約1K tokens/s、50同時リクエストでも性能上限に達しない — [DatabaseMart: Dual A100 vLLM benchmark](https://www.databasemart.com/blog/vllm-gpu-benchmark-dual-a100-40gb)(ベンダー記事)
- 単一 RTX 4090 + vLLM + Qwen2.5-7B AWQ: 85.1 tok/s、TTFT 中央値1.2秒(batch 1) — [Markaicode: vLLM Qwen benchmark](https://markaicode.com/benchmarks/vllm-qwen-benchmark/)(二次情報)
- vLLM の連続バッチングは逐次処理比で 3×〜20× のスループット(ハード・モデル・同時数依存) — [Markaicode: vLLM vs Ollama](https://markaicode.com/benchmarks/cuda-inference-benchmark/)(二次情報)
- 1×A100 80GB で Qwen3-14B-AWQ が同時実行>1で深刻な性能低下(vLLM v0.9.1 の不具合報告) — [vllm issue #20469](https://github.com/vllm-project/vllm/issues/20469)
- Qwen3-30B を民生ハードで中小企業向けプライベートサーバとして運用可能かのベンチマーク論文あり — [arXiv 2512.23029](https://arxiv.org/html/2512.23029v1)

**Mac(Apple Silicon)**
- vLLM-MLX は llama.cpp 比で 21〜87% 高スループット、連続バッチングにより16同時リクエストで集約スループット 4.3× にスケール。M4 Max で Qwen3-0.6B 最大525 tok/s(小型モデルの値) — [arXiv 2601.19139: Native LLM inference on Apple Silicon](https://arxiv.org/html/2601.19139v2)
- Qwen3-32B フルサイズ(約64GB)は Mac Studio 上で動作可能 — [MacStories: Mac Studio benchmarks](https://www.macstories.net/notes/notes-on-early-mac-studio-ai-benchmarks-with-qwen3-235b-a22b-and-qwen2-5-vl-72b/)(二次情報)
- 「M4 Ultra」は存在せず、Ultra 級は M3 Ultra または M5 Ultra — [検索結果の注記](https://macfax.com/blog/at-home-mac-inference-cluster-the-complete-2026-guide)(二次情報)

**ブラウザ内モデル**
- 2026年時点で「快適な推論(Qwen3 1.7B で 20+ tok/s)」には 8GB+ VRAM または 16GB+ Apple ユニファイドメモリが必要。4GB VRAM でも低速なら可 — [vucense: WebGPU 2026](https://vucense.com/dev-corner/webgpu-browser-llm-2026/)(二次情報)
- WebGPU は WASM 比 5〜20× 高速。Qwen3 1.7B は RTX 4090 で WebGPU ~28 tok/s、WASM ~3 tok/s — [vucense](https://vucense.com/dev-corner/webgpu-browser-llm-2026/)(二次情報)
- Transformers.js + WebGPU での対話速度は ≤2B パラメータ推奨。Llama 3.2 1B / Qwen2.5 0.5B は Q4 で 1〜2GB に収まり内蔵GPUでも動作 — [Intel: In-browser LLMs guide](https://www.intel.com/content/www/us/en/developer/articles/technical/web-developers-guide-to-in-browser-llms.html); [vucense](https://vucense.com/dev-corner/webgpu-browser-llm-2026/)
- WebLLM はモデル全体を一旦 JS メモリにロードしてから GPU に送るため、メモリフットプリントが大きい。Transformers.js も CPU バッファ経由 — [arXiv 2605.20706: Llamas on the Web](https://arxiv.org/html/2605.20706v1)

### Inferences(コスト試算)
1リクエスト = 入力3,000 tokens + 出力800 tokens。1 USD = 150 JPY 仮定。

| モデル / 経路 | 入力$/M | 出力$/M | 1リクエスト | 1コマ(400req) | 15コマ |
|---|---|---|---|---|---|
| DeepSeek V4-Flash(DeepInfra, 米国) | 0.09 | 0.18 | $0.00041(0.06円) | $0.17(25円) | $2.5 |
| Qwen-Flash(Alibaba SG, 最低段階) | 0.05 | 0.40 | $0.00047(0.07円) | $0.19(28円) | $2.8 |
| Gemma 4 31B(DeepInfra turbo) | 0.09 | 0.34 | $0.00054(0.08円) | $0.22(33円) | $3.3 |
| GLM-5.3-Flash(Z.ai) | 0.15 | 0.50 | $0.00085(0.13円) | $0.34(51円) | $5.1 |
| Qwen3.5-35B-A3B(DeepInfra) | 0.14 | 1.00 | $0.00122(0.18円) | $0.49(73円) | $7.3 |
| DeepSeek Flash(本家, ピーク) | 0.30 | 1.20 | $0.00186(0.28円) | $0.74(112円) | $11 |
| MiniMax-M3 | 0.30 | 1.20 | $0.00186(0.28円) | $0.74(112円) | $11 |
| Qwen-Plus(Alibaba SG, 最低段階) | 0.40 | 1.20 | $0.00216(0.32円) | $0.86(130円) | $13 |
| Kimi K2.6(本家) | 0.95 | 4.00 | $0.00605(0.91円) | $2.42(363円) | $36 |
| DeepSeek V4 Pro(本家, ピーク) | 1.32 | 3.96 | $0.00713(1.07円) | $2.85(428円) | $43 |
| GLM-5.3(Z.ai) | 1.40 | 4.40 | $0.00772(1.16円) | $3.09(463円) | $46 |
| Qwen3-Max(Alibaba SG, 最低段階) | 1.20 | 6.00 | $0.0084(1.26円) | $3.36(504円) | $50 |

- 画像解析を毎リクエストに付ける場合でも(Qwen3-VL-235B $0.20/$0.88 で +$0.0013/req)、1コマ +$0.5 程度。
- **セルフホスト比較**: A100 80GB($0.89〜1.59/時)を授業前後含め2時間確保すると $1.8〜3.2/コマ。これは旗艦モデルの従量課金と同水準で、Flash 系従量課金の10倍以上。加えて vLLM のセットアップ・モデルDL(32B で ~64GB)・起動時間(数分〜10分超)・障害対応の人的コストがかかる。**40名/コマ、年間数十コマの規模では従量APIが合理的**。
- セルフホストが有利になるのは (a) 学内ポリシーで外部送信そのものが不可、(b) 学生の作品データを一切外に出したくない、(c) 常時稼働の研究用途で月数千万トークン以上、のいずれか。
- スループット面: 400リクエスト×800出力 = 32万 output tokens。デュアルA100+32Bモデル(~1K tok/s 集約)なら約5〜6分の総計算量で、40名が一斉に押しても数十秒待ち程度と推定(同時50リクエストで上限に達しないという報告に基づく推測)。単一 RTX 4090 では 7B 級までが現実的。
- Mac Studio: vLLM-MLX で連続バッチングは可能だが、32B クラスで同時40名の実測は見つからず。小型MoE(Qwen3.5-35B-A3B 等、アクティブ3B)なら現実味があるが未検証。授業中に1台の Mac に依存する運用リスク(停止・ネットワーク)も考慮要。
- ブラウザ内モデル: ≤2B の制約下で「日本語指示→厳密な JSON レイアウト出力」を安定させるのは困難と推測。学生PCの多くが 8GB VRAM / 16GB ユニファイドメモリ要件を満たすとは限らず、初回ロード(1〜2GB)の待ち時間も授業運用の障害。**「オフライン・ゼロコスト」のデモ用途以外には非推奨**(推測)。

### Gaps
- Mac Studio(M3/M5 Ultra)で 32B クラスを同時40リクエスト配信した実測値は見つからなかった。
- Lambda / vast.ai の当日価格は未取得(RunPod と DeepInfra のみ)。
- 小型モデル(1〜4B)での「JSON schema 準拠率」ベンチマークは取得できず、ブラウザ内モデルの不適性は推測。

---

## 総合的な推奨候補(2〜3案)と根拠(推論)

1. **DeepSeek V4-Flash を DeepInfra または Fireworks 経由(米国ホスト)で利用** — 1コマ約25〜60円、ゼロ保持・学習なし、JSON 出力/tool calling 対応(本家仕様)、Nejumi 0.8169。vision は本家では flash のみ対応だが、米国ホストでの vision 提供有無は要確認。
2. **Qwen3.5-35B-A3B / Qwen3.6-27B(オープンウェイト)を DeepInfra/Together 経由** — Apache 2.0、1コマ約70〜100円、Together の structured outputs(JSON schema 強制)が使える。将来セルフホストへ移行しても同じモデルを使える。
3. **GLM-5.3-Flash(Z.ai 本家)** — 1コマ約50円、Nejumi 0.8260 と Flash 級で最高水準。ただし Z.ai は中国企業ホスト(所在地・保持条件未確認)のため、大学利用では米国ホスト版(あれば)を優先すべき。
- 画像解析は Gemma 4 31B(Apache 2.0、$0.09/$0.34)または Qwen3-VL-235B(DeepInfra $0.20/$0.88)を別呼び出しで併用し、テキスト要約→JSON 生成の2段構成にする。
- Alibaba 公式(シンガポール)は JSON Schema 未対応、Kimi K3/Qwen3-Max/DeepSeek V4 Pro は本用途にはコスト過大。
