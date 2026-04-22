'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useNodes, useSettings, useMaps } from '@/lib/hooks';
import { computeRadialLayout } from '@/lib/layout';
import {
  type MapNode,
  type UserSettings,
  NODE_PRESETS,
  NODE_COLORS,
  SHAPES,
  getNodeOuterColor,
  getNodeInnerColor,
  getNodeOuterShape,
  getNodeInnerShape,
  getNodeOuterSize,
  getNodeInnerSize,
  getNodeOuterSolid,
  getNodeInnerSolid,
  getNodeDisplayMode,
  getNodeAbc,
} from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Plus, X, ChevronRight, Pencil, Trash2, ZoomIn, ZoomOut, Locate, Lock, Unlock, Palette, Search, ChevronDown, ChevronLeft, ImagePlus, Trash, Tag, Download, CheckCircle2, Circle } from 'lucide-react';
import { NoddicLoader } from '@/components/loader';

const isDarkBg = (color?: string | null) => ['#1c1b1b', '#0f172a', '#27272a', '#111827'].includes(color || '');

// ─── Image Upload ───────────────────────────────────────────────────
async function uploadNodeImage(userId: string, nodeId: string, file: File): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${nodeId}.${ext}`;
  const { error } = await supabase.storage.from('node-images').upload(path, file, { upsert: true });
  if (error) { console.error('Upload error:', error); return null; }
  const { data } = supabase.storage.from('node-images').getPublicUrl(path);
  return data.publicUrl + '?t=' + Date.now();
}

async function deleteNodeImage(userId: string, nodeId: string, imageUrl: string): Promise<boolean> {
  const supabase = createClient();
  const parts = imageUrl.split('/node-images/');
  if (parts.length < 2) return false;
  const path = parts[1].split('?')[0];
  const { error } = await supabase.storage.from('node-images').remove([path]);
  return !error;
}

function ImageUploadButton({ userId, nodeId, currentUrl, onUploaded }: { userId: string; nodeId: string; currentUrl: string | null; onUploaded: (url: string | null) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    setUploading(true); const url = await uploadNodeImage(userId, nodeId, file); if (url) onUploaded(url); setUploading(false); if (inputRef.current) inputRef.current.value = '';
  };
  const handleRemove = async () => { if (!currentUrl) return; setUploading(true); await deleteNodeImage(userId, nodeId, currentUrl); onUploaded(null); setUploading(false); };
  return (
    <div className="space-y-2">
      {currentUrl && <div className="relative rounded-xl overflow-hidden border border-surface-container-high"><img src={currentUrl} alt="Node" className="w-full h-32 object-cover" /><button onClick={handleRemove} disabled={uploading} className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"><Trash size={14} /></button></div>}
      <button onClick={() => inputRef.current?.click()} disabled={uploading} className="w-full py-2.5 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition flex items-center justify-center gap-2 disabled:opacity-50"><ImagePlus size={14} /> {uploading ? 'Uploading…' : currentUrl ? 'Change Image' : 'Add Image'}</button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}

// ─── Tag Input ──────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => { const t = input.trim().toLowerCase(); if (t && !tags.includes(t)) { onChange([...tags, t]); } setInput(''); };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 text-xs font-headline font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {tag}
            <button onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:text-error transition"><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} className="flex-1 px-3 py-2 rounded-xl border border-outline-variant bg-white text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Add tag…" />
        <button onClick={add} disabled={!input.trim()} className="px-3 py-2 rounded-xl text-xs font-headline font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition disabled:opacity-30">Add</button>
      </div>
    </div>
  );
}

// ─── Shape Rendering ────────────────────────────────────────────────
function buildShapePoints(cx: number, cy: number, r: number, shape: string): string | null {
  switch (shape) {
    case 'diamond': return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
    case 'triangle': return `${cx},${cy - r} ${cx + r * 0.866},${cy + r * 0.5} ${cx - r * 0.866},${cy + r * 0.5}`;
    case 'hexagon': return Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' ');
    case 'star': return Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const rd = i % 2 === 0 ? r : r * 0.45; return `${cx + rd * Math.cos(a)},${cy + rd * Math.sin(a)}`; }).join(' ');
    case 'pentagon': return Array.from({ length: 5 }, (_, i) => { const a = (Math.PI * 2 / 5) * i - Math.PI / 2; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' ');
    case 'octagon': return Array.from({ length: 8 }, (_, i) => { const a = (Math.PI / 4) * i - Math.PI / 8; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' ');
    default: return null;
  }
}

function shapeElement(cx: number, cy: number, r: number, shape: string, fill: string, stroke: string, strokeWidth: number, solid: boolean) {
  const f = solid ? fill : '#fcf9f8'; const s = solid ? 'none' : stroke; const sw = solid ? 0 : strokeWidth;
  if (shape === 'square') return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={r * 0.22} fill={f} stroke={s} strokeWidth={sw} />;
  if (shape === 'circle') return <circle cx={cx} cy={cy} r={r} fill={f} stroke={s} strokeWidth={sw} />;
  const pts = buildShapePoints(cx, cy, r, shape);
  if (pts) return <polygon points={pts} fill={f} stroke={s} strokeWidth={sw} />;
  return <circle cx={cx} cy={cy} r={r} fill={f} stroke={s} strokeWidth={sw} />;
}

function imageShapeElement(cx: number, cy: number, r: number, shape: string, fill: string, stroke: string, strokeWidth: number) {
  if (shape === 'square') return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={r * 0.22} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  if (shape === 'circle') return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  const pts = buildShapePoints(cx, cy, r, shape);
  if (pts) return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
}

function renderNode(cx: number, cy: number, outerShape: string, outerColor: string, outerSize: number, outerSolid: boolean, displayMode: 'shape' | 'abc', innerShape: string, innerColor: string, innerSize: number, innerSolid: boolean, abc: string, isSelected: boolean, imageUrl?: string | null, nodeId?: string) {
  const sw = isSelected ? 2.5 : 1.8;
  if (imageUrl && nodeId) {
    const patId = `img-pat-${nodeId}`;
    return (
      <>
        <defs>
          <pattern id={patId} patternUnits="objectBoundingBox" width="1" height="1">
            <image href={imageUrl} x="0" y="0" width={outerSize * 2} height={outerSize * 2} preserveAspectRatio="xMidYMid slice" />
          </pattern>
        </defs>
        {imageShapeElement(cx, cy, outerSize, outerShape, `url(#${patId})`, outerColor, sw)}
      </>
    );
  }
  return (
    <>
      {shapeElement(cx, cy, outerSize, outerShape, outerColor, outerColor, sw, outerSolid)}
      {displayMode === 'abc' ? (
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill={outerSolid ? 'white' : innerColor} fontSize={Math.max(10, innerSize * 2.2)} fontWeight={800} fontFamily="Manrope, system-ui, sans-serif">{abc.slice(0, 2)}</text>
      ) : (
        shapeElement(cx, cy, innerSize, innerShape, innerColor, innerColor, 0, innerSolid)
      )}
    </>
  );
}

