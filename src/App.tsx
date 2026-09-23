import { ChangeEvent, DragEvent, PointerEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart, Box, BringToFront, ChevronLeft, Circle, Copy, Download, Grid3X3, Image as ImageIcon, ImagePlus, Layers3, RectangleHorizontal, Redo2, SendToBack, Trash2, Type, Undo2, Upload } from "lucide-react";

type BlockType = "heading" | "body" | "image" | "logo" | "button" | "shape";
type TextAlign = "left" | "center" | "right";
type VerticalAlign = "top" | "center" | "bottom";
type HeadingLevel = 1 | 2 | 3;
type Block = { id: string; type: BlockType; x: number; y: number; w: number; h: number; text?: string; image?: string; level?: HeadingLevel; align?: TextAlign; valign?: VerticalAlign };
type MoodImage = { id: string; src: string; label: string };
type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
type GridSettings = { paper: string; columns: number; rows: number; top: number; right: number; bottom: number; left: number; gutter: number };
type DragState = { kind: "move"; id: string; originX: number; originY: number; gridX: number; gridY: number; recorded: boolean } | { kind: "resize"; id: string; handle: ResizeHandle; gridX: number; gridY: number; origin: Block; recorded: boolean };
type OpenMenu = "blocks" | "board" | "grid" | null;

const DEFAULT_GRID: GridSettings = { paper: "A4 縦", columns: 12, rows: 16, top: 9, right: 8, bottom: 9, left: 8, gutter: 2.1 };
const PAPER_RATIOS: Record<string, number> = { "A4 縦": 210 / 297, "A3 縦": 297 / 420, "B4 縦": 257 / 364, "正方形": 1 };
const GRID_LIMITS = { columns: [2, 24], rows: [2, 30], margin: [0, 25], gutter: [0, 8] } as const;
const ROW_GUTTER_RATIO = .55;
const assetPath = (filename: string) => `${import.meta.env.BASE_URL}${filename}`;
const STOCK_IMAGES: MoodImage[] = [
  { id: "workshop", src: assetPath("photo-workshop.png"), label: "つくる手" },
  { id: "materials", src: assetPath("photo-materials.png"), label: "素材と道具" },
  { id: "posters", src: assetPath("photo-posters.png"), label: "紙のポスター" }
];
const TOOL_OPTIONS: { type: BlockType; label: string; icon: typeof Type; size: [number, number] }[] = [
  { type: "heading", label: "見出し", icon: Type, size: [7, 2] }, { type: "body", label: "本文", icon: Layers3, size: [5, 3] },
  { type: "image", label: "画像", icon: ImageIcon, size: [5, 5] }, { type: "logo", label: "ロゴ", icon: Circle, size: [2, 2] },
  { type: "button", label: "ボタン", icon: RectangleHorizontal, size: [4, 1] }, { type: "shape", label: "図形", icon: Box, size: [3, 2] }
];
const STYLE_OPTIONS = [{ value: "swiss", label: "スイス" }, { value: "editorial", label: "エディトリアル" }, { value: "playful", label: "遊び心" }, { value: "experimental", label: "実験的" }];
const MOOD_OPTIONS = ["静か", "にぎやか", "端正", "やわらかい", "大胆", "上質"];
const COLOR_OPTIONS = ["暖色", "寒色", "落ち着いた", "鮮やか", "モノクロ"];
const COLOR_PALETTES: Record<string, string[][]> = {
  "暖色": [["#fff7ed", "#2c211d", "#d85732", "#f2b35a"], ["#fbf0ea", "#321e25", "#bc4e5a", "#eb9d73"]],
  "寒色": [["#edf5f7", "#15242d", "#2573a9", "#75bdc9"], ["#eef1f8", "#1e2536", "#596bc5", "#9ab5d9"]],
  "落ち着いた": [["#f6f1e7", "#2a2b21", "#687c4f", "#b28b57"], ["#f3eee4", "#3a2920", "#a5663f", "#a5a068"]],
  "鮮やか": [["#fff8e9", "#192231", "#ed3f63", "#fdc844"], ["#f5f4ff", "#211e39", "#7553db", "#42c7b7"]],
  "モノクロ": [["#fafafa", "#171717", "#555555", "#bdbdbd"], ["#202020", "#f5f5f5", "#ffffff", "#777777"]]
};

