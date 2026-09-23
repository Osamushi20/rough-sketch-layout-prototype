# LLM駆動「コードベース視覚生成」のアーキテクチャと先行研究(2026年9月時点)

対象: Tinkerable Sketch(Vite + React + TS、GitHub Pages静的配信、12×16等のCSS Gridにブロックを配置)にLLMを組み込み、(a) グリッド制約付きレイアウト案JSON、(b) 表現パラメータ(タイポ階層・パレット・余白・装飾)JSONを生成させる構成の設計メモ。ラスター画像生成は対象外。
凡例: 「(要検証)」= 一次資料で確認できなかった主張。日付は資料の公開/更新日。

---

## KQ1. 先行研究・先行プロダクト:表現形式(JSON / HTML-CSS / SVG)と報告品質

### Takeaway
学術側の主流は「LLMに**コード風テキスト(HTML/CSS or JSON)**でレイアウトを出力させる」方式で、2023年の LayoutGPT/LayoutPrompter(CSS/HTML表現、in-context学習、複数候補+ランカー)が原型。2025〜2026年は(1) CoT/RAGによる訓練不要手法(LayoutCoT)、(2) RLで空間推論を強化した小型モデル(LaySPA/PosterCopilot)、(3) レイヤーJSON仕様を出力する多層デザイン生成(CreatiPoster)へ発展。プロダクト側(Canva/Adobe Express/Figma First Draft)は「テンプレートやコンポーネントライブラリからの組み立て」が主で、自由生成というより**制約付きカタログからの選択+パラメータ充填**という設計思想が共通する(生成UIのjson-render/A2UIも同じ)。Tinkerable Sketchの「グリッド+ブロック+表現パラメータをJSONで」という方針はこの潮流に正確に一致する。

### Cited Findings