function ShapePreview({ shape, color, size = 24, solid = true }: { shape: string; color: string; size?: number; solid?: boolean }) {
  const r = size * 0.4; const cx = size / 2; const cy = size / 2;
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{shapeElement(cx, cy, r, shape, color, color, 1.5, solid)}</svg>;
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {NODE_COLORS.map((c) => (
        <button key={c} onClick={() => onChange(c)} className="w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center" style={{ background: c, borderColor: value === c ? '#1c1b1b' : 'transparent', transform: value === c ? 'scale(1.15)' : 'scale(1)' }}>
          {value === c && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
        </button>
      ))}
      <label className="w-7 h-7 rounded-lg border-2 border-outline-variant cursor-pointer overflow-hidden relative">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        <div className="w-full h-full flex items-center justify-center"><Palette size={12} className="text-on-surface-variant" /></div>
      </label>
    </div>
  );
}

function ShapePicker({ value, onChange, color }: { value: string; onChange: (s: string) => void; color: string }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {SHAPES.map((s) => (
        <button key={s.key} onClick={() => onChange(s.key)} className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border-2 transition-all" style={{ borderColor: value === s.key ? color : 'transparent', background: value === s.key ? color + '10' : '#f0edec' }}>
          <ShapePreview shape={s.key} color={value === s.key ? color : '#999'} size={20} />
          <span className="text-[9px] font-headline" style={{ color: value === s.key ? color : '#999' }}>{s.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Node Appearance Editor ─────────────────────────────────────────
function NodeAppearanceEditor({ displayMode, setDisplayMode, outerShape, setOuterShape, outerColor, setOuterColor, outerSize, setOuterSize, outerSolid, setOuterSolid, innerShape, setInnerShape, innerColor, setInnerColor, innerSize, setInnerSize, innerSolid, setInnerSolid, abc, setAbc }: { displayMode: 'shape' | 'abc'; setDisplayMode: (v: 'shape' | 'abc') => void; outerShape: string; setOuterShape: (v: string) => void; outerColor: string; setOuterColor: (v: string) => void; outerSize: number; setOuterSize: (v: number) => void; outerSolid: boolean; setOuterSolid: (v: boolean) => void; innerShape: string; setInnerShape: (v: string) => void; innerColor: string; setInnerColor: (v: string) => void; innerSize: number; setInnerSize: (v: number) => void; innerSolid: boolean; setInnerSolid: (v: boolean) => void; abc: string; setAbc: (v: string) => void }) {
  const sL = "block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5";
  const subL = "block text-[10px] font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1";
  return (
    <div className="space-y-4">
      <div><label className={sL}>Display</label><div className="flex gap-2">{(['shape', 'abc'] as const).map((m) => (<button key={m} onClick={() => setDisplayMode(m)} className="flex-1 py-2 px-3 rounded-xl text-xs font-headline font-semibold border-2 transition-all" style={{ borderColor: displayMode === m ? outerColor : 'transparent', background: displayMode === m ? outerColor + '15' : '#f0edec', color: displayMode === m ? outerColor : '#464555' }}>{m === 'shape' ? 'Shape + Shape' : 'Shape + ABC'}</button>))}</div></div>
      <div className="bg-surface-container rounded-xl p-3 space-y-2"><label className={sL}>Outer Shape</label><ShapePicker value={outerShape} onChange={setOuterShape} color={outerColor} /><div><label className={subL}>Colour</label><ColorPicker value={outerColor} onChange={setOuterColor} /></div><div className="flex gap-4 items-center"><div className="flex-1"><label className={subL}>Size ({outerSize}px)</label><input type="range" min={16} max={50} value={outerSize} onChange={(e) => setOuterSize(Number(e.target.value))} className="w-full" style={{ accentColor: outerColor }} /></div><div><label className={subL}>Fill</label><div className="flex gap-1"><button onClick={() => setOuterSolid(false)} className="px-2.5 py-1 rounded-lg text-[10px] font-headline font-semibold border transition-all" style={{ borderColor: !outerSolid ? outerColor : '#e5e2e1', background: !outerSolid ? outerColor + '15' : 'transparent', color: !outerSolid ? outerColor : '#777' }}>Outline</button><button onClick={() => setOuterSolid(true)} className="px-2.5 py-1 rounded-lg text-[10px] font-headline font-semibold border transition-all" style={{ borderColor: outerSolid ? outerColor : '#e5e2e1', background: outerSolid ? outerColor + '15' : 'transparent', color: outerSolid ? outerColor : '#777' }}>Solid</button></div></div></div></div>
      <div className="bg-surface-container rounded-xl p-3 space-y-2">
        {displayMode === 'shape' ? (<><label className={sL}>Inner Shape</label><ShapePicker value={innerShape} onChange={setInnerShape} color={innerColor} /><div><label className={subL}>Colour</label><ColorPicker value={innerColor} onChange={setInnerColor} /></div><div className="flex gap-4 items-center"><div className="flex-1"><label className={subL}>Size ({innerSize}px)</label><input type="range" min={2} max={Math.floor(outerSize * 0.7)} value={innerSize} onChange={(e) => setInnerSize(Number(e.target.value))} className="w-full" style={{ accentColor: innerColor }} /></div><div><label className={subL}>Fill</label><div className="flex gap-1"><button onClick={() => setInnerSolid(false)} className="px-2.5 py-1 rounded-lg text-[10px] font-headline font-semibold border transition-all" style={{ borderColor: !innerSolid ? innerColor : '#e5e2e1', background: !innerSolid ? innerColor + '15' : 'transparent', color: !innerSolid ? innerColor : '#777' }}>Outline</button><button onClick={() => setInnerSolid(true)} className="px-2.5 py-1 rounded-lg text-[10px] font-headline font-semibold border transition-all" style={{ borderColor: innerSolid ? innerColor : '#e5e2e1', background: innerSolid ? innerColor + '15' : 'transparent', color: innerSolid ? innerColor : '#777' }}>Solid</button></div></div></div></>) : (<><label className={sL}>Characters (max 2)</label><input value={abc} onChange={(e) => setAbc(e.target.value.slice(0, 2).toUpperCase())} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-headline font-bold text-center text-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition tracking-wider" placeholder="AB" maxLength={2} /><div><label className={subL}>Text Colour</label><ColorPicker value={innerColor} onChange={setInnerColor} /></div><div><label className={subL}>Text Size ({innerSize}px)</label><input type="range" min={8} max={Math.floor(outerSize * 0.8)} value={innerSize} onChange={(e) => setInnerSize(Number(e.target.value))} className="w-full" style={{ accentColor: innerColor }} /></div></>)}
      </div>
      <div><label className={sL}>Preview</label><div className="bg-[#f6f3f2] rounded-xl p-4 flex items-center justify-center"><svg width="100" height="100" viewBox="0 0 100 100">{renderNode(50, 50, outerShape, outerColor, outerSize, outerSolid, displayMode, innerShape, innerColor, innerSize, innerSolid, abc || '?', false)}</svg></div></div>
    </div>
  );
}

// ─── Onboarding ─────────────────────────────────────────────────────
function MapOnboarding({ mapName, onComplete }: { mapName: string; onComplete: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-sm page-enter text-center">
        <div className="text-4xl mb-4">🎯</div>
        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-2">Set up &quot;{mapName}&quot;</h2>
        <p className="text-on-surface-variant text-sm mb-8">What should the center node be called? This is the starting point of your map.</p>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && onComplete(name.trim())} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition mb-4" placeholder="e.g. Me, Home Base, Japan Trip" autoFocus />
        <button onClick={() => name.trim() && onComplete(name.trim())} disabled={!name.trim()} className="w-full silk-gradient text-white py-3 rounded-xl font-headline font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-40">Start Mapping</button>
      </div>
    </div>
  );
}

// ─── Shared Form Hook ───────────────────────────────────────────────
interface NodeFormState { type: string; displayMode: 'shape' | 'abc'; outerShape: string; outerColor: string; outerSize: number; outerSolid: boolean; innerShape: string; innerColor: string; innerSize: number; innerSolid: boolean; abc: string; }

function useNodeForm(initial: NodeFormState) {
  const [customMode, setCustomMode] = useState(false);
  const [form, setForm] = useState(initial);
  const selectPreset = (p: typeof NODE_PRESETS[0]) => {
    setForm((prev) => ({ ...prev, type: p.type, displayMode: p.display_mode, outerShape: p.outer_shape, outerColor: p.outer_color, outerSize: p.outer_size, outerSolid: p.outer_solid, innerShape: p.inner_shape, innerColor: p.inner_color, innerSize: p.inner_size, innerSolid: p.inner_solid }));
    setCustomMode(false);
  };
  return { form, setForm, customMode, setCustomMode, selectPreset };
}

function TypePickerSection({ form, setForm, customMode, setCustomMode, selectPreset }: ReturnType<typeof useNodeForm>) {
  return (
    <>
      <div>
        <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Mode</label>
        <div className="flex gap-2">
          <button onClick={() => setCustomMode(false)} className="flex-1 py-2.5 px-3 rounded-xl text-xs font-headline font-semibold border-2 transition-all" style={{ borderColor: !customMode ? form.outerColor : 'transparent', background: !customMode ? form.outerColor + '15' : '#f0edec', color: !customMode ? form.outerColor : '#464555' }}>Presets</button>
          <button onClick={() => setCustomMode(true)} className="flex-1 py-2.5 px-3 rounded-xl text-xs font-headline font-semibold border-2 transition-all flex items-center justify-center gap-1.5" style={{ borderColor: customMode ? form.outerColor : 'transparent', background: customMode ? form.outerColor + '15' : '#f0edec', color: customMode ? form.outerColor : '#464555' }}><Palette size={13} /> Custom</button>
        </div>
      </div>
      {!customMode && (
        <div>
          <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Type</label>
          <div className="flex flex-wrap gap-2">
            {NODE_PRESETS.map((p) => (
              <button key={p.type} onClick={() => selectPreset(p)} className="py-2 px-3 rounded-xl text-xs font-headline font-semibold border-2 transition-all flex items-center gap-1.5" style={{ borderColor: form.type === p.type && !customMode ? p.outer_color : 'transparent', background: form.type === p.type && !customMode ? p.outer_color + '15' : '#f0edec', color: form.type === p.type && !customMode ? p.outer_color : '#464555' }}>
                <ShapePreview shape={p.outer_shape} color={form.type === p.type ? p.outer_color : '#999'} size={16} /> {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {customMode && (
        <>
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Type name</label>
            <input value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value.toLowerCase() }))} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="e.g. skill, tool, recipe" />
          </div>
          <NodeAppearanceEditor displayMode={form.displayMode} setDisplayMode={(v) => setForm((prev) => ({ ...prev, displayMode: v }))} outerShape={form.outerShape} setOuterShape={(v) => setForm((prev) => ({ ...prev, outerShape: v }))} outerColor={form.outerColor} setOuterColor={(v) => setForm((prev) => ({ ...prev, outerColor: v }))} outerSize={form.outerSize} setOuterSize={(v) => setForm((prev) => ({ ...prev, outerSize: v }))} outerSolid={form.outerSolid} setOuterSolid={(v) => setForm((prev) => ({ ...prev, outerSolid: v }))} innerShape={form.innerShape} setInnerShape={(v) => setForm((prev) => ({ ...prev, innerShape: v }))} innerColor={form.innerColor} setInnerColor={(v) => setForm((prev) => ({ ...prev, innerColor: v }))} innerSize={form.innerSize} setInnerSize={(v) => setForm((prev) => ({ ...prev, innerSize: v }))} innerSolid={form.innerSolid} setInnerSolid={(v) => setForm((prev) => ({ ...prev, innerSolid: v }))} abc={form.abc} setAbc={(v) => setForm((prev) => ({ ...prev, abc: v }))} />
        </>
      )}
    </>
  );
}

// ─── Add Node Modal ─────────────────────────────────────────────────
function AddNodeModal({ parentNode, settings, onAdd, onClose }: { parentNode: MapNode; settings: UserSettings | null; onAdd: (data: any) => void; onClose: () => void }) {
  const dp = NODE_PRESETS[0];
  const nf = useNodeForm({ type: dp.type, displayMode: dp.display_mode, outerShape: dp.outer_shape, outerColor: dp.outer_color, outerSize: dp.outer_size, outerSolid: dp.outer_solid, innerShape: dp.inner_shape, innerColor: dp.inner_color, innerSize: dp.inner_size, innerSolid: dp.inner_solid, abc: '' });
  const [name, setName] = useState('');
  const [hint, setHint] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [relationship, setRelationship] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const parentColor = getNodeOuterColor(parentNode, settings);

  useEffect(() => {
    const initial = name.charAt(0).toUpperCase() || '';
    if (!nf.form.abc || nf.form.abc.length <= 1) nf.setForm((prev) => ({ ...prev, abc: initial }));
  }, [name]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto custom-scrollbar animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-surface-container">
          <h3 className="font-headline font-bold text-lg text-on-surface">Add from <span style={{ color: parentColor }}>{parentNode.name}</span></h3>
          <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <TypePickerSection {...nf} />
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Node name" autoFocus /></div>
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Hint</label><input value={hint} onChange={(e) => setHint(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Memory trigger (optional)" /></div>
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition resize-y min-h-[60px]" placeholder="Optional details" /></div>
          {nf.form.type === 'place' && <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Address" /></div>}
          {nf.form.type === 'person' && <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Relationship</label><input value={relationship} onChange={(e) => setRelationship(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="e.g. Friend, colleague" /></div>}
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Tags</label><TagInput tags={tags} onChange={setTags} /></div>
        </div>
        <div className="flex gap-3 p-5 border-t border-surface-container">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition">Cancel</button>
          <button onClick={() => { if (!name.trim()) return; onAdd({ name: name.trim(), type: nf.form.type, hint: hint || null, description: description || null, address: address || null, relationship: relationship || null, tags, displayMode: nf.form.displayMode, outerShape: nf.form.outerShape, outerColor: nf.form.outerColor, outerSize: nf.form.outerSize, outerSolid: nf.form.outerSolid, innerShape: nf.form.innerShape, innerColor: nf.form.innerColor, innerSize: nf.form.innerSize, innerSolid: nf.form.innerSolid, abc: nf.form.abc || name.charAt(0).toUpperCase() }); }} disabled={!name.trim()} className="flex-1 text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${nf.form.outerColor}, ${nf.form.outerColor}dd)` }}>Add</button>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Add Modal ────────────────────────────────────────────────
function QuickAddModal({ nodes, settings, onAdd, onClose }: { nodes: MapNode[]; settings: UserSettings | null; onAdd: (data: any) => void; onClose: () => void }) {
  const dp = NODE_PRESETS[0];
  const nf = useNodeForm({ type: dp.type, displayMode: dp.display_mode, outerShape: dp.outer_shape, outerColor: dp.outer_color, outerSize: dp.outer_size, outerSolid: dp.outer_solid, innerShape: dp.inner_shape, innerColor: dp.inner_color, innerSize: dp.inner_size, innerSolid: dp.inner_solid, abc: '' });
  const [parentId, setParentId] = useState(nodes.find((n) => !n.parent_id)?.id || '');
  const [name, setName] = useState('');
  const [hint, setHint] = useState('');
  const [search, setSearch] = useState('');
  const filteredNodes = search.trim() ? nodes.filter((n) => n.name.toLowerCase().includes(search.toLowerCase())) : nodes;
  const selectedParent = nodes.find((n) => n.id === parentId);

  useEffect(() => {
    const initial = name.charAt(0).toUpperCase() || '';
    if (!nf.form.abc || nf.form.abc.length <= 1) nf.setForm((prev) => ({ ...prev, abc: initial }));
  }, [name]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto custom-scrollbar animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-surface-container">
          <h3 className="font-headline font-bold text-lg text-on-surface">Quick Add</h3>
          <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Add to</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition mb-2" placeholder="Search nodes…" />
            <div className="max-h-[120px] overflow-y-auto custom-scrollbar border border-outline-variant rounded-xl">
              {filteredNodes.map((n) => {
                const nc = getNodeOuterColor(n, settings);
                return <button key={n.id} onClick={() => { setParentId(n.id); setSearch(''); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${parentId === n.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container text-on-surface'}`}><ShapePreview shape={getNodeOuterShape(n)} color={nc} size={14} /><span className="font-headline font-medium truncate">{n.name}</span>{parentId === n.id && <span className="ml-auto text-xs">✓</span>}</button>;
              })}
            </div>
            {selectedParent && <p className="text-xs text-on-surface-variant mt-1.5">Adding to <span style={{ color: getNodeOuterColor(selectedParent, settings) }} className="font-semibold">{selectedParent.name}</span></p>}
          </div>
          <TypePickerSection {...nf} />
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Node name" /></div>
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Hint</label><input value={hint} onChange={(e) => setHint(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Memory trigger (optional)" /></div>
        </div>
        <div className="flex gap-3 p-5 border-t border-surface-container">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition">Cancel</button>
          <button onClick={() => { if (!name.trim() || !parentId) return; onAdd({ parentId, name: name.trim(), type: nf.form.type, hint: hint || null, displayMode: nf.form.displayMode, outerShape: nf.form.outerShape, outerColor: nf.form.outerColor, outerSize: nf.form.outerSize, outerSolid: nf.form.outerSolid, innerShape: nf.form.innerShape, innerColor: nf.form.innerColor, innerSize: nf.form.innerSize, innerSolid: nf.form.innerSolid, abc: nf.form.abc || name.charAt(0).toUpperCase() }); }} disabled={!name.trim() || !parentId} className="flex-1 text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${nf.form.outerColor}, ${nf.form.outerColor}dd)` }}>Add</button>
        </div>
      </div>
    </div>
  );
}

// ─── Node Detail Panel ──────────────────────────────────────────────
function NodePanel({ node, nodes, settings, userId, onUpdate, onDelete, onAddChild, onResetPosition, onToggleCollapse, onClose }: { node: MapNode; nodes: MapNode[]; settings: UserSettings | null; userId: string; onUpdate: (id: string, data: Partial<MapNode>) => void; onDelete: (id: string) => void; onAddChild: (parentId: string) => void; onResetPosition: (id: string) => void; onToggleCollapse: (id: string) => void; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: node.name, hint: node.hint || '', description: node.description || '', address: node.address || '', relationship: node.relationship || '', tags: node.tags || [] as string[] });
  const isRoot = !node.parent_id;
  const nf = useNodeForm({ type: node.type, displayMode: getNodeDisplayMode(node), outerShape: getNodeOuterShape(node), outerColor: getNodeOuterColor(node, settings), outerSize: getNodeOuterSize(node, isRoot), outerSolid: getNodeOuterSolid(node, isRoot), innerShape: getNodeInnerShape(node), innerColor: getNodeInnerColor(node, settings), innerSize: getNodeInnerSize(node, isRoot), innerSolid: getNodeInnerSolid(node), abc: getNodeAbc(node) });
  const nodeColor = getNodeOuterColor(node, settings);
  const children = nodes.filter((n) => n.parent_id === node.id);
  const parent = nodes.find((n) => n.id === node.parent_id);
  const hasCustomPosition = node.position_x != null && node.position_y != null;

  useEffect(() => {
    setForm({ name: node.name, hint: node.hint || '', description: node.description || '', address: node.address || '', relationship: node.relationship || '', tags: node.tags || [] });
    setEditing(false);
    nf.setForm({ type: node.type, displayMode: getNodeDisplayMode(node), outerShape: getNodeOuterShape(node), outerColor: getNodeOuterColor(node, settings), outerSize: getNodeOuterSize(node, isRoot), outerSolid: getNodeOuterSolid(node, isRoot), innerShape: getNodeInnerShape(node), innerColor: getNodeInnerColor(node, settings), innerSize: getNodeInnerSize(node, isRoot), innerSolid: getNodeInnerSolid(node), abc: getNodeAbc(node) });
    nf.setCustomMode(false);
  }, [node, settings]);

  const handleSave = () => {
    onUpdate(node.id, { name: form.name, type: nf.form.type, hint: form.hint || null, description: form.description || null, address: form.address || null, relationship: form.relationship || null, tags: form.tags || [], display_mode: nf.form.displayMode, outer_shape: nf.form.outerShape, outer_color: nf.form.outerColor, outer_size: nf.form.outerSize, outer_solid: nf.form.outerSolid, inner_shape: nf.form.innerShape, inner_color: nf.form.innerColor, inner_size: nf.form.innerSize, inner_solid: nf.form.innerSolid, abc: nf.form.abc, color: nf.form.outerColor, shape: nf.form.outerShape });
    setEditing(false);
  };

  const detailRows = [{ label: 'Type', value: node.type.charAt(0).toUpperCase() + node.type.slice(1) }, { label: 'Hint', value: node.hint }, { label: 'Description', value: node.description }, { label: 'Address', value: node.address }, { label: 'Relationship', value: node.relationship }];

  return (
    <div className="fixed top-16 inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:top-0 sm:right-0 sm:w-[380px] sm:max-w-[90vw] sm:h-full bg-surface-container-lowest sm:border-l border-surface-container-high z-40 flex flex-col animate-slide-right shadow-2xl">
      <div className="flex items-center justify-between p-5 border-b border-surface-container">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-headline font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: nodeColor + '18', color: nodeColor }}>
            <ShapePreview shape={getNodeOuterShape(node)} color={nodeColor} size={14} /> {node.type}
          </span>
          {parent && <span className="text-xs text-on-surface-variant flex items-center gap-1"><ChevronRight size={12} /> {parent.name}</span>}
        </div>
        <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {!editing ? (
          <>
            {node.image_url && <div className="mb-4 rounded-xl overflow-hidden border border-surface-container-high"><img src={node.image_url} alt={node.name} className="w-full h-40 object-cover" /></div>}
            <div className="flex items-center gap-3 mb-5">
              <svg width="52" height="52" viewBox="0 0 52 52">{renderNode(26, 26, getNodeOuterShape(node), getNodeOuterColor(node, settings), Math.min(getNodeOuterSize(node, isRoot), 22), getNodeOuterSolid(node, isRoot), getNodeDisplayMode(node), getNodeInnerShape(node), getNodeInnerColor(node, settings), Math.min(getNodeInnerSize(node, isRoot), 10), getNodeInnerSolid(node), getNodeAbc(node), false)}</svg>
              <h2 className="font-headline font-extrabold text-2xl text-on-surface">{node.name}</h2>
            </div>
            {detailRows.filter((r) => r.value).map((r) => (<div key={r.label} className="mb-4"><span className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{r.label}</span><p className="text-on-surface text-sm leading-relaxed">{r.value}</p></div>))}
            <div className="mb-4"><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Image</label><ImageUploadButton userId={userId} nodeId={node.id} currentUrl={node.image_url} onUploaded={(url) => onUpdate(node.id, { image_url: url })} /></div>
            {node.tags && node.tags.length > 0 && (<div className="mb-4"><span className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Tags</span><div className="flex flex-wrap gap-1.5">{node.tags.map((tag) => (<span key={tag} className="inline-flex items-center gap-1 text-xs font-headline font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary"><Tag size={10} /> {tag}</span>))}</div></div>)}
            {children.length > 0 && (<div className="mt-6"><span className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Connections ({children.length})</span><div className="flex flex-wrap gap-2">{children.map((c) => { const cc = getNodeOuterColor(c, settings); return <span key={c.id} className="inline-flex items-center gap-1.5 text-xs font-headline font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: cc + '40', color: cc }}><ShapePreview shape={getNodeOuterShape(c)} color={cc} size={12} /> {c.name}</span>; })}</div></div>)}
          </>
        ) : (
          <div className="space-y-4">
            <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" /></div>
            <TypePickerSection {...nf} />
            <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Hint</label><input value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Memory trigger" /></div>
            <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition resize-y min-h-[60px]" placeholder="Notes" /></div>
            {(nf.form.type === 'place' || node.type === 'place') && <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Address" /></div>}
            {(nf.form.type === 'person' || node.type === 'person') && <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Relationship</label><input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="e.g. Friend" /></div>}
            <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Tags</label><TagInput tags={form.tags || []} onChange={(t) => setForm({ ...form, tags: t })} /></div>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 p-5 border-t border-surface-container space-y-2">
        {!editing ? (
          <>
            <button onClick={() => onAddChild(node.id)} className="w-full text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${nodeColor}, ${nodeColor}dd)` }}><Plus size={16} /> Add from {node.name}</button>
            <button onClick={() => onUpdate(node.id, { completed: !node.completed })} className={`w-full py-2.5 rounded-xl font-headline font-semibold text-sm border transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${node.completed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}>{node.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}{node.completed ? 'Completed' : 'Mark Complete'}</button>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="flex-1 py-2.5 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition flex items-center justify-center gap-2"><Pencil size={14} /> Edit</button>
              {children.length > 0 && <button onClick={() => onToggleCollapse(node.id)} className="py-2.5 px-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition flex items-center justify-center" title="Collapse/expand"><ChevronDown size={14} /></button>}
              {hasCustomPosition && <button onClick={() => onResetPosition(node.id)} className="py-2.5 px-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition flex items-center justify-center" title="Reset position"><Locate size={14} /></button>}
              {!isRoot && <button onClick={() => { if (window.confirm(`Delete "${node.name}" and all its connections?`)) onDelete(node.id); }} className="py-2.5 px-4 rounded-xl font-headline font-semibold text-sm border border-error/20 text-error hover:bg-error/5 transition flex items-center justify-center gap-2"><Trash2 size={14} /></button>}
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition">Cancel</button>
            <button onClick={handleSave} className="flex-1 text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${nf.form.outerColor}, ${nf.form.outerColor}dd)` }}>Save</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Search Overlay ─────────────────────────────────────────────────
function SearchOverlay({ nodes, settings, open, onClose, onSelect }: { nodes: MapNode[]; settings: UserSettings | null; open: boolean; onClose: () => void; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return nodes.filter((n) => n.name.toLowerCase().includes(q) || (n.hint && n.hint.toLowerCase().includes(q)) || (n.description && n.description.toLowerCase().includes(q)) || n.type.toLowerCase().includes(q) || (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))).slice(0, 8);
  }, [query, nodes]);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);
  useEffect(() => { if (!open) setQuery(''); }, [open]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) { onClose(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-lg mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-container">
          <Search size={18} className="text-on-surface-variant flex-shrink-0" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 bg-transparent text-on-surface font-body text-base focus:outline-none" placeholder="Search nodes…" />
          {query && <button onClick={() => setQuery('')} className="text-on-surface-variant/40 hover:text-on-surface transition"><X size={16} /></button>}
        </div>
        {query.trim() ? (
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {results.length > 0 ? results.map((n) => {
              const nc = getNodeOuterColor(n, settings);
              return (
                <button key={n.id} onClick={() => { onSelect(n.id); onClose(); }} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-surface-container transition-colors">
                  <ShapePreview shape={getNodeOuterShape(n)} color={nc} size={20} solid={getNodeOuterSolid(n, !n.parent_id)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-headline font-semibold text-sm text-on-surface truncate">{n.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{n.type.charAt(0).toUpperCase() + n.type.slice(1)}{n.hint && ` · ${n.hint}`}</p>
                  </div>
                  <span style={{ color: nc }} className="text-xs font-headline">→</span>
                </button>
              );
            }) : <div className="px-5 py-8 text-center text-on-surface-variant text-sm">No nodes found for &quot;{query}&quot;</div>}
          </div>
        ) : (
          <div className="px-5 py-6 text-center text-on-surface-variant/60 text-sm">Start typing to search across all nodes</div>
        )}
      </div>
    </div>
  );
}

// ─── SVG Canvas ─────────────────────────────────────────────────────
function MapCanvas({ nodes, positions, selectedId, highlightId, settings, dragEnabled, collapsedIds, childCountMap, onSelectNode, onDragNode, onToggleCollapse }: {
  nodes: MapNode[]; positions: Record<string, { x: number; y: number }>; selectedId: string | null; highlightId: string | null;
  settings: UserSettings | null; dragEnabled: boolean; collapsedIds: Set<string>; childCountMap: Record<string, number>;
  onSelectNode: (id: string | null) => void; onDragNode: (id: string, x: number, y: number) => void; onToggleCollapse: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [draggingCanvas, setDraggingCanvas] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const nodeStartPos = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const lastMoveTime = useRef(0);

  // Pinch zoom state
  const pinchStartDist = useRef(0);
  const pinchStartZoom = useRef(1);
  const pinchMidpoint = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const touchCount = useRef(0);

  // Tap detection
  const tapStart = useRef({ x: 0, y: 0, time: 0 });
  const tapNodeId = useRef<string | null>(null);

  useEffect(() => {
    if (svgRef.current) {
      const r = svgRef.current.getBoundingClientRect();
      setPan({ x: r.width / 2, y: r.height / 2 });
    }
  }, []);

  // Desktop scroll wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.15, Math.min(3, z * (e.deltaY > 0 ? 0.92 : 1.08))));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Prevent default touch behaviors on the container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => { e.preventDefault(); };
    el.addEventListener('touchmove', prevent, { passive: false });
    el.addEventListener('touchstart', prevent, { passive: false });
    return () => {
      el.removeEventListener('touchmove', prevent);
      el.removeEventListener('touchstart', prevent);
    };
  }, []);

  // Highlight pan
  useEffect(() => {
    if (highlightId && positions[highlightId] && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const pos = positions[highlightId];
      setPan({ x: rect.width / 2 - pos.x * zoom, y: rect.height / 2 - pos.y * zoom });
      setZoom((z) => Math.max(z, 1));
    }
  }, [highlightId]);

  const getTouchDist = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchMidpoint = (t1: React.Touch, t2: React.Touch) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  });

  // ─── Mouse handlers (desktop) ───────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-node-id]');

    if (nodeEl && dragEnabled) {
      const nid = nodeEl.getAttribute('data-node-id')!;
      const np = positions[nid];
      if (np) {
        setDraggingNodeId(nid);
        dragStart.current = { x: e.clientX, y: e.clientY };
        nodeStartPos.current = { x: np.x, y: np.y };
        didDrag.current = false;
        return;
      }
    }

    if (nodeEl && !dragEnabled) {
      // Let click handler deal with it
      return;
    }

    setDraggingCanvas(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = pan;
  };

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNodeId) {
      const dx = (e.clientX - dragStart.current.x) / zoom;
      const dy = (e.clientY - dragStart.current.y) / zoom;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
      onDragNode(draggingNodeId, nodeStartPos.current.x + dx, nodeStartPos.current.y + dy);
      return;
    }
    if (draggingCanvas) {
      setPan({
        x: panStart.current.x + (e.clientX - dragStart.current.x),
        y: panStart.current.y + (e.clientY - dragStart.current.y),
      });
    }
  }, [draggingNodeId, draggingCanvas, zoom, onDragNode]);

  const onMouseUp = () => {
    if (draggingNodeId) {
      if (!didDrag.current) onSelectNode(draggingNodeId === selectedId ? null : draggingNodeId);
      setDraggingNodeId(null);
      return;
    }
    setDraggingCanvas(false);
  };

  const onNodeClick = (e: React.MouseEvent, id: string) => {
    if (dragEnabled) return;
    e.stopPropagation();
    onSelectNode(id === selectedId ? null : id);
  };

  // ─── Touch handlers (mobile) ────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    const touches = e.touches;
    touchCount.current = touches.length;

    if (touches.length === 2) {
      // Start pinch zoom
      isPinching.current = true;
      pinchStartDist.current = getTouchDist(touches[0], touches[1]);
      pinchStartZoom.current = zoom;
      pinchMidpoint.current = getTouchMidpoint(touches[0], touches[1]);
      panStart.current = pan;
      // Cancel any single-touch drag
      setDraggingCanvas(false);
      setDraggingNodeId(null);
      return;
    }

    if (touches.length === 1) {
      isPinching.current = false;
      const touch = touches[0];
      const target = e.target as HTMLElement;
      const nodeEl = target.closest('[data-node-id]');

      // Record tap start for tap detection
      tapStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      tapNodeId.current = nodeEl?.getAttribute('data-node-id') || null;

      if (nodeEl && dragEnabled) {
        const nid = nodeEl.getAttribute('data-node-id')!;
        const np = positions[nid];
        if (np) {
          setDraggingNodeId(nid);
          dragStart.current = { x: touch.clientX, y: touch.clientY };
          nodeStartPos.current = { x: np.x, y: np.y };
          didDrag.current = false;
          return;
        }
      }

      // Start canvas pan
      setDraggingCanvas(true);
      dragStart.current = { x: touch.clientX, y: touch.clientY };
      panStart.current = pan;
    }
  };

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastMoveTime.current < 16) return;
    lastMoveTime.current = now;

    const touches = e.touches;

    if (touches.length === 2 && isPinching.current) {
      const dist = getTouchDist(touches[0], touches[1]);
      const scale = dist / pinchStartDist.current;
      const newZoom = Math.max(0.15, Math.min(3, pinchStartZoom.current * scale));

      // Zoom toward the midpoint
      const mid = getTouchMidpoint(touches[0], touches[1]);
      const dx = mid.x - pinchMidpoint.current.x;
      const dy = mid.y - pinchMidpoint.current.y;

      setZoom(newZoom);
      setPan({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
      return;
    }

    if (touches.length === 1 && !isPinching.current) {
      const touch = touches[0];

      if (draggingNodeId) {
        const dx = (touch.clientX - dragStart.current.x) / zoom;
        const dy = (touch.clientY - dragStart.current.y) / zoom;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
        onDragNode(draggingNodeId, nodeStartPos.current.x + dx, nodeStartPos.current.y + dy);
        return;
      }

      if (draggingCanvas) {
        const dx = touch.clientX - dragStart.current.x;
        const dy = touch.clientY - dragStart.current.y;
        // Mark as dragged if moved more than a small threshold
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) didDrag.current = true;
        setPan({
          x: panStart.current.x + dx,
          y: panStart.current.y + dy,
        });
      }
    }
  }, [draggingNodeId, draggingCanvas, zoom, onDragNode]);

  const onTouchEnd = (e: React.TouchEvent) => {
    const remaining = e.touches.length;

    if (isPinching.current && remaining < 2) {
      isPinching.current = false;
      // If one finger remains, start panning from that finger
      if (remaining === 1) {
        const touch = e.touches[0];
        setDraggingCanvas(true);
        dragStart.current = { x: touch.clientX, y: touch.clientY };
        panStart.current = pan;
        didDrag.current = false;
      }
      return;
    }

    if (draggingNodeId) {
      if (!didDrag.current) onSelectNode(draggingNodeId === selectedId ? null : draggingNodeId);
      setDraggingNodeId(null);
      return;
    }

    // Tap detection — if finger didn't move much and was quick
    if (remaining === 0 && !dragEnabled) {
      const elapsed = Date.now() - tapStart.current.time;
      const ct = e.changedTouches[0];
      if (ct && elapsed < 300) {
        const dx = Math.abs(ct.clientX - tapStart.current.x);
        const dy = Math.abs(ct.clientY - tapStart.current.y);
        if (dx < 10 && dy < 10 && tapNodeId.current) {
          onSelectNode(tapNodeId.current === selectedId ? null : tapNodeId.current);
        }
      }
    }

    setDraggingCanvas(false);
    didDrag.current = false;
    touchCount.current = remaining;
  };

  const recenter = () => {
    if (svgRef.current) {
      const r = svgRef.current.getBoundingClientRect();
      setPan({ x: r.width / 2, y: r.height / 2 });
      setZoom(1);
    }
  };

  const hiddenIds = useMemo(() => {
    const h = new Set<string>();
    const hide = (pid: string) => { nodes.filter((n) => n.parent_id === pid).forEach((n) => { h.add(n.id); hide(n.id); }); };
    collapsedIds.forEach((id) => hide(id));
    return h;
  }, [collapsedIds, nodes]);

  const visibleNodes = nodes.filter((n) => !hiddenIds.has(n.id));
  const uniqueTypes = Array.from(new Set(visibleNodes.map((n) => n.type)));
  const isHL = highlightId !== null;
  const darkBg = isDarkBg(settings?.map_bg_color);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" style={{ touchAction: 'none', background: settings?.map_bg_color || '#fcf9f8' }}>
      <svg
        ref={svgRef}
        className="w-full h-full map-canvas-svg"
        style={{ cursor: draggingNodeId || draggingCanvas ? 'grabbing' : 'grab', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            <circle cx="20" cy="20" r="0.8" fill={darkBg ? '#ffffff' : '#c7c4d8'} opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {visibleNodes.filter((n) => n.parent_id && positions[n.id] && positions[n.parent_id]).map((n) => {
            const f = positions[n.parent_id!]; const t = positions[n.id]; const c = getNodeOuterColor(n, settings);
            const dim = isHL && n.id !== highlightId && n.parent_id !== highlightId;
            return <line key={`e-${n.id}`} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke={c} strokeWidth={1.5} opacity={dim ? 0.08 : 0.25} />;
          })}
          {/* Nodes */}
          {visibleNodes.map((n) => {
            const p = positions[n.id]; if (!p) return null;
            const ir = !n.parent_id;
            const oc = getNodeOuterColor(n, settings); const ic = getNodeInnerColor(n, settings);
            const os = getNodeOuterShape(n); const is2 = getNodeInnerShape(n);
            const oz = getNodeOuterSize(n, ir); const iz = getNodeInnerSize(n, ir);
            const oSolid = getNodeOuterSolid(n, ir); const iSolid = getNodeInnerSolid(n);
            const dm = getNodeDisplayMode(n); const ab = getNodeAbc(n);
            const isSel = selectedId === n.id; const isDrag = draggingNodeId === n.id;
            const isHLNode = highlightId === n.id; const dimmed = isHL && !isHLNode;
            const count = childCountMap[n.id] || 0; const isCollapsed = collapsedIds.has(n.id);

            return (
              <g key={n.id} data-node-id={n.id} style={{ cursor: dragEnabled ? (isDrag ? 'grabbing' : 'grab') : 'pointer', opacity: dimmed ? 0.2 : 1, transition: 'opacity 0.3s' }} onClick={(e) => onNodeClick(e, n.id)}>
                {isSel && <circle cx={p.x} cy={p.y} r={oz + 10} fill={oc} opacity={0.1} />}
                {isHLNode && <circle cx={p.x} cy={p.y} r={oz + 12} fill={oc} opacity={0.15}><animate attributeName="r" values={`${oz + 10};${oz + 16};${oz + 10}`} dur="1.5s" repeatCount="indefinite" /></circle>}
                {isDrag && <circle cx={p.x} cy={p.y} r={oz + 6} fill={oc} opacity={0.08} stroke={oc} strokeWidth={1} strokeDasharray="4 3" />}
                {renderNode(p.x, p.y, os, oc, oz, oSolid, dm, is2, ic, iz, iSolid, ab, isSel, n.image_url, n.id)}
                <text x={p.x} y={p.y + oz + 16} textAnchor="middle" fill={n.completed ? '#059669' : (darkBg ? '#e5e2e1' : '#1c1b1b')} fontSize={ir ? 13 : 11} fontWeight={ir ? 700 : 500} fontFamily="Manrope, system-ui, sans-serif">{n.completed ? '✓ ' : ''}{n.name.length > 18 ? n.name.slice(0, 17) + '…' : n.name}</text>
                {n.hint && !ir && <text x={p.x} y={p.y + oz + 29} textAnchor="middle" fill={darkBg ? '#9B99A1' : '#777587'} fontSize={9} fontFamily="Inter, system-ui, sans-serif">{n.hint.length > 28 ? n.hint.slice(0, 27) + '…' : n.hint}</text>}
                {count > 0 && (
                  <g onClick={(e) => { e.stopPropagation(); onToggleCollapse(n.id); }} style={{ cursor: 'pointer' }}>
                    <circle cx={p.x + oz * 0.7} cy={p.y - oz * 0.7} r={9} fill={isCollapsed ? oc : darkBg ? '#27272a' : '#fcf9f8'} stroke={oc} strokeWidth={1.5} />
                    <text x={p.x + oz * 0.7} y={p.y - oz * 0.7 + 1} textAnchor="middle" dominantBaseline="central" fill={isCollapsed ? 'white' : oc} fontSize={9} fontWeight={700} fontFamily="Manrope, system-ui, sans-serif">{count}</text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {/* Zoom controls */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-1.5 z-10">
        <button onClick={() => setZoom((z) => Math.min(3, z * 1.25))} className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition"><ZoomIn size={16} /></button>
        <button onClick={() => setZoom((z) => Math.max(0.15, z * 0.8))} className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition"><ZoomOut size={16} /></button>
        <button onClick={recenter} className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition"><Locate size={16} /></button>
      </div>
      {/* Legend */}
      <div className="absolute bottom-5 right-5 flex gap-3 flex-wrap bg-surface-container-lowest/90 backdrop-blur-sm border border-surface-container-high rounded-full px-4 py-2 z-10">
        {uniqueTypes.map((t) => {
          const s = visibleNodes.find((n) => n.type === t); if (!s) return null;
          const c = getNodeOuterColor(s, settings);
          return <span key={t} className="flex items-center gap-1.5 text-[11px] font-headline text-on-surface-variant"><ShapePreview shape={getNodeOuterShape(s)} color={c} size={12} />{t.charAt(0).toUpperCase() + t.slice(1)}</span>;
        })}
      </div>
      {/* Node count */}
      <div className="absolute bottom-14 right-5 bg-surface-container-lowest/90 backdrop-blur-sm border border-surface-container-high rounded-full px-3 py-1.5 z-10">
        <span className="text-xs font-headline text-on-surface-variant">{visibleNodes.length} {visibleNodes.length === 1 ? 'node' : 'nodes'}{hiddenIds.size > 0 && ` (${hiddenIds.size} hidden)`}</span>
      </div>
    </div>
  );
}
// ─── Map Canvas Page ────────────────────────────────────────────────
export default function MapCanvasPage() {
  const params = useParams();
  const mapId = params.id as string;
  const { user, loading: userLoading } = useUser();
  const { maps, loading: mapsLoading } = useMaps(user?.id);
  const { nodes, loading: nodesLoading, addNode, updateNode, deleteNode } = useNodes(user?.id, mapId);
  const { settings } = useSettings(user?.id);
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingFromId, setAddingFromId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const currentMap = maps.find((m) => m.id === mapId);
  const calculatedPositions = computeRadialLayout(nodes);
  const positions = { ...calculatedPositions, ...localPositions };
  const selectedNode = nodes.find((n) => n.id === selectedId);
  const addingFromNode = nodes.find((n) => n.id === addingFromId);
  const hasRootNode = nodes.length > 0;

  const childCountMap = useMemo(() => {
    const m: Record<string, number> = {};
    nodes.forEach((n) => { if (n.parent_id) m[n.parent_id] = (m[n.parent_id] || 0) + 1; });
    return m;
  }, [nodes]);

  useEffect(() => { setLocalPositions({}); }, [nodes]);

  // ⌘K shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const handleDragNode = useCallback((id: string, x: number, y: number) => {
    setLocalPositions((p) => ({ ...p, [id]: { x, y } }));
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => { updateNode(id, { position_x: x, position_y: y }); }, 500);
  }, [updateNode]);

  const handleResetPosition = useCallback((id: string) => {
    updateNode(id, { position_x: null, position_y: null } as any);
    setLocalPositions((p) => { const n = { ...p }; delete n[id]; return n; });
  }, [updateNode]);

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  const handleExportPdf = useCallback(async () => {
    const svgEl = document.querySelector('.map-canvas-svg') as SVGSVGElement | null;
    if (!svgEl) return;

    // Calculate bounds of all nodes
    const allPos = Object.values(positions);
    if (allPos.length === 0) return;

    const padding = 100;
    const minX = Math.min(...allPos.map((p) => p.x)) - padding;
    const minY = Math.min(...allPos.map((p) => p.y)) - padding;
    const maxX = Math.max(...allPos.map((p) => p.x)) + padding;
    const maxY = Math.max(...allPos.map((p) => p.y)) + padding;
    const width = maxX - minX;
    const height = maxY - minY;

    // Clone SVG and adjust viewBox to fit all nodes
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Remove the grid background
    const defs = clone.querySelector('defs');
    if (defs) defs.remove();
    const bgRect = clone.querySelector('rect');
    if (bgRect) bgRect.setAttribute('fill', settings?.map_bg_color || '#fcf9f8');

    // Adjust the transform group to fit
    const gEl = clone.querySelector('g');
    if (gEl) gEl.setAttribute('transform', `translate(${-minX}, ${-minY})`);

    const { jsPDF } = await import('jspdf');
    const { svg2pdf } = await import('svg2pdf.js');

    const isLandscape = width > height;
    const pdf = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'pt', format: [width, height] });

    // Set background
    const bgColor = settings?.map_bg_color || '#fcf9f8';
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    pdf.setFillColor(r, g, b);
    pdf.rect(0, 0, width, height, 'F');

    // Add a temporary container for the SVG
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.appendChild(clone);
    document.body.appendChild(container);

    try {
      await svg2pdf(clone, pdf, { x: 0, y: 0, width, height });
      pdf.save(`${currentMap?.name || 'map'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      // Fallback: download as SVG
      const svgData = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentMap?.name || 'map'}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      document.body.removeChild(container);
    }
  }, [positions, settings, currentMap]);

  const handleSearchSelect = useCallback((id: string) => {
    const toUncollapse = new Set<string>();
    let cur = nodes.find((n) => n.id === id);
    while (cur?.parent_id) {
      if (collapsedIds.has(cur.parent_id)) toUncollapse.add(cur.parent_id);
      cur = nodes.find((n) => n.id === cur!.parent_id);
    }
    if (toUncollapse.size > 0) setCollapsedIds((prev) => { const next = new Set(prev); toUncollapse.forEach((id) => next.delete(id)); return next; });
    setSelectedId(id);
    setHighlightId(id);
    setTimeout(() => setHighlightId(null), 2500);
  }, [nodes, collapsedIds]);

  if (userLoading || nodesLoading || mapsLoading) return <div className="flex-1 flex items-center justify-center"><NoddicLoader size={48} /></div>;
  if (!user) { router.push('/login'); return null; }
  if (!currentMap) { router.push('/map'); return null; }

  if (!hasRootNode) {
    return (
      <MapOnboarding mapName={currentMap.name} onComplete={async (name) => {
        await addNode({
          parent_id: null, map_id: mapId, name, type: 'user', hint: null, description: null, address: null, relationship: null, meta: {}, position_x: null, position_y: null,
          color: settings?.accent_color || '#3525cd', display_mode: 'abc', shape: 'circle', abc: name.charAt(0).toUpperCase(),
          outer_shape: 'circle', outer_color: settings?.accent_color || '#3525cd', outer_size: 38, outer_solid: true,
          inner_shape: 'circle', inner_color: '#ffffff', inner_size: 16, inner_solid: true, image_url: null, tags: [], completed: false,
        });
      }} />
    );
  }

  const buildNodeData = (data: any) => ({
    parent_id: data.parentId || null, map_id: mapId, name: data.name, type: data.type, hint: data.hint || null,
    description: data.description || null, address: data.address || null, relationship: data.relationship || null,
    meta: {}, position_x: null, position_y: null,
    color: data.outerColor, display_mode: data.displayMode, shape: data.outerShape, abc: data.abc || data.name.charAt(0).toUpperCase(),
    outer_shape: data.outerShape, outer_color: data.outerColor, outer_size: data.outerSize, outer_solid: data.outerSolid,
    inner_shape: data.innerShape, inner_color: data.innerColor, inner_size: data.innerSize, inner_solid: data.innerSolid, image_url: null, tags: data.tags || [], completed: false,
  });

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'calc(100dvh - 64px)' }}>
      <MapCanvas nodes={nodes} positions={positions} selectedId={selectedId} highlightId={highlightId} settings={settings} dragEnabled={dragEnabled} collapsedIds={collapsedIds} childCountMap={childCountMap} onSelectNode={setSelectedId} onDragNode={handleDragNode} onToggleCollapse={handleToggleCollapse} />

      {/* Toolbar — single row */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <button onClick={() => router.push('/map')} className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-headline font-semibold border shadow-sm bg-surface-container-lowest border-surface-container-high text-on-surface-variant hover:text-primary transition-all">
          <ChevronLeft size={15} />
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-surface-container-lowest/90 border border-surface-container-high shadow-sm">
          <span className="text-base sm:text-lg">{currentMap.emoji}</span>
          <span className="font-headline font-bold text-xs sm:text-sm text-on-surface truncate max-w-[100px] sm:max-w-none">{currentMap.name}</span>
        </div>
        <div className="w-px h-6 bg-surface-container-high hidden sm:block" />
        <button onClick={() => setDragEnabled(!dragEnabled)} className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-headline font-semibold border shadow-sm transition-all ${dragEnabled ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface-container-lowest border-surface-container-high text-on-surface-variant hover:text-primary'}`}>
          {dragEnabled ? <Unlock size={15} /> : <Lock size={15} />}
          <span className="hidden sm:inline">{dragEnabled ? 'Moving' : 'Move'}</span>
        </button>
        <button onClick={() => setQuickAddOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-headline font-semibold border shadow-sm bg-surface-container-lowest border-surface-container-high text-on-surface-variant hover:text-primary transition-all">
          <Plus size={15} />
          <span className="hidden sm:inline">Add</span>
        </button>
        <button onClick={() => setSearchOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-headline font-semibold border shadow-sm bg-surface-container-lowest border-surface-container-high text-on-surface-variant hover:text-primary transition-all">
          <Search size={15} />
        </button>
        <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-headline font-semibold border shadow-sm bg-surface-container-lowest border-surface-container-high text-on-surface-variant hover:text-primary transition-all">
          <Download size={15} />
        </button>
      </div>

      {/* Panels & Modals */}
      {selectedNode && !addingFromId && <NodePanel node={selectedNode} nodes={nodes} settings={settings} userId={user.id} onUpdate={(id, d) => updateNode(id, d)} onDelete={(id) => { deleteNode(id); setSelectedId(null); }} onAddChild={(pid) => setAddingFromId(pid)} onResetPosition={handleResetPosition} onToggleCollapse={handleToggleCollapse} onClose={() => setSelectedId(null)} />}
      {addingFromNode && <AddNodeModal parentNode={addingFromNode} settings={settings} onAdd={async (data) => { const r = await addNode(buildNodeData({ ...data, parentId: addingFromNode.id })); setAddingFromId(null); if (r?.data) setSelectedId(r.data.id); }} onClose={() => setAddingFromId(null)} />}
      {quickAddOpen && <QuickAddModal nodes={nodes} settings={settings} onAdd={async (data) => { const r = await addNode(buildNodeData(data)); setQuickAddOpen(false); if (r?.data) setSelectedId(r.data.id); }} onClose={() => setQuickAddOpen(false)} />}
      <SearchOverlay nodes={nodes} settings={settings} open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSearchSelect} />
    </div>
  );
}
