'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useNodes, useSettings } from '@/lib/hooks';
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
import { Plus, X, ChevronRight, Pencil, Trash2, ZoomIn, ZoomOut, Locate, Lock, Unlock, Palette, Search, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Shape Path Generator ───────────────────────────────────────────
function shapeElement(cx: number, cy: number, r: number, shape: string, fill: string, stroke: string, strokeWidth: number, solid: boolean) {
  const f = solid ? fill : '#fcf9f8';
  const s = solid ? 'none' : stroke;
  const sw = solid ? 0 : strokeWidth;
  const props = { fill: f, stroke: s, strokeWidth: sw };
  switch (shape) {
    case 'square': return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={r * 0.22} {...props} />;
    case 'diamond': return <polygon points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} {...props} />;
    case 'triangle': return <polygon points={`${cx},${cy - r} ${cx + r * 0.866},${cy + r * 0.5} ${cx - r * 0.866},${cy + r * 0.5}`} {...props} />;
    case 'hexagon': { const pts = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' '); return <polygon points={pts} {...props} />; }
    case 'star': { const pts = Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const rd = i % 2 === 0 ? r : r * 0.45; return `${cx + rd * Math.cos(a)},${cy + rd * Math.sin(a)}`; }).join(' '); return <polygon points={pts} {...props} />; }
    case 'pentagon': { const pts = Array.from({ length: 5 }, (_, i) => { const a = (Math.PI * 2 / 5) * i - Math.PI / 2; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' '); return <polygon points={pts} {...props} />; }
    case 'octagon': { const pts = Array.from({ length: 8 }, (_, i) => { const a = (Math.PI / 4) * i - Math.PI / 8; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' '); return <polygon points={pts} {...props} />; }
    default: return <circle cx={cx} cy={cy} r={r} {...props} />;
  }
}

