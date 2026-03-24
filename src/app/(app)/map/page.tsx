'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useNodes, useSettings } from '@/lib/hooks';
import { computeRadialLayout } from '@/lib/layout';
import { getNodeTypes, type MapNode, type NodeType, type NodeTypeConfig } from '@/lib/types';
import { Plus, X, ChevronRight, Pencil, Trash2, ZoomIn, ZoomOut, Locate } from 'lucide-react';

// ─── Onboarding (create root node) ─────────────────────────────────
function Onboarding({
  onComplete,
}: {
  onComplete: (name: string) => void;
}) {
  const [name, setName] = useState('');

  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-sm page-enter text-center">
        <div className="mb-6">
          <svg viewBox="0 0 80 80" className="w-16 h-16 mx-auto mb-4">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#3525cd" strokeWidth="2" />
            <circle cx="40" cy="40" r="7" fill="#3525cd" />
            <circle cx="18" cy="28" r="4" fill="#4ECDC4" opacity="0.7" />
            <circle cx="62" cy="28" r="4" fill="#FF6B6B" opacity="0.7" />
            <circle cx="26" cy="60" r="4" fill="#4f46e5" opacity="0.7" />
            <line x1="40" y1="40" x2="18" y2="28" stroke="#4ECDC4" strokeWidth="1" opacity="0.3" />
            <line x1="40" y1="40" x2="62" y2="28" stroke="#FF6B6B" strokeWidth="1" opacity="0.3" />
            <line x1="40" y1="40" x2="26" y2="60" stroke="#4f46e5" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>
        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-2">
          Let&apos;s set up your map
        </h2>
        <p className="text-on-surface-variant text-sm mb-8">
          You&apos;ll be the center node. What should we call you?
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onComplete(name.trim())}
          className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition mb-4"
          placeholder="Your name"
          autoFocus
        />
        <button
          onClick={() => name.trim() && onComplete(name.trim())}
          disabled={!name.trim()}
          className="w-full silk-gradient text-white py-3 rounded-xl font-headline font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-40"
        >
          Create My Map
        </button>
      </div>
    </div>
  );
}