function makeBlock(type: BlockType, x: number, y: number, image?: string, level: HeadingLevel = 1): Block {
  const tool = TOOL_OPTIONS.find((item) => item.type === type)!;
  const text = type === "heading" ? "夏のものづくり教室" : type === "body" ? "手を動かし、考える時間をひらく。\nはじめての人も歓迎です。" : type === "button" ? "申し込む" : type === "logo" ? "TS" : undefined;
  const headingSize: Record<HeadingLevel, [number, number]> = { 1: [7, 2], 2: [6, 2], 3: [5, 1] };
  const [w, h] = type === "heading" ? headingSize[level] : tool.size;
  return { id: crypto.randomUUID(), type, x, y, w, h, text, image, level: type === "heading" ? level : undefined, align: "left", valign: "center" };
}

function clampBlock(block: Block, grid: GridSettings): Block {
  const w = Math.max(1, Math.min(grid.columns, block.w));
  const h = Math.max(1, Math.min(grid.rows, block.h));
  return { ...block, w, h, x: Math.max(0, Math.min(grid.columns - w, block.x)), y: Math.max(0, Math.min(grid.rows - h, block.y)) };
}

function clampNumber(value: number, min: number, max: number, fallback: number) { return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback; }
// 列・行のガター合計が紙面の半分を超えるとセルが潰れるため、分割数に応じて上限を下げる。
function maxGutter(columns: number, rows: number) { return Math.min(GRID_LIMITS.gutter[1], 50 / Math.max(1, columns - 1), 50 / (ROW_GUTTER_RATIO * Math.max(1, rows - 1))); }
function sanitizeGrid(grid: GridSettings): GridSettings {
  const columns = Math.round(clampNumber(grid.columns, ...GRID_LIMITS.columns, DEFAULT_GRID.columns));
  const rows = Math.round(clampNumber(grid.rows, ...GRID_LIMITS.rows, DEFAULT_GRID.rows));
  const margin = (value: number, fallback: number) => clampNumber(value, ...GRID_LIMITS.margin, fallback);
  return { paper: grid.paper in PAPER_RATIOS ? grid.paper : DEFAULT_GRID.paper, columns, rows, top: margin(grid.top, DEFAULT_GRID.top), right: margin(grid.right, DEFAULT_GRID.right), bottom: margin(grid.bottom, DEFAULT_GRID.bottom), left: margin(grid.left, DEFAULT_GRID.left), gutter: Number(clampNumber(grid.gutter, 0, maxGutter(columns, rows), DEFAULT_GRID.gutter).toFixed(2)) };
}
function gridVars(grid: GridSettings) { return { "--columns": grid.columns, "--rows": grid.rows, "--margin-top": `${grid.top}%`, "--margin-right": `${grid.right}%`, "--margin-bottom": `${grid.bottom}%`, "--margin-left": `${grid.left}%`, "--gutter": `${grid.gutter}%`, "--row-gutter-ratio": ROW_GUTTER_RATIO, "--paper-ratio": PAPER_RATIOS[grid.paper] ?? PAPER_RATIOS[DEFAULT_GRID.paper] } as React.CSSProperties; }

function blockStyle(block: Block): React.CSSProperties { return { gridColumn: `${block.x + 1} / span ${block.w}`, gridRow: `${block.y + 1} / span ${block.h}` }; }