function renderNode(cx: number, cy: number, outerShape: string, outerColor: string, outerSize: number, outerSolid: boolean, displayMode: 'shape' | 'abc', innerShape: string, innerColor: string, innerSize: number, innerSolid: boolean, abc: string, isSelected: boolean) {
  return (
    <>
      {shapeElement(cx, cy, outerSize, outerShape, outerColor, outerColor, isSelected ? 2.5 : 1.8, outerSolid)}
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
      <div className="bg-surface-container rounded-xl p-3 space-y-2">
        <label className={sL}>Outer Shape</label>
        <ShapePicker value={outerShape} onChange={setOuterShape} color={outerColor} />
        <div><label className={subL}>Colour</label><ColorPicker value={outerColor} onChange={setOuterColor} /></div>
        <div className="flex gap-4 items-center">
          <div className="flex-1"><label className={subL}>Size ({outerSize}px)</label><input type="range" min={16} max={50} value={outerSize} onChange={(e) => setOuterSize(Number(e.target.value))} className="w-full" style={{ accentColor: outerColor }} /></div>
          <div><label className={subL}>Fill</label><div className="flex gap-1"><button onClick={() => setOuterSolid(false)} className="px-2.5 py-1 rounded-lg text-[10px] font-headline font-semibold border transition-all" style={{ borderColor: !outerSolid ? outerColor : '#e5e2e1', background: !outerSolid ? outerColor + '15' : 'transparent', color: !outerSolid ? outerColor : '#777' }}>Outline</button><button onClick={() => setOuterSolid(true)} className="px-2.5 py-1 rounded-lg text-[10px] font-headline font-semibold border transition-all" style={{ borderColor: outerSolid ? outerColor : '#e5e2e1', background: outerSolid ? outerColor + '15' : 'transparent', color: outerSolid ? outerColor : '#777' }}>Solid</button></div></div>
        </div>
      </div>
      <div className="bg-surface-container rounded-xl p-3 space-y-2">
        {displayMode === 'shape' ? (<><label className={sL}>Inner Shape</label><ShapePicker value={innerShape} onChange={setInnerShape} color={innerColor} /><div><label className={subL}>Colour</label><ColorPicker value={innerColor} onChange={setInnerColor} /></div><div className="flex gap-4 items-center"><div className="flex-1"><label className={subL}>Size ({innerSize}px)</label><input type="range" min={2} max={Math.floor(outerSize * 0.7)} value={innerSize} onChange={(e) => setInnerSize(Number(e.target.value))} className="w-full" style={{ accentColor: innerColor }} /></div><div><label className={subL}>Fill</label><div className="flex gap-1"><button onClick={() => setInnerSolid(false)} className="px-2.5 py-1 rounded-lg text-[10px] font-headline font-semibold border transition-all" style={{ borderColor: !innerSolid ? innerColor : '#e5e2e1', background: !innerSolid ? innerColor + '15' : 'transparent', color: !innerSolid ? innerColor : '#777' }}>Outline</button><button onClick={() => setInnerSolid(true)} className="px-2.5 py-1 rounded-lg text-[10px] font-headline font-semibold border transition-all" style={{ borderColor: innerSolid ? innerColor : '#e5e2e1', background: innerSolid ? innerColor + '15' : 'transparent', color: innerSolid ? innerColor : '#777' }}>Solid</button></div></div></div></>) : (<><label className={sL}>Characters (max 2)</label><input value={abc} onChange={(e) => setAbc(e.target.value.slice(0, 2).toUpperCase())} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-headline font-bold text-center text-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition tracking-wider" placeholder="AB" maxLength={2} /><div><label className={subL}>Text Colour</label><ColorPicker value={innerColor} onChange={setInnerColor} /></div><div><label className={subL}>Text Size ({innerSize}px)</label><input type="range" min={8} max={Math.floor(outerSize * 0.8)} value={innerSize} onChange={(e) => setInnerSize(Number(e.target.value))} className="w-full" style={{ accentColor: innerColor }} /></div></>)}
      </div>
      <div><label className={sL}>Preview</label><div className="bg-[#f6f3f2] rounded-xl p-4 flex items-center justify-center"><svg width="100" height="100" viewBox="0 0 100 100">{renderNode(50, 50, outerShape, outerColor, outerSize, outerSolid, displayMode, innerShape, innerColor, innerSize, innerSolid, abc || '?', false)}</svg></div></div>
    </div>
  );
}

// ─── Onboarding ─────────────────────────────────────────────────────
function Onboarding({ onComplete }: { onComplete: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-sm page-enter text-center">
        <div className="mb-6"><svg viewBox="0 0 80 80" className="w-16 h-16 mx-auto mb-4"><circle cx="40" cy="40" r="34" fill="none" stroke="#3525cd" strokeWidth="2" /><circle cx="40" cy="40" r="7" fill="#3525cd" /><circle cx="18" cy="28" r="4" fill="#4ECDC4" opacity="0.7" /><circle cx="62" cy="28" r="4" fill="#FF6B6B" opacity="0.7" /><circle cx="26" cy="60" r="4" fill="#4f46e5" opacity="0.7" /><line x1="40" y1="40" x2="18" y2="28" stroke="#4ECDC4" strokeWidth="1" opacity="0.3" /><line x1="40" y1="40" x2="62" y2="28" stroke="#FF6B6B" strokeWidth="1" opacity="0.3" /><line x1="40" y1="40" x2="26" y2="60" stroke="#4f46e5" strokeWidth="1" opacity="0.3" /></svg></div>
        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-2">Let&apos;s set up your map</h2>
        <p className="text-on-surface-variant text-sm mb-8">You&apos;ll be the center node. What should we call you?</p>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && onComplete(name.trim())} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition mb-4" placeholder="Your name" autoFocus />
        <button onClick={() => name.trim() && onComplete(name.trim())} disabled={!name.trim()} className="w-full silk-gradient text-white py-3 rounded-xl font-headline font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-40">Create My Map</button>
      </div>
    </div>
  );
}

// ─── Shared Form Hook ───────────────────────────────────────────────
interface NodeFormState { type: string; displayMode: 'shape' | 'abc'; outerShape: string; outerColor: string; outerSize: number; outerSolid: boolean; innerShape: string; innerColor: string; innerSize: number; innerSolid: boolean; abc: string; }
function useNodeForm(initial: NodeFormState) {
  const [customMode, setCustomMode] = useState(false);
  const [form, setForm] = useState(initial);
  const selectPreset = (p: typeof NODE_PRESETS[0]) => { setForm({ ...form, type: p.type, displayMode: p.display_mode, outerShape: p.outer_shape, outerColor: p.outer_color, outerSize: p.outer_size, outerSolid: p.outer_solid, innerShape: p.inner_shape, innerColor: p.inner_color, innerSize: p.inner_size, innerSolid: p.inner_solid }); setCustomMode(false); };
  return { form, setForm, customMode, setCustomMode, selectPreset };
}

function TypePickerSection({ form, setForm, customMode, setCustomMode, selectPreset }: ReturnType<typeof useNodeForm>) {
  return (
    <>
      <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Mode</label><div className="flex gap-2"><button onClick={() => setCustomMode(false)} className="flex-1 py-2.5 px-3 rounded-xl text-xs font-headline font-semibold border-2 transition-all" style={{ borderColor: !customMode ? form.outerColor : 'transparent', background: !customMode ? form.outerColor + '15' : '#f0edec', color: !customMode ? form.outerColor : '#464555' }}>Presets</button><button onClick={() => setCustomMode(true)} className="flex-1 py-2.5 px-3 rounded-xl text-xs font-headline font-semibold border-2 transition-all flex items-center justify-center gap-1.5" style={{ borderColor: customMode ? form.outerColor : 'transparent', background: customMode ? form.outerColor + '15' : '#f0edec', color: customMode ? form.outerColor : '#464555' }}><Palette size={13} /> Custom</button></div></div>
      {!customMode && (<div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Type</label><div className="flex flex-wrap gap-2">{NODE_PRESETS.map((p) => (<button key={p.type} onClick={() => selectPreset(p)} className="py-2 px-3 rounded-xl text-xs font-headline font-semibold border-2 transition-all flex items-center gap-1.5" style={{ borderColor: form.type === p.type && !customMode ? p.outer_color : 'transparent', background: form.type === p.type && !customMode ? p.outer_color + '15' : '#f0edec', color: form.type === p.type && !customMode ? p.outer_color : '#464555' }}><ShapePreview shape={p.outer_shape} color={form.type === p.type ? p.outer_color : '#999'} size={16} /> {p.label}</button>))}</div></div>)}
      {customMode && (<><div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Type name</label><input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value.toLowerCase() })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="e.g. skill, tool, recipe" /></div><NodeAppearanceEditor displayMode={form.displayMode} setDisplayMode={(v) => setForm({ ...form, displayMode: v })} outerShape={form.outerShape} setOuterShape={(v) => setForm({ ...form, outerShape: v })} outerColor={form.outerColor} setOuterColor={(v) => setForm({ ...form, outerColor: v })} outerSize={form.outerSize} setOuterSize={(v) => setForm({ ...form, outerSize: v })} outerSolid={form.outerSolid} setOuterSolid={(v) => setForm({ ...form, outerSolid: v })} innerShape={form.innerShape} setInnerShape={(v) => setForm({ ...form, innerShape: v })} innerColor={form.innerColor} setInnerColor={(v) => setForm({ ...form, innerColor: v })} innerSize={form.innerSize} setInnerSize={(v) => setForm({ ...form, innerSize: v })} innerSolid={form.innerSolid} setInnerSolid={(v) => setForm({ ...form, innerSolid: v })} abc={form.abc} setAbc={(v) => setForm({ ...form, abc: v })} /></>)}
    </>
  );
}

