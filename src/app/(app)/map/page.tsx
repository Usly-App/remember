'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useMaps, useSettings } from '@/lib/hooks';
import type { MapRecord } from '@/lib/types';
import { Plus, X, Pencil, Trash2, Map } from 'lucide-react';

const EMOJI_OPTIONS = ['🗺️', '👥', '✈️', '📚', '🏗️', '🏠', '🍳', '💡', '🎯', '🎵', '💼', '🏋️', '🌍', '❤️', '📝', '🔬'];

// ─── Create/Edit Map Modal ──────────────────────────────────────────
function MapModal({ initial, onSave, onClose }: { initial?: MapRecord; onSave: (data: { name: string; emoji: string; description: string }) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [emoji, setEmoji] = useState(initial?.emoji || '🗺️');
  const [description, setDescription] = useState(initial?.description || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-md mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-surface-container">
          <h3 className="font-headline font-bold text-lg text-on-surface">
            {initial ? 'Edit Map' : 'Create New Map'}
          </h3>
          <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all"
                  style={{
                    borderColor: emoji === e ? '#3525cd' : 'transparent',
                    background: emoji === e ? '#3525cd10' : '#f0edec',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Map Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              placeholder="e.g. My People, Japan Trip, Study Notes"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-y min-h-[60px]"
              placeholder="What is this map for?"
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-surface-container">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition">Cancel</button>
          <button
            onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), emoji, description: description.trim() }); }}
            disabled={!name.trim()}
            className="flex-1 silk-gradient text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {initial ? 'Save Changes' : 'Create Map'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Map Card ───────────────────────────────────────────────────────
function MapCard({ map, nodeCount, onOpen, onEdit, onDelete }: { map: MapRecord; nodeCount: number; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const timeAgo = getTimeAgo(map.updated_at);

  return (
    <div
      className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-6 flex flex-col justify-between min-h-[200px] hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onOpen}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{map.emoji}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition"><Pencil size={14} /></button>
            <button onClick={() => { if (window.confirm(`Delete "${map.name}" and all its nodes?`)) onDelete(); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-error/60 hover:bg-error/5 transition"><Trash2 size={14} /></button>
          </div>
        </div>
        <h3 className="font-headline font-bold text-lg text-on-surface mb-1">{map.name}</h3>
        {map.description && (
          <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">{map.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-container">
        <span className="text-xs text-on-surface-variant font-headline">
          {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
        </span>
        <span className="text-xs text-on-surface-variant/60 font-headline">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center page-enter">
        <div className="mb-6">
          <svg viewBox="0 0 120 120" className="w-24 h-24 mx-auto mb-4">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#3525cd" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.3" />
            <circle cx="60" cy="60" r="30" fill="none" stroke="#3525cd" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.2" />
            <circle cx="60" cy="60" r="10" fill="#3525cd" opacity="0.6" />
            <circle cx="30" cy="35" r="5" fill="#4ECDC4" opacity="0.5" />
            <circle cx="90" cy="40" r="5" fill="#FF6B6B" opacity="0.5" />
            <circle cx="40" cy="90" r="5" fill="#4f46e5" opacity="0.5" />
            <circle cx="85" cy="80" r="5" fill="#E8A838" opacity="0.5" />
            <line x1="60" y1="60" x2="30" y2="35" stroke="#4ECDC4" strokeWidth="1" opacity="0.2" />
            <line x1="60" y1="60" x2="90" y2="40" stroke="#FF6B6B" strokeWidth="1" opacity="0.2" />
            <line x1="60" y1="60" x2="40" y2="90" stroke="#4f46e5" strokeWidth="1" opacity="0.2" />
            <line x1="60" y1="60" x2="85" y2="80" stroke="#E8A838" strokeWidth="1" opacity="0.2" />
          </svg>
        </div>
        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-2">
          Create your first map
        </h2>
        <p className="text-on-surface-variant text-sm mb-8 max-w-sm mx-auto">
          Maps are visual mind maps for anything you want to remember — people, places, ideas, projects. Start with one and add as many as you need.
        </p>
        <button
          onClick={onCreate}
          className="silk-gradient text-white px-8 py-3.5 rounded-xl font-headline font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98] inline-flex items-center gap-2"
        >
          <Plus size={18} /> Create Your First Map
        </button>
      </div>
    </div>
  );
}

// ─── Time Ago Helper ────────────────────────────────────────────────
function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

// ─── My Maps Page ───────────────────────────────────────────────────
export default function MyMapsPage() {
  const { user, loading: userLoading } = useUser();
  const { maps, loading: mapsLoading, createMap, updateMap, deleteMap } = useMaps(user?.id);
  const { settings } = useSettings(user?.id);
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingMap, setEditingMap] = useState<MapRecord | null>(null);

  // We need node counts per map
  const [nodeCounts, setNodeCounts] = useState<Record<string, number>>({});

  // Fetch node counts
  useState(() => {
    if (!user?.id) return;
    const supabase = (async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data } = await sb
        .from('map_nodes')
        .select('map_id')
        .eq('user_id', user.id);
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((n: { map_id: string | null }) => {
          if (n.map_id) counts[n.map_id] = (counts[n.map_id] || 0) + 1;
        });
        setNodeCounts(counts);
      }
    })();
  });

  const handleCreate = async (data: { name: string; emoji: string; description: string }) => {
    const result = await createMap(data);
    setShowModal(false);
    if (result?.data) {
      router.push(`/map/${result.data.id}`);
    }
  };

  const handleEdit = async (data: { name: string; emoji: string; description: string }) => {
    if (!editingMap) return;
    await updateMap(editingMap.id, data);
    setEditingMap(null);
  };

  if (userLoading || mapsLoading) {
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

  if (maps.length === 0) {
    return (
      <>
        <EmptyState onCreate={() => setShowModal(true)} />
        {showModal && <MapModal onSave={handleCreate} onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-6 py-10 page-enter">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline font-extrabold text-3xl text-on-surface">My Maps</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {maps.length} {maps.length === 1 ? 'map' : 'maps'}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="silk-gradient text-white px-5 py-2.5 rounded-xl font-headline font-bold text-sm shadow-lg transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Plus size={16} /> New Map
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {maps.map((map) => (
            <MapCard
              key={map.id}
              map={map}
              nodeCount={nodeCounts[map.id] || 0}
              onOpen={() => router.push(`/map/${map.id}`)}
              onEdit={() => setEditingMap(map)}
              onDelete={() => deleteMap(map.id)}
            />
          ))}
        </div>
      </div>

      {showModal && <MapModal onSave={handleCreate} onClose={() => setShowModal(false)} />}
      {editingMap && <MapModal initial={editingMap} onSave={handleEdit} onClose={() => setEditingMap(null)} />}
    </div>
  );
}