**学術(LLM×レイアウト)**
- LayoutGPT(NeurIPS 2023): レイアウトをCSSライク構文で in-context 提示し、LLMのプログラミング知識を空間計画に転用。2D画像から3D室内シーンまで生成。数量・空間関係の言語概念をレイアウトに変換する性能で優位と報告 — [arXiv 2305.15393](https://arxiv.org/abs/2305.15393)、[LayoutGPT project](https://layoutgpt.github.io/)
- LayoutPrompter(NeurIPS 2023): 出力は `<div class="[type]" style="left:Lpx; top:Tpx; width:Wpx; height:Hpx"></div>` のHTML+inline CSS。制約は「要素タイプ/サイズ列(c1w1h1|c2w2h2…)」「要素間の相対関係(X bottom Y)」「部分レイアウト(refinement/completion)を同じHTMLで」表現。動的exemplar選択(ハンガリアン法による二部マッチング、saliency IoU、CLIP埋め込み)。**ランカー q(y)=0.2·Alignment+0.2·Overlap+0.6·(1−mIoU)** で複数出力から選択。GPT-3 text-davinci-003、exemplar N=10、**1入力あたりL=10出力、temperature 0.7**。RICO/PubLayNet/PosterLayout/WebUIで学習ベース手法(LayoutFormer++等)と同等以上、低データ環境で大きく優位 — [arXiv 2311.06495 (HTML版)](https://arxiv.org/html/2311.06495)、[NeurIPS PDF](https://proceedings.neurips.cc/paper_files/paper/2023/file/88a129e44f25a571ae8b838057c46855-Paper-Conference.pdf)
- LayoutNUWA(2023): 数値条件を量子化して**HTMLコードにマスクを置き、LLaMA/CodeLLaMAに穴埋め**させる「Code Instruct Tuning」。content-agnosticレイアウトデータセットで当時SOTA — [arXiv 2309.09506](https://arxiv.org/pdf/2309.09506v2)
- PosterLLaVA(2024→IEEE TMM採録): MLLM(LLaVA)を視覚指示チューニングし、**JSON形式の構造化テキスト**で視覚的・テキスト的制約下のレイアウトを生成。編集可能なSVGポスターを出力 — [arXiv 2406.02884](https://arxiv.org/abs/2406.02884)、[GitHub](https://github.com/posterllava/PosterLLaVA)
- Design2Code(2024): 484件の実Webページのスクリーンショット→HTML/CSSベンチマーク。GPT-4o/GPT-4V/Gemini/Claudeを評価。主な失敗要因は「入力ページの視覚要素の想起」と「**正しいレイアウト設計の生成**」 — [arXiv 2403.03163](https://arxiv.org/abs/2403.03163)、[GitHub](https://github.com/NoviScl/Design2Code)
- LayoutCoT(2025-04, Meituan): 訓練不要。Layout-aware RAG(LTSim=Layout Transportation類似度でexemplar検索)+3段階CoT(粗配置→細部→審美調整)で訓練不要手法としてSOTA — [arXiv 2504.10829](https://arxiv.org/abs/2504.10829)
- LLMs as Layout Designers / LaySPA(2025-09-23公開): LLMの空間推論の弱さを指摘し、RL(幾何妥当性・構造忠実度・視覚品質のハイブリッド報酬)で強化。解釈可能な推論トレース+構造化レイアウトを出力 — [arXiv 2509.16891](https://arxiv.org/abs/2509.16891)
- From Pixels to Policies(LaySPA続報、2026-02): レイアウトを「キャンバス幾何・要素属性・要素間関係を明示的に符号化した**構造化テキスト空間環境**上の方策学習」に再定式化。「より大きなプロプライエタリLLMを上回り、専用SOTA生成器に匹敵、少ないアノテーションと低レイテンシ」と主張 — [arXiv 2602.13912](https://arxiv.org/abs/2602.13912)
- PosterCopilot(2025-12-03): LMMを Perturbed SFT → 視覚現実整合RL → 審美フィードバックRL の3段階で訓練。レイヤー単位の制御可能な反復編集を実現 — [arXiv 2512.04082](https://arxiv.org/abs/2512.04082)
- CreatiPoster(2025-06、改訂2026-07-22): RGBA LMMが**各レイヤー(テキスト/アセット)のレイアウト・階層・内容・スタイルを記述したJSON仕様+背景プロンプト**を生成し、背景合成モデルが背景を作る。10万件の著作権フリー多層デザインコーパスを公開 — [arXiv 2506.10890](https://arxiv.org/abs/2506.10890)
- Image-aware Layout Generation with User Constraints for Poster Design(2026-04-08投稿): LLMではなく深層生成モデル。ユーザ制約として「含める/除外する要素クラス」「**部分レイアウト(partial-constraint loss)**」を扱い、ランダムマスクで多様性を確保 — [arXiv 2605.13856](https://arxiv.org/abs/2605.13856)
- その他2025-26の関連: SciPostLayout(学術ポスターのレイアウトデータセット) — [arXiv 2407.19787](https://arxiv.org/pdf/2407.19787); OmniLayout(LLMでcoarse-to-fine文書レイアウト、2025-10) — [arXiv 2510.26213](https://arxiv.org/html/2510.26213v1); Uni-Layout(人間フィードバックを統合した生成+評価、2025-08) — [arXiv 2508.02374](https://arxiv.org/pdf/2508.02374); PSDesigner(2026-03) — [arXiv 2603.25738](https://arxiv.org/pdf/2603.25738); iPoster(グラフ強化拡散、2026-03) — [arXiv 2603.29469](https://arxiv.org/html/2603.29469); 広告バナーの2段階CoT(VLM、2025-12) — [arXiv 2512.12596](https://arxiv.org/html/2512.12596)

**プロダクト**
- Canva Magic Design: 入力内容(画像・テキスト・アイデア)を分析し、**Canvaのテンプレートライブラリから**テーマに合うレイアウトを推薦・適応。全要素編集可能。無料プランでも利用可 — [Canva Help](https://www.canva.com/help/use-magic-design/)、[Canva Magic Design](https://www.canva.com/magic-design/)。2026-03にはAI生成の静止画像を編集可能なレイヤーに分解する「Magic Layers」を発表 — [BusinessWire 2026-03-11](https://www.businesswire.com/news/home/20260311951174/en/Canva-Introduces-Magic-Layers-Turning-Static-AI-Outputs-Into-Editable-Designs)
- Adobe Express「Generate template(Text to Template)」: テキスト説明から編集可能テンプレートを生成、「See variations」で類似案を表示 — [Adobe HelpX](https://helpx.adobe.com/express/web/create-with-templates/text-to-template.html)
- Figma First Draft: テンプレート(Basic App/App Wireframe/Basic Site/Site Wireframe)を選びプロンプト入力。**内部デザインシステム(「Simple Design System」372コンポーネント)からの組み立て**。生成後にテーマ・余白・角丸をクイック調整 — [Figma Help](https://help.figma.com/hc/en-us/articles/23870272542231-Use-AI-tools-in-Figma-Design)、[designerup.co](https://designerup.co/blog/figma-ai-first-draft-feature-rerelease/)、[LogRocket 2026](https://blog.logrocket.com/ux-design/figma-ai-2026-quick-overview/)
- Google Stitch(2025-05 I/O発表、2026-03に無限キャンバスへ刷新、Gemini 3搭載): 自然言語から最大5画面を一括生成、HTML/CSS・Tailwind・Flutter等にエクスポート、Figmaへ送信。2026-07時点で有料枠なし(1日400 design credits + 15 redesign credits)。※クレジット数は二次情報 — [Google Developers Blog](https://developers.googleblog.com/stitch-a-new-way-to-design-uis/)、[Google Blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/)、[tech-insider 2026-03](https://tech-insider.org/google-stitch-ai-design-tool-march-2026-update/)
- 生成UI(Generative UI)の表現形式の分岐:
  - Vercel json-render(Apache-2.0): 開発者がZodスキーマ付き**コンポーネントカタログ**を定義し、LLMは `root` + `elements{type, props, children}` のフラットJSONだけを出力。`SpecStreamCompiler` でチャンク単位の漸進レンダリング — [GitHub vercel-labs/json-render](https://github.com/vercel-labs/json-render)
  - Google A2UI(2025-12-15公開、Apache-2.0): エージェントが**宣言的JSON**を送り、クライアントが信頼済みコンポーネントカタログで描画。実行コードを渡さないので安全 — [Google Developers Blog](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/)、[GitHub](https://github.com/google/A2UI)
  - Thesys C1 / OpenUI Lang: OpenAI互換エンドポイントがUIを返す。OpenUI LangはコンポーネントJSONより**約52%小さい出力**を謳う(自社ベンチ) — [Thesys blog](https://www.thesys.dev/blogs/generative-ui-architecture)、[GitHub thesysdev/openui](https://github.com/thesysdev/openui)、[QuickLeap比較 2026](https://quickleap.io/blog/generative-ui-platforms-comparison-2026)
  - Vercel v0: React/Tailwind+shadcn/uiコードを直接生成(コード生成型) — [awesome-generative-ui](https://github.com/narrowin/awesome-generative-ui)

### Inferences
- 「LLMは自由なHTML/コード生成よりも、**閉じたカタログ+数値パラメータのJSON**を出させた方が安全・検証容易・トークン効率が良い」という設計原則は、学術(PosterLLaVA/CreatiPosterのJSON)と産業(json-render/A2UI/Figma First Draft)の双方で収斂している。Tinkerable Sketchは既にブロック型が固定(heading/body/image/shape)なので、この方式に最適。
- Design2Codeの失敗分析(レイアウト設計が弱点)とLaySPA論文の問題設定(LLMの空間推論の弱さ)は、**幾何はLLMに任せきりにせず、ローカル検証・修復が必須**であることを示す(KQ2へ)。
- LayoutPrompterの「L=10候補+ランカー」パターンは、Tinkerable Sketchの「複数レイアウト案」機能とそのまま対応。ランカーの指標(alignment/overlap/mIoU)はブラウザ側で数十行で計算できる。
- 学術系の性能指標(RICO/PubLayNet上のFID・Alignment・Overlap)はCSS Grid上のセル単位レイアウトには直接当てはまらない。セル座標化により離散問題になり、LLMには扱いやすくなる一方、既存論文の数値は参考程度。

### Gaps
- Canva/Adobe/Figmaの内部表現(JSON/DSL)とモデル構成は非公開。「テンプレートからの組み立て」以上の技術情報は一次資料になし。
- Google Stitchのクレジット数・課金は二次ブログ情報のみ(要検証)。
- LaySPA/PosterCopilot/CreatiPosterの定量結果の詳細(表)はアブストラクト段階のみ確認。
- CSS Grid(セル単位離散グリッド)を明示的に扱ったLLMレイアウト論文は今回見つからなかった。

---

## KQ2. プロンプト/スキーマ/検証パイプラインの設計

### Takeaway
3社(Anthropic/OpenAI/Gemini)の構造化出力はいずれも**制約デコーディングでスキーマ準拠を保証**するが、`minimum/maximum` 等の数値制約はAnthropicとOpenAI strictで**非サポート**なので、グリッド境界・重なり・最小サイズは必ずクライアント側で検証・修復する。設計上は「LLM=意味的判断(どのブロックをどこに・どの階層で)、ローカル=幾何の保証(クランプ・衝突解消・スナップ)」に分業し、LayoutPrompter式に複数候補を生成→ローカル指標でランキング/重複除去する。

### Cited Findings
- Anthropic Structured Outputs(GA、betaヘッダ不要): `output_config.format = {type:"json_schema", schema}`。**サポート**: 基本型、`enum`(プリミティブのみ)、`const`、`anyOf/allOf`(制限あり)、`$ref/$defs`(外部不可)、`required`、`additionalProperties:false`必須、配列`minItems`は0/1のみ。**非サポート**: 再帰スキーマ、`minimum/maximum/multipleOf`、`minLength/maxLength`。SDKは非対応制約を除去して説明文に転記し、ローカル検証する。スキーマの文法は初回コンパイル後**24時間キャッシュ**(構造変更で無効化、名前/説明の変更では無効化されない)。ストリーミング対応 — [Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- OpenAI Structured Outputs(strict:true): `uniqueItems, minItems, maxItems, minLength, maxLength, pattern, minimum, maximum` 等を拒否。全objectで`additionalProperties:false`、全propertyを`required`に — [OpenAI docs](https://developers.openai.com/api/docs/guides/structured-outputs)、[mastra issue #23321](https://github.com/mastra-ai/mastra/issues/23321)、[OpenAI announcement](https://openai.com/index/introducing-structured-outputs-in-the-api/)
- Gemini `responseSchema`: OpenAPI 3.0サブセットから出発し、`anyOf, $ref` 等のJSON Schemaキーワードに対応、2025-11更新で`additionalProperties`にも対応 — [Gemini API docs](https://ai.google.dev/gemini-api/docs/structured-output)、[Google blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/)、[python-genai issue #1815](https://github.com/googleapis/python-genai/issues/1815)
- LayoutPrompterの制約表現・exemplar選択・ランカー・候補数(L=10, T=0.7)はKQ1参照 — [arXiv 2311.06495](https://arxiv.org/html/2311.06495)
- LayoutNUWAは「固定部分をHTMLに書き、未定部分をマスク」で補完させる(=ロック済みブロック表現の先例) — [arXiv 2309.09506](https://arxiv.org/pdf/2309.09506v2)
- 多様性: 温度を上げると分布が平坦化して多様性は増すが品質が落ちる。多サンプル推論では候補プールの多様性が「正解が含まれる確率」を上げる。構造化出力・厳格な仕様準拠では T=0 が既定として妥当 — [Optimizing Temperature for Multi-Sample Inference (arXiv 2502.05234)](https://arxiv.org/html/2502.05234v2)、[Conformative Decoding (arXiv 2507.20956)](https://arxiv.org/pdf/2507.20956)、[SurePrompts 2026](https://sureprompts.com/blog/llm-temperature-sampling-complete-guide-2026)
- Vercel AI SDK `streamObject`: Zodスキーマを受け取り、`partialObjectStream` で部分オブジェクトを逐次配信。OpenAIはJSONモード、Anthropicはtool-use経由で抽出(SDK側の実装) — [aihero.dev](https://www.aihero.dev/streaming-objects-with-vercel-ai-sdk)、[vercel/ai issue #2036](https://github.com/vercel/ai/issues/2036)
- json-renderはカタログ外コンポーネントを構造的に禁止し、Zodでpropsを検証 — [GitHub](https://github.com/vercel-labs/json-render)
- WebLLM(0.2.83、2026-04): WebGPU上でQwen3/Llama3/Phi3/Gemma/Mistralを実行、OpenAI互換API、**カスタムJSON Schemaによる構造化出力**、seed指定、ストリーミング対応 — [GitHub mlc-ai/web-llm](https://github.com/mlc-ai/web-llm)、[DEV 2026-04](https://dev.to/creeta/qwen3-in-the-browser-zero-keys-webllm-0283-hands-on-3ai2)

### Inferences(設計提案 — 出典なし、上記知見からの導出)
**スキーマ設計(レイアウト)**
```jsonc
// 入力(プロンプトに埋め込む状態)
{
  "grid": {"cols":12,"rows":16,"paper":"A4","orientation":"portrait"},
  "blocks":[
    {"id":"h1","type":"heading","text":"…","locked":true, "x":0,"y":0,"w":12,"h":3},
    {"id":"img1","type":"image","aspect":1.5,"locked":false,"minW":4,"minH":4},
    {"id":"b1","type":"body","chars":220,"locked":false}
  ],
  "intent":{"style":"modern","mood":"calm","palette_hint":["#1a1a2e","#f5f5f5"]},
  "n_variants":3
}
// 出力(json_schema)
{
  "variants":[
    {"name":"…","rationale":"…(1文)",
     "placements":[{"id":"img1","x":0,"y":3,"w":7,"h":8}, …]}   // lockedブロックは省略可 or 同値必須
  ]
}
```
- 座標は**整数セル**で `enum` 化できる(x: 0..11 を integer enum、w: 1..12 を enum)。`minimum/maximum` が使えない代わりに `enum` で境界を表現すれば、制約デコーディングで**範囲外座標を生成段階で排除**できる(Anthropic/OpenAIともenumは対応)。ただしx+w≤cols のような関係制約はスキーマでは表現不能→ローカル修復。
- lockedブロックは (a) 出力スキーマから除外して「変更禁止」を明示、または (b) LayoutNUWA式に「既定値入り」で提示し、返答でも同値を返させて検証。(a)がトークン節約・違反ゼロで有利。
- `rationale` を短く要求すると、CoT的な効果で配置品質が上がりやすい(LayoutCoTの知見)一方、コスト増。1文に限定。

**検証・修復(クライアント側、決定的)**
1. スキーマ検証(zod/ajv)→失敗時は同一プロンプトで1回だけ再試行(スキーマ準拠が保証されていれば通常不要)。
2. クランプ: `x=clamp(x,0,cols-w)`, `w=clamp(w,minW,cols)`, 同様にy/h。
3. ロック違反: locked ブロックはサーバ応答を無視して元値で上書き。
4. 重なり解消: 固定順(locked→heading→image→body→shape)で「上→下、左→右」に走査し、衝突時はyを下方へ押し出す(簡易パッキング)。行不足なら h を縮小、最小サイズ未満なら候補を破棄。
5. 品質スコア: LayoutPrompterの q(y)=Alignment+Overlap+(1−mIoU) を「セル単位」で置換(左端揃え本数、余白バランス、空セル率、ロックブロックとの整合)。閾値以下の候補は破棄し、上位N件を提示。重複候補は placements のハッシュで除去。
6. 全滅時のフォールバック: 乱数シード付き決定的ジェネレータ(KQ5)で埋める。

**候補数・温度**
- 1コールでN案(`variants` 配列)は、プロンプト(入力状態+few-shot)を1回だけ払うため**入力トークンが約1/N**。ただし同一コンテキスト内の案は互いに似やすい。実験では「1コールN案 + 案ごとに『前案と異なる構成にせよ』の明示」+ T≈0.7〜1.0、多様性不足なら「2コール×2案」に切替、が現実的。研究の batch vs incremental 比較では、この2方式自体が独立変数になり得る。
- 再現性のため、seed対応API(OpenAI `seed`はベストエフォート、WebLLMはseed対応)を使うより、**応答をログに保存して再生**する方が確実(KQ6)。

**Few-shot**
- LayoutPrompter同様、exemplar(良い配置例)を2〜5件、同じJSON形で提示。授業用なら教員が作った「お手本レイアウト」をexemplarにし、入力の類似度(ブロック構成の一致度)で動的に選ぶ簡易RAGが可能(ローカル計算のみ)。

**表現パラメータ(スタイル)スキーマ**
- 全て `enum` か 有限のトークン集合で: `typeScale: enum["1.125","1.2","1.25","1.333","1.5"]`、`headingWeight: enum[400..900]`、`palette: {bg, fg, accent}` は hex 文字列(`pattern` は非対応なので長さチェックはローカル)、`spacing: enum["tight","normal","loose"]`、`decoration: enum["none","rule","frame","dots"]`。enum化はスキーマ違反の排除と、CSSカスタムプロパティへの1対1マッピングを両立させる。

### Gaps
- 「1コールN案 vs Nコール」の多様性・品質を定量比較した一次研究は見つからず(上記は推論)。
- Anthropic/OpenAIの enum に整数値を大量に(0..15など)入れた場合の文法コンパイル時間・上限は未確認。
- 各社の構造化出力での seed 再現性の保証は未確認(OpenAIはベストエフォートと記憶しているが要検証)。

---

## KQ3. 静的サイト(GitHub Pages)から鍵を漏らさずに有料APIを呼ぶ最安・安全なバックエンド

### Takeaway
**Cloudflare Workers Free(1日10万リクエスト、CPU 10ms/呼び出し、$0)**が最有力: LLM呼び出しはI/O待ちでCPUを消費しないためCPU 10msでも十分で、KV(読み10万/日・書き1,000/日)と Rate Limiting binding、無料の AI Gateway(キャッシュ・レート制限・分析・**支出上限**)が同一アカウントで揃う。次点は Deno Deploy Free(100万req/月、CPU 10時間/月)、Vercel Hobby(100万呼び出し/月、最大300秒、ただし非商用条項)、Supabase Edge Functions(50万呼び出し/月、無料DBと同居できるがプロジェクトが7日無活動で一時停止)。Netlify Freeは300クレジット/月の硬い上限で、枯渇時にサイト全体が停止するため不向き。

### Cited Findings
- Cloudflare Workers Free: **10万リクエスト/日、CPU 10ms/呼び出し**。KV: 読み10万/日、書き1,000/日、削除1,000/日、1GB。Durable Objects: 10万req/日、SQLite 5GB。D1: 読み500万行/日、書き10万行/日。Paid: $5/月から、1,000万req/月+3,000万CPU-ms/月込み(2026-08-28更新) — [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- Free planの外部サブリクエストは50/呼び出し(2026-02-11 changelog) — [Cloudflare changelog](https://developers.cloudflare.com/changelog/2026-02-11-subrequests-limit)
- Rate Limiting binding: `env.LIMITER.limit({key})`、`period`は**10秒または60秒**のみ、同一マシン上のローカルキャッシュを非同期更新するため低遅延だが「寛容・結果整合・正確な会計には使わない設計」。Wrangler 4.36.0以降 — [Cloudflare Rate Limiting docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- KVをレート制限に使う場合の注意: 読み10万/日はアカウント全体の上限、結果整合なので同時要求が同じカウントを読む可能性(ソフト制限には十分) — [DEV: KV rate limiter](https://dev.to/nirmeet_trivedi_07bf0d38f/your-cloudflare-workers-kv-rate-limiter-is-probably-attacking-itself-2nb1)、[flaviocopes](https://flaviocopes.com/rate-limiting-cloudflare-kv/)
- Cloudflare AI Gateway: **分析・キャッシュ・レート制限は全プラン無料**。ログ保存はWorkers Freeで全ゲートウェイ合計10万件、Paidで1,000万件/ゲートウェイ。Unified Billing(Cloudflare経由でプロバイダに支払う)は購入クレジットに**5%手数料**、日/週/月の支出上限で自動停止(2026-05-19更新) — [AI Gateway Pricing](https://developers.cloudflare.com/ai-gateway/reference/pricing/)、[AI Gateway rate limiting](https://developers.cloudflare.com/ai-gateway/features/rate-limiting/)、[TrueFoundry解説](https://www.truefoundry.com/blog/cloudflare-ai-gateway-pricing)。キャッシュTTLは1分〜1年、レート制限は1分〜1時間窓で固定/スライディング — [shattered.io 2026](https://shattered.io/cloudflare-ai-gateway-setup-2026/)
- Workers AI(Cloudflare自前モデル): 無料枠 **10,000 Neurons/日**、超過は$0.011/1,000 Neurons(Paid) — [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- 静的サイトからWorkers経由でLLMを呼ぶ実装例(バックエンド不要) — [DEV 2026](https://dev.to/yimtheppariyapol/cloudflare-workers-ai-add-a-free-llm-to-a-static-site-no-backend-needed-37ab)、複数LLM対応プロキシOSS — [GitHub llm-proxy-on-cloudflare-workers](https://github.com/blue-pen5805/llm-proxy-on-cloudflare-workers)
- Vercel Functions(Fluid compute、2026-08-24更新): Hobbyは**最大300秒**、メモリ2GB/1vCPU、同時実行3万、ペイロード4.5MB。Edge runtimeは25秒以内に応答開始、最大300秒ストリーミング。Hobbyの関数は無料(制限内) — [Vercel Functions Limits](https://vercel.com/docs/functions/limitations)。Hobbyは100万呼び出し/月(二次情報) — [deploywise 2026](https://deploywise.dev/blog/vercel-free-tier-limits-2026)。※検索結果内で「10秒」とする二次記事があるが公式は300秒。Hobbyの非商用条項に注意 — [justinmckelvey](https://justinmckelvey.com/blog/is-vercel-free)
- Netlify Free: **300クレジット/月の硬い上限**、自動リチャージ不可、枯渇時は**チーム内の全サイトが停止**。関数タイムアウト10秒、コンピュート10クレジット/GB時 — [Netlify Docs: credits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/)、[netli.fyi 2026](https://netli.fyi/blog/netlify-free-plan-limits-2026)
- Deno Deploy Free: **100万リクエスト/月、Active CPU 10時間/月、Egress 20GiB、KV 1GiB(読み100万/書き50万ユニット/月)**、Pro $20/月。メモリ上限512MB — [Deno Deploy Pricing](https://deno.com/deploy/pricing)、[Deno docs pricing_and_limits](https://docs.deno.com/deploy/pricing_and_limits/)。※二次情報では「50ms CPU/req、100GB帯域」とも記載され公式と食い違い — [srvrlss.io](https://www.srvrlss.io/provider/deno-deploy/)
- Supabase Edge Functions: Free **50万呼び出し/月**(二次情報)、メモリ256MB、CPU 2秒/リクエスト、ウォールクロック Free 150秒/Paid 400秒、関数数 Free 100 — [Supabase functions limits](https://supabase.com/docs/guides/functions/limits)、[UI Bakery 2026](https://uibakery.io/blog/supabase-pricing)
- Supabase Free プロジェクトは**7日間の低活動で一時停止**(1週間前に警告メール、ダッシュボードから復元、1年で復元不能) — [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- Firebase Firestore 無料枠: 1GiB保存、**読み5万/日、書き2万/日、削除2万/日**、送信10GiB/月、1プロジェクト1無料DB — [Firestore quotas](https://firebase.google.com/docs/firestore/quotas)

### Inferences
- **推奨構成(最安・単純)**: GitHub Pages(静的) → Cloudflare Worker(`/api/generate`) → AI Gateway(キャッシュ+レート制限+支出上限+ログ) → LLM API。鍵はWorkerのSecretに置く。CORSは `Origin` を GitHub Pages ドメイン(+localhost)に限定。Vercel/Netlifyに移す必要なし。
- **共有クラスルーム・アクセスコード**: Workerで `X-Class-Code` ヘッダをSecret(複数コードをカンマ区切りで保持し授業ごとにローテーション)と照合。コードは静的サイトに埋め込まず、学生が授業で入力→`localStorage`保存。漏洩時はSecret更新のみで無効化できる。
- **ユーザ単位レート制限**: 匿名の `client_id`(初回起動時にUUIDを生成し localStorage)をキーに Rate Limiting binding(例: 10req/60秒)。1日上限はKV(`count:{client_id}:{date}`、TTL 24h、書き込み1,000/日制限に注意→**1回の生成で1書き込み**なら受講生40人×20回=800/日でギリギリ。超える場合はDurable Objects(10万req/日無料)か D1(書き10万行/日)にカウンタを置く方が安全)。
- **日次支出上限**: 二重にする。(1) AI Gateway/プロバイダ側の予算上限(ハードストップ)、(2) Worker側でKV/D1に日次トークン合計を記録し、閾値超過で `503 {reason:"budget"}` を返してUIで案内。
- **キャッシュ**: リクエスト本文(グリッド状態+意図+バージョン)を正規化してSHA-256→KV/AI Gatewayキャッシュキー。「もう一度生成」は `nonce` をキーに含めてバイパス。授業では同じ課題を複数学生が同じ初期状態から始めるためヒット率が期待できる。
- **キャンセル/デバウンス**: ブラウザ側 `AbortController` で前リクエストを中断(Workerはクライアント切断を検知できるとは限らないので、上流トークンは消費される→デバウンスは**明示ボタン**が原則、自動生成なら800ms以上のデバウンス+進行中は新規発火禁止)。
- CPU 10ms制限は、Worker内でスキーマ検証や修復を**行わない**前提(検証はブラウザで)。Workerは認証・レート制限・転送・ログのみに徹する。ストリーミング応答の転送はCPUをほぼ使わない。
- Supabaseは「ログDB+Edge Function」を1サービスに集約できる利点があるが、授業のない週に一時停止するリスクがあるため、週1回のcron ping(Cloudflare Cron Triggersは無料)で活性維持するか、DBのみSupabase/Firestoreで運用するのが現実的。

### Gaps
- Cloudflare Rate Limiting binding が Free plan で利用可能かは公式ページに明記なし(要検証。二次情報では利用可とされる)。
- Vercel Hobby の月間呼び出し上限(100万)・Supabase Edge Functions の月間呼び出し(50万)は二次情報。
- AWS Lambda無料枠(100万req/月・40万GB秒は恒久無料と記憶)は今回未確認(要検証)。GitHub Pagesから直接呼ぶにはAPI Gateway/Function URL設定が必要で、上記より手間が大きい。

---

## KQ4. コスト制御、ストリーミング vs 非ストリーミング、レイテンシ、呼び出しタイミング

### Takeaway
小型モデルのTTFTは概ね0.35〜0.6秒(Gemini Flash系/Claude Haiku 4.5)、出力速度100〜200 tok/s。レイアウトJSON(3案×10ブロック≒600〜1,000トークン)なら**総時間3〜8秒**が目安で、非ストリーミングでも許容範囲。ストリーミングは「案が1つずつ現れる」演出と体感短縮に有効だが、部分JSONの扱いが増えるので、初期は非ストリーミング+スケルトンUIで開始し、後で `partialObjectStream` 相当に移行するのが低リスク。呼び出しは**明示ボタン**を基本にし、編集後の自動生成は研究条件(incremental)としてのみ有効化する。

### Cited Findings
- TTFT実測(2026-03公開、2026-09-22更新、トロントから3プロンプト長×3回、ストリーミング計測): Gemini 2.5 Flash ≈450ms/204.5 tok/s、Claude Haiku 4.5 ≈597ms、Claude Sonnet 4 ≈900ms/53 tok/s、GPT-4.1 ≈1,100ms/125 tok/s、GPT-4.1 Mini ≈2,400ms/94.5 tok/s。最新モデル(GPT-5.5、Gemini 3.5 Flash、Claude Fable 5 等)の詳細比較は簡略 — [kunalganglani.com](https://www.kunalganglani.com/blog/llm-api-latency-benchmarks-2026)
- Gemini 2.5 Flash-Lite が TTFT 0.35秒・213.5 tok/s でリーダーボード首位級(Artificial Analysis 引用) — [BenchLM.ai 2026-09](https://benchlm.ai/llm-speed)、[DEV 2026](https://dev.to/kunal_d6a8fea2309e1571ee7/5-llm-apis-tested-for-latency-real-data-2026-3e4o)
- Anthropic 構造化出力: 初回リクエストは文法コンパイルで追加遅延、24時間はキャッシュ — [Claude Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- Vercel AI SDK `streamObject`/`partialObjectStream` で部分オブジェクトを漸進描画、json-render の `SpecStreamCompiler` も同様 — [aihero.dev](https://www.aihero.dev/streaming-objects-with-vercel-ai-sdk)、[json-render](https://github.com/vercel-labs/json-render)
- Vercel Edge runtimeは25秒以内に応答開始が必要(ストリーミング前提の設計)、Workers Free の CPU 10ms は I/O 待ちを含まない — [Vercel](https://vercel.com/docs/functions/limitations)、[Cloudflare](https://developers.cloudflare.com/workers/platform/pricing/)
- AI Gateway のキャッシュ(1分〜1年)とレート制限、支出上限で自動停止 — [AI Gateway pricing](https://developers.cloudflare.com/ai-gateway/reference/pricing/)

### Inferences
- **コスト制御の階層**: (1) プロンプト設計: 状態JSONを最小化(ブロックのテキスト本文は文字数と先頭20文字だけ送る、画像はサムネイルではなく抽出済み色5色+アスペクト比のみ)、few-shotはプロンプトキャッシュ可能な固定接頭辞に置く。(2) 出力上限: `max_tokens` を案数×ブロック数から算出して固定。(3) 回数: ボタン+クールダウン(例: 5秒)+日次上限(例: 30回/人)。(4) 会計: Workerで usage(input/output tokens)をログし、日次集計で予算超過を遮断。(5) 参照画像解析はブラウザで完結させ(KQ5)、Vision入力を送らない。
- **ストリーミングの判断**: レイアウト案は「案単位で完成して初めて意味がある」ため、要素単位ストリーミングの価値は低い。`variants` 配列を案ごとに区切って描画する「配列要素単位の漸進表示」が費用対効果が高い。表現パラメータ(パレット等)は1オブジェクトなので非ストリーミングで十分。
- **呼び出しタイミングと費用**: 編集ごとの自動生成は、1学生1セッションで数十〜百回に膨らみやすく、ボタン方式の5〜10倍のコストになり得る(推定)。研究で incremental 条件を設ける場合は、「編集停止後 N 秒のデバウンス+差分が閾値以上のときのみ」+ 進行中リクエストの `AbortController` 中断(上流コストは発生する点をログに残す)。
- **同一リクエストのキャッシュ**: 正規化した入力ハッシュでのキャッシュは、授業(同一課題・同一初期状態)で特に有効。ただし研究上は「同じ入力に同じ出力が返る」ことが条件間比較を歪めないか設計で確認(キャッシュヒットもイベントとして記録)。

### Gaps
- Fable/Opus 5系・Gemini 3系など2026年9月時点の最新小型モデルの一次ベンチ数値は未確認(価格・モデル比較は別担当)。
- 「編集ごとの自動生成」の実コスト係数は実測が必要(推定のみ)。

---

## KQ5. ブラウザ側代替(APIコストゼロ):決定的生成、WebLLM/Transformers.js、色抽出

### Takeaway
「決定的ジェネレータ(seed付きPRNG+制約充足ヒューリスティク)」は必ず実装すべき基盤で、LLMの失敗時フォールバック・研究のベースライン条件・オフライン授業の3役を担う。WebLLMはJSON Schema制約付き生成とseedに対応し、Qwen3等の小型モデルをWebGPUで動かせるが、大学PCの性能・初回ダウンロード量が障害となる。参照画像の色抽出は node-vibrant(意味付きスウォッチ)または color-thief v3(OKLCH量子化)で完全にブラウザ内で完結する。

### Cited Findings
- WebLLM 0.2.83(2026-04): Qwen3/Llama 3/Phi 3/Gemma/Mistral をブラウザWebGPUで実行、OpenAI互換API、ストリーミング、JSON Schemaによる構造化生成(WASM側で実装)、seed、logit制御 — [GitHub mlc-ai/web-llm](https://github.com/mlc-ai/web-llm)、[DEV 2026-04 hands-on](https://dev.to/creeta/qwen3-in-the-browser-zero-keys-webllm-0283-hands-on-3ai2)
- node-vibrant: Android の Palette アルゴリズム由来、Vibrant/Muted/Dark/Light 等の**意味付きスウォッチ**を返す。週約41万DL、GitHub★2,402(比較記事時点)。画像読み込みの扱いに注意、バンドルはやや大きい — [GitHub Vibrant-Colors/node-vibrant](https://github.com/Vibrant-Colors/node-vibrant)、[npm-compare](https://npm-compare.com/colorthief,node-vibrant)
- Color Thief: 軽量、支配色+固定サイズパレット。v3 は非同期統一API、**OKLCH知覚量子化**、アクセシビリティメタデータ付き Color オブジェクト。ブラウザ/Node両対応、TypeScript対応 — [GitHub lokesh/color-thief](https://github.com/lokesh/color-thief)、[npm colorthief](https://www.npmjs.com/package/colorthief)
- 訓練不要のLLM手法(LayoutPrompter/LayoutCoT)でも「exemplar検索+複数候補+ランキング」というローカル処理が品質の鍵 — [arXiv 2311.06495](https://arxiv.org/html/2311.06495)、[arXiv 2504.10829](https://arxiv.org/abs/2504.10829)
- Cloudflare Workers AI の無料枠(10,000 Neurons/日)は「ブラウザ外だが無料」の中間選択肢 — [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)

### Inferences
- **決定的ジェネレータの設計**: seed→mulberry32等のPRNG→「レイアウト文法」(例: ヘッダ帯/左右2段/画像ヒーロー/対角/グリッド分割)から1つ選択→lockedブロックを除く各ブロックを文法のスロットに割当→KQ2の修復・スコアリングを通す。同じ入力+seedで同じ出力になるため、研究の統制条件・再現性に最適。LLM条件でも「LLMが意味的パラメータ(文法名・比率・階層)だけを選び、座標はこのジェネレータが決める」というハイブリッドは、LLM出力を数十トークンに圧縮でき、幾何違反もゼロになる。
- WebLLM は (a) 学内PCのGPU/WebGPU可否、(b) 数百MB〜数GBの初回DL、(c) 小型モデルの空間推論の弱さ(LaySPA論文の指摘)から、授業本番より「オフライン検証・比較条件」向き。表現パラメータ(パレット/雰囲気語→enum)のような**分類寄りタスク**なら小型モデルでも実用の可能性。
- 参照画像→「支配色5色(hex)+明度/彩度統計+コントラスト比」をブラウザで算出し、LLMには**数値要約だけ**を渡す。画像そのものを送らないので Vision 課金・個人情報リスク・遅延を回避できる。node-vibrant の Vibrant/Muted 分類は「mood(calm/energetic)」推定のヒューリスティク(彩度・明度から)に転用可。

### Gaps
- Transformers.js での小型LLM構造化出力の2026年時点の対応状況は未調査。
- WebLLM の Qwen3 系での JSON 出力品質・速度の一次ベンチは未確認。
- vibrant.js 単体(node-vibrant のブラウザビルド)のバンドルサイズの一次数値は未確認。

---

## KQ6. 研究用ロギング:イベントスキーマと保存先(個人データ回避)

### Takeaway
Supabase(Postgres+匿名サインイン+RLS)か Firestore(読み5万/日・書き2万/日無料)のどちらでも授業規模(数十人×数百イベント/回)は無料枠に収まる。Supabaseは7日無活動で一時停止する点、Firestoreは日次クォータがある点がそれぞれ注意点。個人データを避けるため、識別子は端末生成UUID(+授業回コード)のみ、ブロックの本文テキストは長さ/ハッシュに置換して保存する。Cloudflare AI Gatewayのログ(Free:10万件)は運用監視用で、研究データは自前DBに記録する。

### Cited Findings
- Supabase 匿名サインイン: 資格情報なしで一時ユーザを作成、`authenticated` ロールで一意のuser IDを持ち、JWTの `is_anonymous` クレームでRLSポリシー上区別可能。悪用防止にCAPTCHA等の追加策が推奨 — [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)、[Supabase blog](https://supabase.com/blog/anonymous-sign-ins)、[security note](https://supabase.com/docs/guides/troubleshooting/security-of-anonymous-sign-ins-iOrGCL)
- Supabase Free: DB 500MB、MAU 5万、Egress 5GB、ストレージ1GB、アクティブプロジェクト2(二次情報)、**7日低活動で一時停止**(公式) — [UI Bakery 2026](https://uibakery.io/blog/supabase-pricing)、[Supabase pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- Firestore 無料: 1GiB、読み5万/日、書き2万/日、削除2万/日、送信10GiB/月 — [Firestore quotas](https://firebase.google.com/docs/firestore/quotas)
- Cloudflare D1 Free: 書き10万行/日、読み500万行/日、5GB;AI Gateway ログ Free 10万件(全ゲートウェイ合計) — [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)、[AI Gateway pricing](https://developers.cloudflare.com/ai-gateway/reference/pricing/)
- LayoutPrompter/LaySPAが用いる自動品質指標(alignment、overlap、mIoU、幾何妥当性)はローカル計算可能で、受容率と並ぶ従属変数になる — [arXiv 2311.06495](https://arxiv.org/html/2311.06495)、[arXiv 2509.16891](https://arxiv.org/abs/2509.16891)

### Inferences(イベントスキーマ案 — 出典なし)
```jsonc
{
  "event_id": "uuid",            // クライアント生成
  "ts": "2026-10-01T03:12:45Z",  // クライアント時刻 + サーバ受信時刻を別列
  "session_id": "uuid",          // ページロード毎
  "participant_id": "uuid",      // 端末localStorage生成。氏名/学籍番号は保存しない。
  "class_code": "2026A-w05",     // 授業回。条件割付はここに紐付け
  "condition": "batch|incremental|deterministic",
  "app_version": "git sha",
  "type": "gen_request|gen_response|gen_error|gen_cancel|variant_view|variant_accept|variant_reject|manual_edit|param_change|export",
  "payload": {
    // gen_request: 正規化入力のハッシュ + グリッド寸法 + ブロック構成(type, locked, x,y,w,h, text_len, text_hash) + intent + n_variants + prompt_version + model
    // gen_response: request_id, latency_ms, ttft_ms, usage{in,out}, cache_hit, variants(修復前/後), local_scores[], repair_log[]
    // variant_accept: request_id, variant_index, time_to_accept_ms, edits_after_accept(後で結合)
    // manual_edit: block_id, before{x,y,w,h}, after{...}, since_last_gen_ms
  }
}
```
- **ストレージ戦略**: `events` テーブル(追記のみ、RLS: 匿名ユーザは自分の participant_id 行を INSERT のみ、SELECT は不可)+ `requests`(プロンプト全文と応答全文はサイズが大きいので別テーブルか Supabase Storage/JSONL にまとめ、events からは request_id で参照)。Worker 側からも `usage`/`latency` をサービスロールで書くと、クライアント改ざんに強い二重記録になる。
- 個人データ回避: 本文テキストは `text_len` と `text_hash`(SHA-256先頭8文字)に置換、参照画像は色統計のみ、IPはWorkerで記録しない(Cloudflareの標準ログは別途無効化/短期保持)。同意フォームは授業内で紙/LMSで取り、`participant_id` と紐付けない。
- 分析で必要な派生量(受容率、採択までの時間、採択後の編集量、局所品質スコアと採択の相関、batch vs incremental の総トークン/総待ち時間)はすべて上記イベントから再構成可能。
- 「再生」のため、`gen_response` に修復前の生JSONを必ず保存(構造化出力の失敗・修復頻度自体が研究データ)。

### Gaps
- 日本の大学における匿名研究ログの倫理審査要件(所属機関の規程)は本調査の範囲外。
- Supabase Free の「2アクティブプロジェクト」上限は二次情報。
- Firestore 無料枠を「授業当日の書き込みバースト(数十人×数百イベント)」で超えないかはイベント粒度に依存(1日2万書き込み=40人×500イベントで上限到達)。バッチ書き込み(複数イベントを1ドキュメントに束ねる)で回避可能だが要設計。