export function App() {
  const [grid, setGrid] = useState<GridSettings>(DEFAULT_GRID);
  const [blocks, setBlocksRaw] = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moodImages, setMoodImages] = useState<MoodImage[]>(STOCK_IMAGES);
  const [selectedMood, setSelectedMood] = useState(STOCK_IMAGES[0].id);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [styleChoice, setStyleChoice] = useState("");
  const [adjective, setAdjective] = useState("");
  const [colorMood, setColorMood] = useState("");
  const [zoom, setZoom] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const blocksRef = useRef<Block[]>([]);
  const clipboardRef = useRef<Block | null>(null);
  const historyRef = useRef<{ past: Block[][]; future: Block[][] }>({ past: [], future: [] });
  const [historyVersion, setHistoryVersion] = useState(0);
  const selected = blocks.find((block) => block.id === selectedId) ?? null;
  const canUndo = historyVersion >= 0 && historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;
  const palette = colorMood ? COLOR_PALETTES[colorMood][0] : ["#ffffff", "#1f1f1f", "#202020", "#a8a8a8"];
  const artStyle = useMemo(() => ({ "--paper": palette[0], "--ink": palette[1], "--accent": palette[2], "--accent-2": palette[3] }) as React.CSSProperties, [palette]);
  const gridStyle = useMemo(() => gridVars(grid), [grid]);

  useEffect(() => { blocksRef.current = blocks; }, [blocks]);
  useEffect(() => { setBlocksRaw((items) => items.map((item) => clampBlock(item, grid))); }, [grid]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setZoom((current) => Math.min(1.7, Math.max(.55, Number((current - event.deltaY * .002).toFixed(2)))));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, []);

  function commitBlocks(updater: Block[] | ((current: Block[]) => Block[])) {
    const current = blocksRef.current;
    const next = typeof updater === "function" ? updater(current) : updater;
    if (next === current) return;
    historyRef.current.past.push(current);
    historyRef.current.future = [];
    blocksRef.current = next;
    setBlocksRaw(next);
    setHistoryVersion((value) => value + 1);
  }
  function recordCurrentState() {
    historyRef.current.past.push(blocksRef.current);
    historyRef.current.future = [];
    setHistoryVersion((value) => value + 1);
  }
  function undo() {
    const previous = historyRef.current.past.pop();
    if (!previous) return;
    historyRef.current.future.push(blocksRef.current);
    blocksRef.current = previous;
    setBlocksRaw(previous);
    setSelectedId(null); setEditingId(null); setHistoryVersion((value) => value + 1);
  }
  function redo() {
    const next = historyRef.current.future.pop();
    if (!next) return;
    historyRef.current.past.push(blocksRef.current);
    blocksRef.current = next;
    setBlocksRaw(next);
    setSelectedId(null); setEditingId(null); setHistoryVersion((value) => value + 1);
  }
  function deleteSelected() {
    if (!selectedId) return;
    commitBlocks((items) => items.filter((item) => item.id !== selectedId));
    setSelectedId(null); setEditingId(null);
  }
  function copySelected() { if (selected) clipboardRef.current = { ...selected }; }
  function pasteCopied() {
    const source = clipboardRef.current;
    if (!source) return;
    const pasted = clampBlock({ ...source, id: crypto.randomUUID(), x: source.x + 1, y: source.y + 1 }, grid);
    commitBlocks((items) => [...items, pasted]); setSelectedId(pasted.id);
  }
  function moveLayer(direction: "front" | "back") {
    if (!selectedId) return;
    commitBlocks((items) => { const target = items.find((item) => item.id === selectedId); if (!target) return items; const rest = items.filter((item) => item.id !== selectedId); return direction === "front" ? [...rest, target] : [target, ...rest]; });
  }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select") || target.isContentEditable) return;
      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); return; }
      if (command && event.key.toLowerCase() === "c") { event.preventDefault(); copySelected(); return; }
      if (command && event.key.toLowerCase() === "v") { event.preventDefault(); pasteCopied(); return; }
      if (command && event.key.toLowerCase() === "d") { event.preventDefault(); copySelected(); pasteCopied(); return; }
      if (event.key === "Backspace" || event.key === "Delete") { event.preventDefault(); deleteSelected(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function updateGrid(patch: Partial<GridSettings>) { setGrid((current) => sanitizeGrid({ ...current, ...patch })); }
  function addBlock(type: BlockType, x?: number, y?: number, level: HeadingLevel = 1, grab?: { x: number; y: number }) {
    const prototype = makeBlock(type, 0, 0, undefined, level);
    const image = type === "image" ? moodImages.find((item) => item.id === selectedMood)?.src : undefined;
    const targetX = x == null ? Math.floor((grid.columns - prototype.w) / 2) : x - Math.round((grab?.x ?? 0) * Math.max(0, prototype.w - 1));
    const targetY = y == null ? Math.floor((grid.rows - prototype.h) / 2) : y - Math.round((grab?.y ?? 0) * Math.max(0, prototype.h - 1));
    const next = clampBlock(makeBlock(type, targetX, targetY, image, level), grid);
    commitBlocks((items) => [...items, next]); setSelectedId(next.id);
  }
  function gridPoint(clientX: number, clientY: number) {
    const poster = gridRef.current;
    if (!poster) return null;
    const rect = poster.getBoundingClientRect();
    const computed = window.getComputedStyle(poster);
    const scale = rect.width / poster.offsetWidth;
    const left = Number.parseFloat(computed.paddingLeft) * scale;
    const right = Number.parseFloat(computed.paddingRight) * scale;
    const top = Number.parseFloat(computed.paddingTop) * scale;
    const bottom = Number.parseFloat(computed.paddingBottom) * scale;
    const [rowGap, columnGap] = computed.gap.split(" ").map((gap) => Number.parseFloat(gap) * scale);
    const cellWidth = (rect.width - left - right - columnGap * (grid.columns - 1)) / grid.columns;
    const cellHeight = (rect.height - top - bottom - rowGap * (grid.rows - 1)) / grid.rows;
    const x = Math.round((clientX - rect.left - left - cellWidth / 2) / (cellWidth + columnGap));
    const y = Math.round((clientY - rect.top - top - cellHeight / 2) / (cellHeight + rowGap));
    return { x: Math.max(0, Math.min(grid.columns - 1, x)), y: Math.max(0, Math.min(grid.rows - 1, y)) };
  }
  function startDrag(event: PointerEvent<HTMLDivElement>, block: Block) { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); const point = gridPoint(event.clientX, event.clientY) ?? { x: block.x, y: block.y }; dragRef.current = { kind: "move", id: block.id, originX: block.x, originY: block.y, gridX: point.x, gridY: point.y, recorded: false }; setSelectedId(block.id); }
  function startResize(event: PointerEvent<HTMLButtonElement>, block: Block, handle: ResizeHandle) { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); const point = gridPoint(event.clientX, event.clientY) ?? { x: block.x + block.w - 1, y: block.y + block.h - 1 }; dragRef.current = { kind: "resize", id: block.id, handle, gridX: point.x, gridY: point.y, origin: block, recorded: false }; setSelectedId(block.id); }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current; const point = drag && gridPoint(event.clientX, event.clientY); if (!drag || !point) return;
    const dx = point.x - drag.gridX; const dy = point.y - drag.gridY;
    if (dx === 0 && dy === 0) return;
    if (!drag.recorded) { recordCurrentState(); drag.recorded = true; }
    setBlocksRaw((items) => items.map((block) => {
      if (block.id !== drag.id) return block;
      if (drag.kind === "move") return clampBlock({ ...block, x: drag.originX + dx, y: drag.originY + dy }, grid);
      const left = drag.handle.includes("w") ? Math.min(drag.origin.x + drag.origin.w - 1, drag.origin.x + dx) : drag.origin.x;
      const right = drag.handle.includes("e") ? Math.max(drag.origin.x + 1, drag.origin.x + drag.origin.w + dx) : drag.origin.x + drag.origin.w;
      const top = drag.handle.includes("n") ? Math.min(drag.origin.y + drag.origin.h - 1, drag.origin.y + dy) : drag.origin.y;
      const bottom = drag.handle.includes("s") ? Math.max(drag.origin.y + 1, drag.origin.y + drag.origin.h + dy) : drag.origin.y + drag.origin.h;
      return clampBlock({ ...drag.origin, x: left, y: top, w: right - left, h: bottom - top }, grid);
    }));
  }
  function updateSelected(patch: Partial<Block>) { if (selectedId) commitBlocks((items) => items.map((item) => item.id === selectedId ? clampBlock({ ...item, ...patch }, grid) : item)); }
  function onImageUpload(event: ChangeEvent<HTMLInputElement>) { const added = Array.from(event.target.files ?? []).map((file) => ({ id: crypto.randomUUID(), src: URL.createObjectURL(file), label: file.name.replace(/\.[^.]+$/, "") })); if (added.length) { setMoodImages((items) => [...items, ...added]); setSelectedMood(added[0].id); } }
  function dropBlock(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/x-tinkerable-block");
    const point = gridPoint(event.clientX, event.clientY);
    if (!point || !raw) return;
    const payload = JSON.parse(raw) as { type: BlockType; level?: HeadingLevel; grabX?: number; grabY?: number };
    if (TOOL_OPTIONS.some((item) => item.type === payload.type)) addBlock(payload.type, point.x, point.y, payload.level, { x: payload.grabX ?? 0, y: payload.grabY ?? 0 });
  }
  function setDragPayload(event: DragEvent<HTMLButtonElement>, type: BlockType, level?: HeadingLevel) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.dataTransfer.setData("application/x-tinkerable-block", JSON.stringify({ type, level, grabX: (event.clientX - rect.left) / rect.width, grabY: (event.clientY - rect.top) / rect.height }));
    event.dataTransfer.effectAllowed = "copy";
  }

  return <main className="app-shell" style={artStyle} onPointerDownCapture={(event) => { const target = event.target as HTMLElement; if (!target.closest(".rough-block, .floating-inspector")) { setSelectedId(null); setEditingId(null); } }}>
    <header className="app-header"><div className="brand"><span className="brand-mark">TS</span><span>Tinkerable Sketch</span></div><div className="header-actions"><button className="header-icon" onClick={undo} disabled={!canUndo} title="戻る" aria-label="戻る"><Undo2 size={17} /></button><button className="header-icon" onClick={redo} disabled={!canRedo} title="進む" aria-label="進む"><Redo2 size={17} /></button><button className="png-button"><Download size={17} />PNG</button></div></header>
    <section className="workbench">
      <section className="rough-workspace">
        <nav className="floating-rail" aria-label="編集ツール">
          <button className={openMenu === "blocks" ? "active" : ""} onClick={() => setOpenMenu((menu) => menu === "blocks" ? null : "blocks")}><Box size={23} /><span>ブロック</span></button>
          <button className={openMenu === "board" ? "active" : ""} onClick={() => setOpenMenu((menu) => menu === "board" ? null : "board")}><ImageIcon size={23} /><span>イメージ<br />ボード</span></button>
          <button className={openMenu === "grid" ? "active" : ""} onClick={() => setOpenMenu((menu) => menu === "grid" ? null : "grid")}><Grid3X3 size={23} /><span>グリッド</span></button>
        </nav>
        {openMenu === "blocks" && <section className="block-drawer"><button className="drawer-close" onClick={() => setOpenMenu(null)} aria-label="ブロックメニュー"><ChevronLeft size={16} /></button>{([1, 2, 3] as HeadingLevel[]).map((level) => <button key={level} className={`drawer-block heading level-${level}`} draggable onDragStart={(event) => setDragPayload(event, "heading", level)} onClick={() => addBlock("heading", undefined, undefined, level)}><Type size={16} /><span>H{level}　見出し{level}</span></button>)}<button className="drawer-block body" draggable onDragStart={(event) => setDragPayload(event, "body")} onClick={() => addBlock("body")}><Layers3 size={16} /><span>本文</span></button><button className="drawer-block image" draggable onDragStart={(event) => setDragPayload(event, "image")} onClick={() => addBlock("image")}><ImageIcon size={19} /><span>画像</span></button><button className="drawer-block shape" draggable onDragStart={(event) => setDragPayload(event, "shape")} onClick={() => addBlock("shape")}><Box size={19} /><span>図形</span></button></section>}
        {openMenu === "board" && <aside className="overlay-panel board-panel"><button className="drawer-close" onClick={() => setOpenMenu(null)} aria-label="閉じる"><ChevronLeft size={16} /></button><div className="panel-scroll"><h2>イメージボード</h2><div className="mood-grid">{moodImages.map((image) => <button key={image.id} className={`mood-image ${selectedMood === image.id ? "selected" : ""}`} onClick={() => setSelectedMood(image.id)}><img src={image.src} alt={image.label} /></button>)}<label className="mood-upload"><Upload size={18} /><input type="file" accept="image/*" multiple onChange={onImageUpload} /></label></div></div></aside>}
        {openMenu === "grid" && <aside className="overlay-panel grid-panel"><button className="drawer-close" onClick={() => setOpenMenu(null)} aria-label="閉じる"><ChevronLeft size={16} /></button><div className="panel-scroll"><GridControls grid={grid} onChange={updateGrid} /></div></aside>}
        <div className="rough-stage" ref={stageRef}><div className="zoom-frame" style={{ transform: `scale(${zoom})` }}><div className="rough-poster" style={gridStyle}><div className="rough-poster-grid poster-grid" ref={gridRef} onDragOver={(event) => event.preventDefault()} onDrop={dropBlock} onPointerMove={moveDrag} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>{Array.from({ length: grid.columns * grid.rows }, (_, index) => { const column = index % grid.columns; const row = Math.floor(index / grid.columns); return <div key={index} className="grid-cell" data-column={column} data-row={row} style={{ gridColumn: column + 1, gridRow: row + 1 }} />; })}{blocks.map((block) => <RoughBlock key={block.id} block={block} selected={block.id === selectedId} editing={block.id === editingId} onPointerDown={(event) => startDrag(event, block)} onResize={(event, handle) => startResize(event, block, handle)} onEditStart={() => { setSelectedId(block.id); setEditingId(block.id); }} onEditEnd={() => setEditingId(null)} onTextChange={(text) => updateSelected({ text })} />)}{selected && editingId !== selected.id && <FloatingInspector block={selected} grid={grid} moodImages={moodImages} onChange={updateSelected} onCopy={copySelected} onBringFront={() => moveLayer("front")} onSendBack={() => moveLayer("back")} onDelete={deleteSelected} />}</div></div></div></div>
      </section>
      <section className="preview-workspace"><div className="preview-stage"><PreviewPoster blocks={blocks} palette={palette} grid={grid} styleChoice={styleChoice} adjective={adjective} /></div><div className="preview-controls"><label><select value={styleChoice} onChange={(event) => setStyleChoice(event.target.value)}><option value="">表現</option>{STYLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label><select value={adjective} onChange={(event) => setAdjective(event.target.value)}><option value="">雰囲気</option>{MOOD_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label><label><select value={colorMood} onChange={(event) => setColorMood(event.target.value)}><option value="">色合い</option>{COLOR_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label></div></section>
    </section>
  </main>;
}

// 入力途中の空欄や範囲外の値は下書きとして保持し、範囲内の値だけを即時反映する。確定時は範囲内へ丸めて反映する。
function NumberField({ label, value, min, max, step = 1, onCommit }: { label: string; value: number; min: number; max: number; step?: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  return <label><span>{label}</span><input type="number" min={min} max={Number(max.toFixed(2))} step={step} value={draft} onChange={(event) => { setDraft(event.target.value); const next = Number(event.target.value); if (event.target.value !== "" && Number.isFinite(next) && next >= min && next <= max) onCommit(next); }} onBlur={() => { const next = Number(draft); if (draft !== "" && Number.isFinite(next)) onCommit(Math.min(max, Math.max(min, next))); setDraft(String(value)); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /></label>;
}

function GridControls({ grid, onChange }: { grid: GridSettings; onChange: (patch: Partial<GridSettings>) => void }) {
  const field = (key: "top" | "right" | "bottom" | "left" | "columns" | "rows" | "gutter", label: string, min: number, max: number, step = 1) => <NumberField key={key} label={label} value={grid[key]} min={min} max={max} step={step} onCommit={(value) => onChange({ [key]: value })} />;
  const [marginMin, marginMax] = GRID_LIMITS.margin;
  return <div className="grid-controls"><label className="paper-field"><span>紙面の大きさ</span><select value={grid.paper} onChange={(event) => onChange({ paper: event.target.value })}>{Object.keys(PAPER_RATIOS).map((paper) => <option key={paper}>{paper}</option>)}</select></label><p>4辺の余白（%）</p><div className="grid-number-pair">{field("top", "上", marginMin, marginMax)}{field("bottom", "下", marginMin, marginMax)}{field("left", "左", marginMin, marginMax)}{field("right", "右", marginMin, marginMax)}</div><p>分割</p><div className="grid-number-pair">{field("columns", "横", ...GRID_LIMITS.columns)}{field("rows", "縦", ...GRID_LIMITS.rows)}</div>{field("gutter", "グリッド間の余白（%）", 0, maxGutter(grid.columns, grid.rows), .1)}</div>;
}

function RoughBlock({ block, selected, editing, onPointerDown, onResize, onEditStart, onEditEnd, onTextChange }: { block: Block; selected: boolean; editing: boolean; onPointerDown: (event: PointerEvent<HTMLDivElement>) => void; onResize: (event: PointerEvent<HTMLButtonElement>, handle: ResizeHandle) => void; onEditStart: () => void; onEditEnd: () => void; onTextChange: (text: string) => void }) {
  const tool = TOOL_OPTIONS.find((item) => item.type === block.type)!; const Icon = tool.icon;
  const isText = block.type === "heading" || block.type === "body" || block.type === "button" || block.type === "logo";
  const contentStyle = { justifyContent: block.align === "center" ? "center" : block.align === "right" ? "flex-end" : "flex-start", alignItems: block.valign === "top" ? "flex-start" : block.valign === "bottom" ? "flex-end" : "center", textAlign: block.align ?? "left" } as React.CSSProperties;
  return <div className={`rough-block ${block.type} level-${block.level ?? 0} ${selected ? "selected" : ""} ${editing ? "editing" : ""}`} style={blockStyle(block)} onPointerDown={(event) => { if (!editing) onPointerDown(event); }} onDoubleClick={(event) => { if (!isText) return; event.stopPropagation(); onEditStart(); }}><div className="rough-block-top"><span><Icon size={12} />{block.type === "heading" ? `H${block.level}` : tool.label}</span></div><div className="rough-block-content" style={contentStyle}>{block.type === "image" ? <ImageIcon size={25} /> : block.type === "shape" ? <span className="shape-symbol" /> : editing ? <textarea autoFocus value={block.text ?? ""} onChange={(event) => onTextChange(event.target.value)} onBlur={onEditEnd} onPointerDown={(event) => event.stopPropagation()} /> : <span>{block.text}</span>}</div>{selected && !editing && (["n", "ne", "e", "se", "s", "sw", "w", "nw"] as ResizeHandle[]).map((handle) => <button key={handle} className={`resize-handle ${handle}`} onPointerDown={(event) => onResize(event, handle)} aria-label={`サイズを変更 ${handle}`} />)}</div>;
}

function FloatingInspector({ block, grid, moodImages, onChange, onCopy, onBringFront, onSendBack, onDelete }: { block: Block; grid: GridSettings; moodImages: MoodImage[]; onChange: (patch: Partial<Block>) => void; onCopy: () => void; onBringFront: () => void; onSendBack: () => void; onDelete: () => void }) {
  const [imagesOpen, setImagesOpen] = useState(false);
  const left = `${Math.min(78, ((block.x + block.w) / grid.columns) * 100)}%`; const top = `${Math.max(2, (block.y / grid.rows) * 100 - 2)}%`;
  const alignments: { value: TextAlign; label: string; Icon: typeof AlignLeft }[] = [{ value: "left", label: "左揃え", Icon: AlignLeft }, { value: "center", label: "中央揃え", Icon: AlignCenter }, { value: "right", label: "右揃え", Icon: AlignRight }];
  const verticals: { value: VerticalAlign; label: string; Icon: typeof AlignLeft }[] = [{ value: "top", label: "上揃え", Icon: AlignVerticalJustifyStart }, { value: "center", label: "上下中央", Icon: AlignVerticalJustifyCenter }, { value: "bottom", label: "下揃え", Icon: AlignVerticalJustifyEnd }];
  const isText = block.type === "heading" || block.type === "body" || block.type === "button" || block.type === "logo";
  return <div className="floating-inspector" style={{ left, top }} onPointerDown={(event) => event.stopPropagation()}>{isText && <><div className="toolbar-group">{alignments.map(({ value, label, Icon }) => <button key={value} className={block.align === value ? "active" : ""} onClick={() => onChange({ align: value })} title={label} aria-label={label}><Icon size={15} /></button>)}</div><span className="toolbar-divider" /><div className="toolbar-group">{verticals.map(({ value, label, Icon }) => <button key={value} className={block.valign === value ? "active" : ""} onClick={() => onChange({ valign: value })} title={label} aria-label={label}><Icon size={15} /></button>)}</div><span className="toolbar-divider" /></>}{block.type === "image" && <div className="image-tool-wrap"><button className={imagesOpen ? "active" : ""} onClick={() => setImagesOpen((open) => !open)} title="画像を変更" aria-label="画像を変更"><ImagePlus size={16} /></button>{imagesOpen && <div className="image-picker">{moodImages.map((image) => <button key={image.id} className={block.image === image.src ? "selected" : ""} onClick={() => { onChange({ image: image.src }); setImagesOpen(false); }} title={image.label}><img src={image.src} alt={image.label} /></button>)}</div>}</div>}<button onClick={onCopy} title="コピー" aria-label="コピー"><Copy size={15} /></button><button onClick={onBringFront} title="最前面へ" aria-label="最前面へ"><BringToFront size={15} /></button><button onClick={onSendBack} title="最背面へ" aria-label="最背面へ"><SendToBack size={15} /></button><span className="toolbar-divider" /><button className="delete-tool" onClick={onDelete} title="削除" aria-label="削除"><Trash2 size={15} /></button></div>;
}

function AutoFitText({ block, fitKey }: { block: Block; fitKey: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const text = ref.current; const container = text?.parentElement;
    if (!text || !container) return;
    const maximum = block.type === "heading" ? ({ 1: 31, 2: 23, 3: 17 }[block.level ?? 1]) : block.type === "body" ? 11 : 12;
    const fit = () => {
      let size = maximum;
      text.style.fontSize = `${size}px`;
      while (size > 4 && (text.scrollWidth > container.clientWidth + .5 || text.scrollHeight > container.clientHeight + .5)) { size -= .5; text.style.fontSize = `${size}px`; }
    };
    let frame = requestAnimationFrame(() => { fit(); frame = requestAnimationFrame(fit); });
    document.fonts?.ready.then(fit);
    const observer = new ResizeObserver(fit); observer.observe(container);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [block.text, block.level, block.type, block.w, block.h, fitKey]);
  return <span ref={ref} className="auto-fit-text">{block.text}</span>;
}

function PreviewPoster({ blocks, palette, grid, styleChoice, adjective }: { blocks: Block[]; palette: string[]; grid: GridSettings; styleChoice: string; adjective: string }) {
  const style = { ...gridVars(grid), background: palette[0], color: palette[1] } as React.CSSProperties;
  const className = ["preview-poster", styleChoice, adjective ? `tone-${adjective}` : ""].join(" ");
  const fitKey = `${styleChoice}-${adjective}`;
  return <div className={className} style={style}><div className="preview-grid poster-grid">{blocks.map((block) => { const alignment = { justifyContent: block.align === "center" ? "center" : block.align === "right" ? "flex-end" : "flex-start", alignItems: block.valign === "top" ? "flex-start" : block.valign === "bottom" ? "flex-end" : "center", textAlign: block.align ?? "left", background: block.type === "button" || block.type === "logo" ? palette[2] : undefined } as React.CSSProperties; const ratio = block.w / block.h; const shapeMode = ratio >= 3 ? "shape-line" : block.w * block.h >= 12 ? "shape-field" : "shape-accent"; return <div key={block.id} className={`preview-block ${block.type} level-${block.level ?? 0} ${block.type === "shape" ? shapeMode : ""}`} style={{ ...blockStyle(block), ...alignment }}>{block.type === "image" ? <img src={block.image} alt="" /> : block.type === "shape" ? <span /> : <AutoFitText block={block} fitKey={fitKey} />}</div>; })}</div></div>;
}