// ─── Add Node Modal ─────────────────────────────────────────────────
function AddNodeModal({ parentNode, settings, onAdd, onClose }: { parentNode: MapNode; settings: UserSettings | null; onAdd: (data: any) => void; onClose: () => void }) {
  const dp = NODE_PRESETS[0];
  const nf = useNodeForm({ type: dp.type, displayMode: dp.display_mode, outerShape: dp.outer_shape, outerColor: dp.outer_color, outerSize: dp.outer_size, outerSolid: dp.outer_solid, innerShape: dp.inner_shape, innerColor: dp.inner_color, innerSize: dp.inner_size, innerSolid: dp.inner_solid, abc: '' });
  const [name, setName] = useState(''); const [hint, setHint] = useState(''); const [description, setDescription] = useState(''); const [address, setAddress] = useState(''); const [relationship, setRelationship] = useState('');
  const parentColor = getNodeOuterColor(parentNode, settings);
  useEffect(() => { if (!nf.form.abc || nf.form.abc.length <= 1) nf.setForm({ ...nf.form, abc: name.charAt(0).toUpperCase() || '' }); }, [name]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto custom-scrollbar animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-surface-container"><h3 className="font-headline font-bold text-lg text-on-surface">Add from <span style={{ color: parentColor }}>{parentNode.name}</span></h3><button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <TypePickerSection {...nf} />
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Node name" autoFocus /></div>
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Hint</label><input value={hint} onChange={(e) => setHint(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Memory trigger (optional)" /></div>
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition resize-y min-h-[60px]" placeholder="Optional details" /></div>
          {nf.form.type === 'place' && <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Address" /></div>}
          {nf.form.type === 'person' && <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Relationship</label><input value={relationship} onChange={(e) => setRelationship(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="e.g. Friend, colleague" /></div>}
        </div>
        <div className="flex gap-3 p-5 border-t border-surface-container"><button onClick={onClose} className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition">Cancel</button><button onClick={() => { if (!name.trim()) return; onAdd({ name: name.trim(), type: nf.form.type, hint: hint || null, description: description || null, address: address || null, relationship: relationship || null, ...nf.form, abc: nf.form.abc || name.charAt(0).toUpperCase() }); }} disabled={!name.trim()} className="flex-1 text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${nf.form.outerColor}, ${nf.form.outerColor}dd)` }}>Add</button></div>
      </div>
    </div>
  );
}

// ─── Quick Add Modal ────────────────────────────────────────────────
function QuickAddModal({ nodes, settings, onAdd, onClose }: { nodes: MapNode[]; settings: UserSettings | null; onAdd: (data: any) => void; onClose: () => void }) {
  const dp = NODE_PRESETS[0];
  const nf = useNodeForm({ type: dp.type, displayMode: dp.display_mode, outerShape: dp.outer_shape, outerColor: dp.outer_color, outerSize: dp.outer_size, outerSolid: dp.outer_solid, innerShape: dp.inner_shape, innerColor: dp.inner_color, innerSize: dp.inner_size, innerSolid: dp.inner_solid, abc: '' });
  const [parentId, setParentId] = useState(nodes.find((n) => n.type === 'user')?.id || ''); const [name, setName] = useState(''); const [hint, setHint] = useState(''); const [search, setSearch] = useState('');
  const filteredNodes = search.trim() ? nodes.filter((n) => n.name.toLowerCase().includes(search.toLowerCase())) : nodes;
  const selectedParent = nodes.find((n) => n.id === parentId);
  useEffect(() => { if (!nf.form.abc || nf.form.abc.length <= 1) nf.setForm({ ...nf.form, abc: name.charAt(0).toUpperCase() || '' }); }, [name]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto custom-scrollbar animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-surface-container"><h3 className="font-headline font-bold text-lg text-on-surface">Quick Add</h3><button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Add to</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition mb-2" placeholder="Search nodes…" />
            <div className="max-h-[120px] overflow-y-auto custom-scrollbar border border-outline-variant rounded-xl">{filteredNodes.map((n) => { const nc = getNodeOuterColor(n, settings); return <button key={n.id} onClick={() => { setParentId(n.id); setSearch(''); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${parentId === n.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container text-on-surface'}`}><ShapePreview shape={getNodeOuterShape(n)} color={nc} size={14} /><span className="font-headline font-medium truncate">{n.name}</span>{parentId === n.id && <span className="ml-auto text-xs">✓</span>}</button>; })}</div>
            {selectedParent && <p className="text-xs text-on-surface-variant mt-1.5">Adding to <span style={{ color: getNodeOuterColor(selectedParent, settings) }} className="font-semibold">{selectedParent.name}</span></p>}
          </div>
          <TypePickerSection {...nf} />
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Node name" /></div>
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Hint</label><input value={hint} onChange={(e) => setHint(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Memory trigger (optional)" /></div>
        </div>
        <div className="flex gap-3 p-5 border-t border-surface-container"><button onClick={onClose} className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition">Cancel</button><button onClick={() => { if (!name.trim() || !parentId) return; onAdd({ parentId, name: name.trim(), type: nf.form.type, hint: hint || null, ...nf.form, abc: nf.form.abc || name.charAt(0).toUpperCase() }); }} disabled={!name.trim() || !parentId} className="flex-1 text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${nf.form.outerColor}, ${nf.form.outerColor}dd)` }}>Add</button></div>
      </div>
    </div>
  );
}

// ─── Node Detail Panel ──────────────────────────────────────────────
function NodePanel({ node, nodes, settings, onUpdate, onDelete, onAddChild, onResetPosition, onToggleCollapse, onClose }: { node: MapNode; nodes: MapNode[]; settings: UserSettings | null; onUpdate: (id: string, data: Partial<MapNode>) => void; onDelete: (id: string) => void; onAddChild: (parentId: string) => void; onResetPosition: (id: string) => void; onToggleCollapse: (id: string) => void; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: node.name, hint: node.hint || '', description: node.description || '', address: node.address || '', relationship: node.relationship || '' });
  const isRoot = node.type === 'user';
  const nf = useNodeForm({ type: node.type, displayMode: getNodeDisplayMode(node), outerShape: getNodeOuterShape(node), outerColor: getNodeOuterColor(node, settings), outerSize: getNodeOuterSize(node, isRoot), outerSolid: getNodeOuterSolid(node, isRoot), innerShape: getNodeInnerShape(node), innerColor: getNodeInnerColor(node, settings), innerSize: getNodeInnerSize(node, isRoot), innerSolid: getNodeInnerSolid(node), abc: getNodeAbc(node) });
  const nodeColor = getNodeOuterColor(node, settings);
  const children = nodes.filter((n) => n.parent_id === node.id);
  const parent = nodes.find((n) => n.id === node.parent_id);
  const hasCustomPosition = node.position_x != null && node.position_y != null;

  useEffect(() => { setForm({ name: node.name, hint: node.hint || '', description: node.description || '', address: node.address || '', relationship: node.relationship || '' }); setEditing(false); const ir = node.type === 'user'; nf.setForm({ type: node.type, displayMode: getNodeDisplayMode(node), outerShape: getNodeOuterShape(node), outerColor: getNodeOuterColor(node, settings), outerSize: getNodeOuterSize(node, ir), outerSolid: getNodeOuterSolid(node, ir), innerShape: getNodeInnerShape(node), innerColor: getNodeInnerColor(node, settings), innerSize: getNodeInnerSize(node, ir), innerSolid: getNodeInnerSolid(node), abc: getNodeAbc(node) }); nf.setCustomMode(false); }, [node, settings]);

  const handleSave = () => { onUpdate(node.id, { name: form.name, type: nf.form.type, hint: form.hint || null, description: form.description || null, address: form.address || null, relationship: form.relationship || null, display_mode: nf.form.displayMode, outer_shape: nf.form.outerShape, outer_color: nf.form.outerColor, outer_size: nf.form.outerSize, outer_solid: nf.form.outerSolid, inner_shape: nf.form.innerShape, inner_color: nf.form.innerColor, inner_size: nf.form.innerSize, inner_solid: nf.form.innerSolid, abc: nf.form.abc, color: nf.form.outerColor, shape: nf.form.outerShape }); setEditing(false); };

  const detailRows = [{ label: 'Type', value: node.type.charAt(0).toUpperCase() + node.type.slice(1) }, { label: 'Hint', value: node.hint }, { label: 'Description', value: node.description }, { label: 'Address', value: node.address }, { label: 'Relationship', value: node.relationship }];

  return (
    <div className="absolute top-0 right-0 w-[380px] max-w-[90vw] h-full bg-surface-container-lowest border-l border-surface-container-high z-40 flex flex-col animate-slide-right shadow-2xl">
      <div className="flex items-center justify-between p-5 border-b border-surface-container">
        <div className="flex items-center gap-3"><span className="inline-flex items-center gap-1.5 text-xs font-headline font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: nodeColor + '18', color: nodeColor }}><ShapePreview shape={getNodeOuterShape(node)} color={nodeColor} size={14} /> {node.type}</span>{parent && <span className="text-xs text-on-surface-variant flex items-center gap-1"><ChevronRight size={12} /> {parent.name}</span>}</div>
        <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {!editing ? (<>
          <div className="flex items-center gap-3 mb-5"><svg width="52" height="52" viewBox="0 0 52 52">{renderNode(26, 26, getNodeOuterShape(node), getNodeOuterColor(node, settings), Math.min(getNodeOuterSize(node, isRoot), 22), getNodeOuterSolid(node, isRoot), getNodeDisplayMode(node), getNodeInnerShape(node), getNodeInnerColor(node, settings), Math.min(getNodeInnerSize(node, isRoot), 10), getNodeInnerSolid(node), getNodeAbc(node), false)}</svg><h2 className="font-headline font-extrabold text-2xl text-on-surface">{node.name}</h2></div>
          {detailRows.filter((r) => r.value).map((r) => (<div key={r.label} className="mb-4"><span className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{r.label}</span><p className="text-on-surface text-sm leading-relaxed">{r.value}</p></div>))}
          {children.length > 0 && (<div className="mt-6"><span className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Connections ({children.length})</span><div className="flex flex-wrap gap-2">{children.map((c) => { const cc = getNodeOuterColor(c, settings); return <span key={c.id} className="inline-flex items-center gap-1.5 text-xs font-headline font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: cc + '40', color: cc }}><ShapePreview shape={getNodeOuterShape(c)} color={cc} size={12} /> {c.name}</span>; })}</div></div>)}
        </>) : (<div className="space-y-4">
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" /></div>
          <TypePickerSection {...nf} />
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Hint</label><input value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Memory trigger" /></div>
          <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition resize-y min-h-[60px]" placeholder="Notes" /></div>
          {(nf.form.type === 'place' || node.type === 'place') && <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="Address" /></div>}
          {(nf.form.type === 'person' || node.type === 'person') && <div><label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Relationship</label><input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="e.g. Friend" /></div>}
        </div>)}
      </div>
      <div className="flex-shrink-0 p-5 border-t border-surface-container space-y-2">
        {!editing ? (<>
          <button onClick={() => onAddChild(node.id)} className="w-full text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${nodeColor}, ${nodeColor}dd)` }}><Plus size={16} /> Add from {node.name}</button>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="flex-1 py-2.5 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition flex items-center justify-center gap-2"><Pencil size={14} /> Edit</button>
            {children.length > 0 && <button onClick={() => onToggleCollapse(node.id)} className="py-2.5 px-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition flex items-center justify-center" title="Collapse/expand branch"><ChevronDown size={14} /></button>}
            {hasCustomPosition && <button onClick={() => onResetPosition(node.id)} className="py-2.5 px-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition flex items-center justify-center" title="Reset position"><Locate size={14} /></button>}
            {!isRoot && <button onClick={() => { if (window.confirm(`Delete "${node.name}" and all its connections?`)) onDelete(node.id); }} className="py-2.5 px-4 rounded-xl font-headline font-semibold text-sm border border-error/20 text-error hover:bg-error/5 transition flex items-center justify-center gap-2"><Trash2 size={14} /></button>}
          </div>
        </>) : (<div className="flex gap-2"><button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition">Cancel</button><button onClick={handleSave} className="flex-1 text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${nf.form.outerColor}, ${nf.form.outerColor}dd)` }}>Save</button></div>)}
      </div>
    </div>
  );
}

// ─── Search Bar ─────────────────────────────────────────────────────
function SearchBar({ nodes, settings, onSelect }: { nodes: MapNode[]; settings: UserSettings | null; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return nodes.filter((n) =>
      n.name.toLowerCase().includes(q) ||
      (n.hint && n.hint.toLowerCase().includes(q)) ||
      (n.description && n.description.toLowerCase().includes(q)) ||
      n.type.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, nodes]);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); } if (e.key === 'Escape') { setOpen(false); setQuery(''); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-headline font-semibold border shadow-sm bg-surface-container-lowest border-surface-container-high text-on-surface-variant hover:text-primary transition-all">
        <Search size={15} /> <span className="hidden sm:inline">Search</span> <kbd className="hidden sm:inline text-[10px] bg-surface-container px-1.5 py-0.5 rounded font-mono text-on-surface-variant/60">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/20 backdrop-blur-sm" onClick={() => { setOpen(false); setQuery(''); }}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-lg mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-container">
          <Search size={18} className="text-on-surface-variant flex-shrink-0" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 bg-transparent text-on-surface font-body text-base focus:outline-none" placeholder="Search nodes by name, hint, type…" />
          {query && <button onClick={() => setQuery('')} className="text-on-surface-variant/40 hover:text-on-surface transition"><X size={16} /></button>}
          <kbd className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded font-mono text-on-surface-variant/50">ESC</kbd>
        </div>
        {query.trim() && (
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {results.length > 0 ? results.map((n) => {
              const nc = getNodeOuterColor(n, settings);
              return (
                <button key={n.id} onClick={() => { onSelect(n.id); setOpen(false); setQuery(''); }} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-surface-container transition-colors">
                  <ShapePreview shape={getNodeOuterShape(n)} color={nc} size={20} solid={getNodeOuterSolid(n, n.type === 'user')} />
                  <div className="flex-1 min-w-0">
                    <p className="font-headline font-semibold text-sm text-on-surface truncate">{n.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {n.type.charAt(0).toUpperCase() + n.type.slice(1)}
                      {n.hint && ` · ${n.hint}`}
                    </p>
                  </div>
                  <span style={{ color: nc }} className="text-xs font-headline">→</span>
                </button>
              );
            }) : (
              <div className="px-5 py-8 text-center text-on-surface-variant text-sm">No nodes found for &quot;{query}&quot;</div>
            )}
          </div>
        )}
        {!query.trim() && (
          <div className="px-5 py-6 text-center text-on-surface-variant/60 text-sm">Start typing to search across all nodes</div>
        )}
      </div>
    </div>
  );
}

// ─── SVG Canvas ─────────────────────────────────────────────────────
function MapCanvas({ nodes, positions, selectedId, highlightId, settings, dragEnabled, collapsedIds, childCountMap, onSelectNode, onDragNode, onToggleCollapse }: { nodes: MapNode[]; positions: Record<string, { x: number; y: number }>; selectedId: string | null; highlightId: string | null; settings: UserSettings | null; dragEnabled: boolean; collapsedIds: Set<string>; childCountMap: Record<string, number>; onSelectNode: (id: string | null) => void; onDragNode: (id: string, x: number, y: number) => void; onToggleCollapse: (id: string) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [draggingCanvas, setDraggingCanvas] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 }); const panStart = useRef({ x: 0, y: 0 }); const nodeStartPos = useRef({ x: 0, y: 0 }); const didDrag = useRef(false);

  useEffect(() => { if (svgRef.current) { const r = svgRef.current.getBoundingClientRect(); setPan({ x: r.width / 2, y: r.height / 2 }); } }, []);
  const handleWheel = useCallback((e: WheelEvent) => { e.preventDefault(); setZoom((z) => Math.max(0.15, Math.min(3, z * (e.deltaY > 0 ? 0.92 : 1.08)))); }, []);
  useEffect(() => { const el = svgRef.current; if (el) { el.addEventListener('wheel', handleWheel, { passive: false }); return () => el.removeEventListener('wheel', handleWheel); } }, [handleWheel]);

  // Pan to highlighted node
  useEffect(() => {
    if (highlightId && positions[highlightId] && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const pos = positions[highlightId];
      setPan({ x: rect.width / 2 - pos.x * zoom, y: rect.height / 2 - pos.y * zoom });
      setZoom((z) => Math.max(z, 1));
    }
  }, [highlightId]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => { if ('touches' in e && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY }; if ('clientX' in e) return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY }; return { x: 0, y: 0 }; };
  const onDown = (e: React.MouseEvent | React.TouchEvent) => { const t = e.target as HTMLElement; const nel = t.closest('[data-node-id]'); if (nel && dragEnabled) { const nid = nel.getAttribute('data-node-id')!; const p = getPos(e); const np = positions[nid]; if (np) { setDraggingNodeId(nid); dragStart.current = p; nodeStartPos.current = { x: np.x, y: np.y }; didDrag.current = false; e.preventDefault(); return; } } setDraggingCanvas(true); const p = getPos(e); dragStart.current = p; panStart.current = pan; };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => { const p = getPos(e); if (draggingNodeId) { const dx = (p.x - dragStart.current.x) / zoom; const dy = (p.y - dragStart.current.y) / zoom; if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true; onDragNode(draggingNodeId, nodeStartPos.current.x + dx, nodeStartPos.current.y + dy); return; } if (draggingCanvas) setPan({ x: panStart.current.x + (p.x - dragStart.current.x), y: panStart.current.y + (p.y - dragStart.current.y) }); };
  const onUp = () => { if (draggingNodeId) { if (!didDrag.current) onSelectNode(draggingNodeId === selectedId ? null : draggingNodeId); setDraggingNodeId(null); return; } setDraggingCanvas(false); };
  const onClick = (e: React.MouseEvent, id: string) => { if (dragEnabled) return; e.stopPropagation(); onSelectNode(id === selectedId ? null : id); };
  const recenter = () => { if (svgRef.current) { const r = svgRef.current.getBoundingClientRect(); setPan({ x: r.width / 2, y: r.height / 2 }); setZoom(1); } };

  // Filter out hidden (collapsed) nodes
  const hiddenIds = useMemo(() => {
    const hidden = new Set<string>();
    const hideChildren = (parentId: string) => {
      nodes.filter((n) => n.parent_id === parentId).forEach((n) => { hidden.add(n.id); hideChildren(n.id); });
    };
    collapsedIds.forEach((id) => hideChildren(id));
    return hidden;
  }, [collapsedIds, nodes]);

  const visibleNodes = nodes.filter((n) => !hiddenIds.has(n.id));
  const uniqueTypes = Array.from(new Set(visibleNodes.map((n) => n.type)));
  const isHighlighting = highlightId !== null;

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" style={{ cursor: draggingNodeId || draggingCanvas ? 'grabbing' : 'grab' }} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}><circle cx="20" cy="20" r="0.8" fill="#c7c4d8" opacity="0.3" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {visibleNodes.filter((n) => n.parent_id && positions[n.id] && positions[n.parent_id] && !hiddenIds.has(n.id)).map((n) => {
            const f = positions[n.parent_id!]; const t = positions[n.id]; const c = getNodeOuterColor(n, settings);
            const dimmed = isHighlighting && n.id !== highlightId && n.parent_id !== highlightId;
            return <line key={`e-${n.id}`} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke={c} strokeWidth={1.5} opacity={dimmed ? 0.08 : 0.25} />;
          })}
          {/* Nodes */}
          {visibleNodes.map((n) => {
            const p = positions[n.id]; if (!p) return null;
            const ir = n.type === 'user';
            const oc = getNodeOuterColor(n, settings); const ic = getNodeInnerColor(n, settings);
            const os = getNodeOuterShape(n); const is2 = getNodeInnerShape(n);
            const oz = getNodeOuterSize(n, ir); const iz = getNodeInnerSize(n, ir);
            const oSolid = getNodeOuterSolid(n, ir); const iSolid = getNodeInnerSolid(n);
            const dm = getNodeDisplayMode(n); const ab = getNodeAbc(n);
            const isSel = selectedId === n.id; const isDrag = draggingNodeId === n.id;
            const isHL = highlightId === n.id;
            const dimmed = isHighlighting && !isHL;
            const count = childCountMap[n.id] || 0;
            const isCollapsed = collapsedIds.has(n.id);

            return (
              <g key={n.id} data-node-id={n.id} style={{ cursor: dragEnabled ? (isDrag ? 'grabbing' : 'grab') : 'pointer', opacity: dimmed ? 0.2 : 1, transition: 'opacity 0.3s' }} onClick={(e) => onClick(e, n.id)}>
                {isSel && <circle cx={p.x} cy={p.y} r={oz + 10} fill={oc} opacity={0.1} />}
                {isHL && <circle cx={p.x} cy={p.y} r={oz + 12} fill={oc} opacity={0.15}><animate attributeName="r" values={`${oz + 10};${oz + 16};${oz + 10}`} dur="1.5s" repeatCount="indefinite" /></circle>}
                {isDrag && <circle cx={p.x} cy={p.y} r={oz + 6} fill={oc} opacity={0.08} stroke={oc} strokeWidth={1} strokeDasharray="4 3" />}
                {renderNode(p.x, p.y, os, oc, oz, oSolid, dm, is2, ic, iz, iSolid, ab, isSel)}
                {/* Node name */}
                <text x={p.x} y={p.y + oz + 16} textAnchor="middle" fill="#1c1b1b" fontSize={ir ? 13 : 11} fontWeight={ir ? 700 : 500} fontFamily="Manrope, system-ui, sans-serif">{n.name.length > 18 ? n.name.slice(0, 17) + '…' : n.name}</text>
                {n.hint && !ir && <text x={p.x} y={p.y + oz + 29} textAnchor="middle" fill="#777587" fontSize={9} fontFamily="Inter, system-ui, sans-serif">{n.hint.length > 28 ? n.hint.slice(0, 27) + '…' : n.hint}</text>}
                {/* Child count badge */}
                {count > 0 && (
                  <g onClick={(e) => { e.stopPropagation(); onToggleCollapse(n.id); }} style={{ cursor: 'pointer' }}>
                    <circle cx={p.x + oz * 0.7} cy={p.y - oz * 0.7} r={9} fill={isCollapsed ? oc : '#fcf9f8'} stroke={oc} strokeWidth={1.5} />
                    <text x={p.x + oz * 0.7} y={p.y - oz * 0.7 + 1} textAnchor="middle" dominantBaseline="central" fill={isCollapsed ? 'white' : oc} fontSize={9} fontWeight={700} fontFamily="Manrope, system-ui, sans-serif">{count}</text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <div className="absolute bottom-5 left-5 flex flex-col gap-1.5 z-10">
        <button onClick={() => setZoom((z) => Math.min(3, z * 1.25))} className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition"><ZoomIn size={16} /></button>
        <button onClick={() => setZoom((z) => Math.max(0.15, z * 0.8))} className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition"><ZoomOut size={16} /></button>
        <button onClick={recenter} className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition"><Locate size={16} /></button>
      </div>
      <div className="absolute bottom-5 right-5 flex gap-3 flex-wrap bg-surface-container-lowest/90 backdrop-blur-sm border border-surface-container-high rounded-full px-4 py-2 z-10">
        {uniqueTypes.map((t) => { const s = visibleNodes.find((n) => n.type === t); if (!s) return null; const c = getNodeOuterColor(s, settings); return <span key={t} className="flex items-center gap-1.5 text-[11px] font-headline text-on-surface-variant"><ShapePreview shape={getNodeOuterShape(s)} color={c} size={12} />{t.charAt(0).toUpperCase() + t.slice(1)}</span>; })}
      </div>
      <div className="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-sm border border-surface-container-high rounded-full px-3 py-1.5 z-10"><span className="text-xs font-headline text-on-surface-variant">{visibleNodes.length} {visibleNodes.length === 1 ? 'node' : 'nodes'}{hiddenIds.size > 0 && ` (${hiddenIds.size} hidden)`}</span></div>
    </div>
  );
}

// ─── Map Page ───────────────────────────────────────────────────────
export default function MapPage() {
  const { user, loading: userLoading } = useUser();
  const { nodes, loading: nodesLoading, addNode, updateNode, deleteNode } = useNodes(user?.id);
  const { settings } = useSettings(user?.id);
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingFromId, setAddingFromId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const calculatedPositions = computeRadialLayout(nodes);
  const positions = { ...calculatedPositions, ...localPositions };
  const selectedNode = nodes.find((n) => n.id === selectedId);
  const addingFromNode = nodes.find((n) => n.id === addingFromId);
  const hasRootNode = nodes.some((n) => n.type === 'user');

  // Child count map
  const childCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    nodes.forEach((n) => { if (n.parent_id) map[n.parent_id] = (map[n.parent_id] || 0) + 1; });
    return map;
  }, [nodes]);

  useEffect(() => { setLocalPositions({}); }, [nodes]);

  const handleDragNode = useCallback((id: string, x: number, y: number) => { setLocalPositions((p) => ({ ...p, [id]: { x, y } })); if (saveTimeout.current) clearTimeout(saveTimeout.current); saveTimeout.current = setTimeout(() => { updateNode(id, { position_x: x, position_y: y }); }, 500); }, [updateNode]);
  const handleResetPosition = useCallback((id: string) => { updateNode(id, { position_x: null, position_y: null } as any); setLocalPositions((p) => { const n = { ...p }; delete n[id]; return n; }); }, [updateNode]);

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  const handleSearchSelect = useCallback((id: string) => {
    // Uncollapse any ancestor that might be hiding this node
    const toUncollapse = new Set<string>();
    let current = nodes.find((n) => n.id === id);
    while (current?.parent_id) {
      if (collapsedIds.has(current.parent_id)) toUncollapse.add(current.parent_id);
      current = nodes.find((n) => n.id === current!.parent_id);
    }
    if (toUncollapse.size > 0) {
      setCollapsedIds((prev) => { const next = new Set(prev); toUncollapse.forEach((id) => next.delete(id)); return next; });
    }
    setSelectedId(id);
    setHighlightId(id);
    setTimeout(() => setHighlightId(null), 2500);
  }, [nodes, collapsedIds]);

  if (userLoading || nodesLoading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-surface-container-high border-t-primary rounded-full animate-spin" /></div>;
  if (!user) { router.push('/login'); return null; }

  if (!hasRootNode) return <Onboarding onComplete={async (name) => { await addNode({ parent_id: null, name, type: 'user', hint: null, description: null, address: null, relationship: null, meta: {}, position_x: null, position_y: null, color: settings?.accent_color || '#3525cd', display_mode: 'abc', shape: 'circle', abc: name.charAt(0).toUpperCase(), outer_shape: 'circle', outer_color: settings?.accent_color || '#3525cd', outer_size: 38, outer_solid: true, inner_shape: 'circle', inner_color: '#ffffff', inner_size: 16, inner_solid: true }); }} />;

  const buildNodeData = (data: any) => ({
    parent_id: data.parentId || null, name: data.name, type: data.type, hint: data.hint || null, description: data.description || null, address: data.address || null, relationship: data.relationship || null, meta: {}, position_x: null, position_y: null,
    color: data.outerColor, display_mode: data.displayMode, shape: data.outerShape, abc: data.abc || data.name.charAt(0).toUpperCase(),
    outer_shape: data.outerShape, outer_color: data.outerColor, outer_size: data.outerSize, outer_solid: data.outerSolid,
    inner_shape: data.innerShape, inner_color: data.innerColor, inner_size: data.innerSize, inner_solid: data.innerSolid,
  });

  return (
    <div className="relative flex-1 h-full">
      <MapCanvas nodes={nodes} positions={positions} selectedId={selectedId} highlightId={highlightId} settings={settings} dragEnabled={dragEnabled} collapsedIds={collapsedIds} childCountMap={childCountMap} onSelectNode={setSelectedId} onDragNode={handleDragNode} onToggleCollapse={handleToggleCollapse} />

      {/* Top controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
        <button onClick={() => setDragEnabled(!dragEnabled)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-headline font-semibold border shadow-sm transition-all ${dragEnabled ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface-container-lowest border-surface-container-high text-on-surface-variant hover:text-primary'}`}>{dragEnabled ? <Unlock size={15} /> : <Lock size={15} />}{dragEnabled ? 'Moving Nodes' : 'Move Nodes'}</button>
        <button onClick={() => setQuickAddOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-headline font-semibold border shadow-sm bg-surface-container-lowest border-surface-container-high text-on-surface-variant hover:text-primary transition-all"><Plus size={15} /> Quick Add</button>
        <SearchBar nodes={nodes} settings={settings} onSelect={handleSearchSelect} />
      </div>

      {selectedNode && !addingFromId && <NodePanel node={selectedNode} nodes={nodes} settings={settings} onUpdate={(id, d) => updateNode(id, d)} onDelete={(id) => { deleteNode(id); setSelectedId(null); }} onAddChild={(pid) => setAddingFromId(pid)} onResetPosition={handleResetPosition} onToggleCollapse={handleToggleCollapse} onClose={() => setSelectedId(null)} />}
      {addingFromNode && <AddNodeModal parentNode={addingFromNode} settings={settings} onAdd={async (data) => { const r = await addNode(buildNodeData(data)); setAddingFromId(null); if (r?.data) setSelectedId(r.data.id); }} onClose={() => setAddingFromId(null)} />}
      {quickAddOpen && <QuickAddModal nodes={nodes} settings={settings} onAdd={async (data) => { const r = await addNode(buildNodeData(data)); setQuickAddOpen(false); if (r?.data) setSelectedId(r.data.id); }} onClose={() => setQuickAddOpen(false)} />}
    </div>
  );
}