// ─── Add Node Modal ─────────────────────────────────────────────────
function AddNodeModal({
  parentNode,
  nodeTypes,
  onAdd,
  onClose,
}: {
  parentNode: MapNode;
  nodeTypes: NodeTypeConfig[];
  onAdd: (data: { name: string; type: NodeType; hint?: string; description?: string; address?: string; relationship?: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<NodeType>('person');
  const [hint, setHint] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [relationship, setRelationship] = useState('');

  const parentType = nodeTypes.find((t) => t.key === parentNode.type);
  const selectableTypes = nodeTypes.filter((t) => t.key !== 'user');

  const metaFields: Record<string, { key: string; label: string; placeholder: string; multiline?: boolean }[]> = {
    person: [
      { key: 'hint', label: 'Memory hint', placeholder: 'How will you remember them?' },
      { key: 'description', label: 'Description', placeholder: 'e.g. Tall, glasses, has a dog', multiline: true },
      { key: 'relationship', label: 'Relationship', placeholder: 'e.g. Friend, trainer, teacher' },
    ],
    place: [
      { key: 'address', label: 'Address', placeholder: 'Street address or area' },
      { key: 'hint', label: 'Memory hint', placeholder: 'How do you remember this place?' },
      { key: 'description', label: 'Description', placeholder: "What's notable?", multiline: true },
    ],
    context: [
      { key: 'description', label: 'Description', placeholder: 'What is this group/context?', multiline: true },
      { key: 'hint', label: 'Hint', placeholder: 'Any memory trigger?' },
    ],
  };

  const currentFields = metaFields[type] || [];

  const getFieldValue = (key: string) => {
    switch (key) {
      case 'hint': return hint;
      case 'description': return description;
      case 'address': return address;
      case 'relationship': return relationship;
      default: return '';
    }
  };

  const setFieldValue = (key: string, val: string) => {
    switch (key) {
      case 'hint': setHint(val); break;
      case 'description': setDescription(val); break;
      case 'address': setAddress(val); break;
      case 'relationship': setRelationship(val); break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto custom-scrollbar animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-surface-container">
          <h3 className="font-headline font-bold text-lg text-on-surface">
            Add from{' '}
            <span style={{ color: parentType?.color }}>{parentNode.name}</span>
          </h3>
          <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
              Type
            </label>
            <div className="flex gap-2">
              {selectableTypes.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-headline font-semibold border-2 transition-all"
                  style={{
                    borderColor: type === t.key ? t.color : 'transparent',
                    background: type === t.key ? t.color + '15' : '#f0edec',
                    color: type === t.key ? t.color : '#464555',
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              placeholder={type === 'person' ? 'Their name' : type === 'place' ? 'Place name' : 'Context name'}
              autoFocus
            />
          </div>

          {currentFields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                {f.label}
              </label>
              {f.multiline ? (
                <textarea
                  value={getFieldValue(f.key)}
                  onChange={(e) => setFieldValue(f.key, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-y min-h-[60px]"
                  placeholder={f.placeholder}
                />
              ) : (
                <input
                  value={getFieldValue(f.key)}
                  onChange={(e) => setFieldValue(f.key, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 p-5 border-t border-surface-container">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onAdd({
                name: name.trim(),
                type,
                hint: hint || undefined,
                description: description || undefined,
                address: address || undefined,
                relationship: relationship || undefined,
              });
            }}
            disabled={!name.trim()}
            className="flex-1 silk-gradient text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
          >
            Add {nodeTypes.find((t) => t.key === type)?.label}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Node Detail Panel ──────────────────────────────────────────────
function NodePanel({
  node,
  nodes,
  nodeTypes,
  onUpdate,
  onDelete,
  onAddChild,
  onClose,
}: {
  node: MapNode;
  nodes: MapNode[];
  nodeTypes: NodeTypeConfig[];
  onUpdate: (id: string, data: Partial<MapNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...node });
  const typeInfo = nodeTypes.find((t) => t.key === node.type) || nodeTypes[0];
  const children = nodes.filter((n) => n.parent_id === node.id);
  const parent = nodes.find((n) => n.id === node.parent_id);

  useEffect(() => {
    setForm({ ...node });
    setEditing(false);
  }, [node]);

  const handleSave = () => {
    onUpdate(node.id, {
      name: form.name,
      type: form.type,
      hint: form.hint,
      description: form.description,
      address: form.address,
      relationship: form.relationship,
    });
    setEditing(false);
  };

  const detailRows: { label: string; value: string | null }[] = [
    { label: 'Hint', value: node.hint },
    { label: 'Description', value: node.description },
    { label: 'Address', value: node.address },
    { label: 'Relationship', value: node.relationship },
  ];

  return (
    <div className="absolute top-0 right-0 w-[380px] max-w-[90vw] h-full bg-surface-container-lowest border-l border-surface-container-high z-40 flex flex-col animate-slide-right shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-surface-container">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-headline font-bold uppercase tracking-wider px-3 py-1 rounded-full"
            style={{ background: typeInfo.color + '18', color: typeInfo.color }}
          >
            {typeInfo.icon} {typeInfo.label}
          </span>
          {parent && (
            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              <ChevronRight size={12} /> {parent.name}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {!editing ? (
          <>
            <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-5">
              {node.name}
            </h2>

            {detailRows
              .filter((r) => r.value)
              .map((r) => (
                <div key={r.label} className="mb-4">
                  <span className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    {r.label}
                  </span>
                  <p className="text-on-surface text-sm leading-relaxed">{r.value}</p>
                </div>
              ))}

            {children.length > 0 && (
              <div className="mt-6">
                <span className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Connections ({children.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {children.map((c) => {
                    const ct = nodeTypes.find((t) => t.key === c.type) || nodeTypes[0];
                    return (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1.5 text-xs font-headline font-medium px-3 py-1.5 rounded-full border"
                        style={{ borderColor: ct.color + '40', color: ct.color }}
                      >
                        {ct.icon} {c.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Edit form */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            {node.type !== 'user' && (
              <>
                <div>
                  <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Hint
                  </label>
                  <input
                    value={form.hint || ''}
                    onChange={(e) => setForm({ ...form, hint: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                    placeholder="Memory trigger"
                  />
                </div>
                <div>
                  <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition resize-y min-h-[60px]"
                    placeholder="Notes about this node"
                  />
                </div>
                {(node.type === 'place' || form.type === 'place') && (
                  <div>
                    <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Address
                    </label>
                    <input
                      value={form.address || ''}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                      placeholder="Address or location"
                    />
                  </div>
                )}
                {(node.type === 'person' || form.type === 'person') && (
                  <div>
                    <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Relationship
                    </label>
                    <input
                      value={form.relationship || ''}
                      onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                      placeholder="e.g. Friend, colleague"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 p-5 border-t border-surface-container space-y-2">
        {!editing ? (
          <>
            <button
              onClick={() => onAddChild(node.id)}
              className="w-full silk-gradient text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add from {node.name}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 py-2.5 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition flex items-center justify-center gap-2"
              >
                <Pencil size={14} /> Edit
              </button>
              {node.type !== 'user' && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${node.name}" and all its connections?`)) {
                      onDelete(node.id);
                    }
                  }}
                  className="py-2.5 px-4 rounded-xl font-headline font-semibold text-sm border border-error/20 text-error hover:bg-error/5 transition flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 silk-gradient text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SVG Canvas ─────────────────────────────────────────────────────
function MapCanvas({
  nodes,
  positions,
  selectedId,
  nodeTypes,
  onSelectNode,
}: {
  nodes: MapNode[];
  positions: Record<string, { x: number; y: number }>;
  selectedId: string | null;
  nodeTypes: NodeTypeConfig[];
  onSelectNode: (id: string | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // Center on mount
  useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: rect.height / 2 });
    }
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setZoom((z) => Math.max(0.15, Math.min(3, z * factor)));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    setDragging(true);
    const pos = 'touches' in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
    dragStart.current = pos;
    panStart.current = pan;
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const pos = 'touches' in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
    setPan({
      x: panStart.current.x + (pos.x - dragStart.current.x),
      y: panStart.current.y + (pos.y - dragStart.current.y),
    });
  };

  const onPointerUp = () => setDragging(false);

  const recenter = () => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: rect.height / 2 });
      setZoom(1);
    }
  };

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full map-canvas"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
        {/* Subtle grid background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            <circle cx="20" cy="20" r="0.8" fill="#c7c4d8" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {nodes
            .filter((n) => n.parent_id && positions[n.id] && positions[n.parent_id])
            .map((n) => {
              const from = positions[n.parent_id!];
              const to = positions[n.id];
              const typeInfo = nodeTypes.find((t) => t.key === n.type);
              return (
                <line
                  key={`edge-${n.id}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={typeInfo?.color || '#777'}
                  strokeWidth={1.5}
                  opacity={0.25}
                  strokeDasharray={n.type === 'context' ? '6 4' : 'none'}
                />
              );
            })}

          {/* Nodes */}
          {nodes.map((n) => {
            const pos = positions[n.id];
            if (!pos) return null;
            const typeInfo = nodeTypes.find((t) => t.key === n.type) || nodeTypes[0];
            const isSelected = selectedId === n.id;
            const isRoot = n.type === 'user';
            const r = isRoot ? 38 : 28;

            return (
              <g
                key={n.id}
                data-node="true"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(n.id === selectedId ? null : n.id);
                }}
              >
                {/* Selection glow */}
                {isSelected && (
                  <circle cx={pos.x} cy={pos.y} r={r + 10} fill={typeInfo.color} opacity={0.1} />
                )}
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill="#fcf9f8"
                  stroke={typeInfo.color}
                  strokeWidth={isSelected ? 2.5 : 1.8}
                />
                {/* Inner symbol */}
                {isRoot ? (
                  <circle cx={pos.x} cy={pos.y} r={6} fill={typeInfo.color} opacity={0.6} />
                ) : n.type === 'place' ? (
                  <polygon
                    points={`${pos.x},${pos.y - 5} ${pos.x + 5},${pos.y + 3} ${pos.x - 5},${pos.y + 3}`}
                    fill={typeInfo.color}
                    opacity={0.5}
                  />
                ) : n.type === 'context' ? (
                  <rect
                    x={pos.x - 5}
                    y={pos.y - 5}
                    width={10}
                    height={10}
                    rx={2}
                    fill={typeInfo.color}
                    opacity={0.5}
                  />
                ) : (
                  <circle cx={pos.x} cy={pos.y} r={4} fill={typeInfo.color} opacity={0.5} />
                )}
                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + r + 16}
                  textAnchor="middle"
                  fill="#1c1b1b"
                  fontSize={isRoot ? 13 : 11}
                  fontWeight={isRoot ? 700 : 500}
                  fontFamily="Manrope, system-ui, sans-serif"
                >
                  {n.name.length > 18 ? n.name.slice(0, 17) + '…' : n.name}
                </text>
                {/* Hint preview */}
                {n.hint && !isRoot && (
                  <text
                    x={pos.x}
                    y={pos.y + r + 29}
                    textAnchor="middle"
                    fill="#777587"
                    fontSize={9}
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {n.hint.length > 28 ? n.hint.slice(0, 27) + '…' : n.hint}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-1.5 z-10">
        <button
          onClick={() => setZoom((z) => Math.min(3, z * 1.25))}
          className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.15, z * 0.8))}
          className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={recenter}
          className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition"
        >
          <Locate size={16} />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-5 right-5 flex gap-4 bg-surface-container-lowest/90 backdrop-blur-sm border border-surface-container-high rounded-full px-4 py-2 z-10">
        {nodeTypes.map((t) => (
          <span key={t.key} className="flex items-center gap-1.5 text-[11px] font-headline text-on-surface-variant">
            <span style={{ color: t.color }}>{t.icon}</span> {t.label}
          </span>
        ))}
      </div>

      {/* Node count */}
      <div className="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-sm border border-surface-container-high rounded-full px-3 py-1.5 z-10">
        <span className="text-xs font-headline text-on-surface-variant">
          {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
        </span>
      </div>
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

  const nodeTypes = getNodeTypes(settings);
  const positions = computeRadialLayout(nodes);
  const selectedNode = nodes.find((n) => n.id === selectedId);
  const addingFromNode = nodes.find((n) => n.id === addingFromId);
  const hasRootNode = nodes.some((n) => n.type === 'user');

  // Loading state
  if (userLoading || nodesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-surface-container-high border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // Onboarding — create root node
  if (!hasRootNode) {
    return (
      <Onboarding
        onComplete={async (name) => {
          await addNode({
            parent_id: null,
            name,
            type: 'user',
            hint: null,
            description: null,
            address: null,
            relationship: null,
            meta: {},
            position_x: null,
            position_y: null,
          });
        }}
      />
    );
  }

  return (
    <div className="relative flex-1 h-full">
      <MapCanvas
        nodes={nodes}
        positions={positions}
        selectedId={selectedId}
        nodeTypes={nodeTypes}
        onSelectNode={setSelectedId}
      />

      {/* Node detail panel */}
      {selectedNode && !addingFromId && (
        <NodePanel
          node={selectedNode}
          nodes={nodes}
          nodeTypes={nodeTypes}
          onUpdate={(id, data) => updateNode(id, data)}
          onDelete={(id) => {
            deleteNode(id);
            setSelectedId(null);
          }}
          onAddChild={(parentId) => setAddingFromId(parentId)}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Add node modal */}
      {addingFromNode && (
        <AddNodeModal
          parentNode={addingFromNode}
          nodeTypes={nodeTypes}
          onAdd={async (data) => {
            const result = await addNode({
              parent_id: addingFromNode.id,
              name: data.name,
              type: data.type,
              hint: data.hint || null,
              description: data.description || null,
              address: data.address || null,
              relationship: data.relationship || null,
              meta: {},
              position_x: null,
              position_y: null,
            });
            setAddingFromId(null);
            if (result?.data) {
              setSelectedId(result.data.id);
            }
          }}
          onClose={() => setAddingFromId(null)}
        />
      )}
    </div>
  );
}
