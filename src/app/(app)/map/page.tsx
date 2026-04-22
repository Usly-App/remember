'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useMaps, useSettings } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import { NODE_PRESETS } from '@/lib/types';
import type { MapRecord } from '@/lib/types';
import { Plus, X, Pencil, Trash2, Map, Users, Plane, BookOpen, ChefHat, Briefcase, Home, Lightbulb, FileText } from 'lucide-react';
import { NoddicLoader } from '@/components/loader';

const EMOJI_OPTIONS = ['', '🗺️', '👥', '✈️', '📚', '🏗️', '🏠', '🍳', '💡', '🎯', '🎵', '💼', '🏋️', '🌍', '❤️', '📝', '🔬'];

// ─── Map Templates ──────────────────────────────────────────────────
interface MapTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  icon: any;
  color: string;
  centerNode: string;
  children: { name: string; type: string; children?: { name: string; type: string }[] }[];
}

const MAP_TEMPLATES: MapTemplate[] = [
  {
    id: 'people',
    name: 'People',
    emoji: '👥',
    description: 'Map your relationships and connections',
    icon: Users,
    color: '#4ECDC4',
    centerNode: 'Me',
    children: [
      { name: 'Family', type: 'group', children: [
        { name: 'Parents', type: 'person' },
        { name: 'Siblings', type: 'person' },
        { name: 'Extended', type: 'person' },
      ]},
      { name: 'Friends', type: 'group', children: [
        { name: 'Close Friends', type: 'person' },
        { name: 'School Friends', type: 'person' },
        { name: 'Online Friends', type: 'person' },
      ]},
      { name: 'Work', type: 'context', children: [
        { name: 'Team', type: 'group' },
        { name: 'Manager', type: 'person' },
        { name: 'Clients', type: 'group' },
      ]},
      { name: 'Neighbours', type: 'group' },
      { name: 'Community', type: 'group', children: [
        { name: 'Sports', type: 'context' },
        { name: 'Clubs', type: 'context' },
      ]},
    ],
  },
  {
    id: 'travel',
    name: 'Travel',
    emoji: '✈️',
    description: 'Plan every detail of your trip',
    icon: Plane,
    color: '#FF6B6B',
    centerNode: 'My Trip',
    children: [
      { name: 'Getting There', type: 'thing', children: [
        { name: 'Flights', type: 'thing' },
        { name: 'Transfers', type: 'thing' },
        { name: 'Visa / Docs', type: 'note' },
      ]},
      { name: 'Accommodation', type: 'place', children: [
        { name: 'Hotels', type: 'place' },
        { name: 'Airbnb', type: 'place' },
      ]},
      { name: 'Activities', type: 'event', children: [
        { name: 'Must See', type: 'place' },
        { name: 'Day Trips', type: 'event' },
        { name: 'Tours', type: 'event' },
        { name: 'Nightlife', type: 'event' },
      ]},
      { name: 'Food & Drink', type: 'place', children: [
        { name: 'Restaurants', type: 'place' },
        { name: 'Cafes', type: 'place' },
        { name: 'Street Food', type: 'place' },
      ]},
      { name: 'Budget', type: 'note', children: [
        { name: 'Transport', type: 'note' },
        { name: 'Accommodation', type: 'note' },
        { name: 'Food', type: 'note' },
        { name: 'Activities', type: 'note' },
      ]},
      { name: 'Packing', type: 'thing' },
    ],
  },
  {
    id: 'study',
    name: 'Study',
    emoji: '📚',
    description: 'Organize your learning and revision',
    icon: BookOpen,
    color: '#4f46e5',
    centerNode: 'Subject',
    children: [
      { name: 'Key Concepts', type: 'idea', children: [
        { name: 'Definitions', type: 'note' },
        { name: 'Theories', type: 'idea' },
        { name: 'Formulas', type: 'note' },
      ]},
      { name: 'Resources', type: 'thing', children: [
        { name: 'Textbooks', type: 'thing' },
        { name: 'Videos', type: 'thing' },
        { name: 'Articles', type: 'thing' },
        { name: 'Past Papers', type: 'thing' },
      ]},
      { name: 'Notes', type: 'note', children: [
        { name: 'Lecture Notes', type: 'note' },
        { name: 'Summaries', type: 'note' },
      ]},
      { name: 'Questions', type: 'note', children: [
        { name: 'To Ask', type: 'note' },
        { name: 'Answered', type: 'note' },
      ]},
      { name: 'Exam Prep', type: 'event', children: [
        { name: 'Study Plan', type: 'note' },
        { name: 'Practice Tests', type: 'thing' },
        { name: 'Weak Areas', type: 'note' },
      ]},
    ],
  },
  {
    id: 'recipe',
    name: 'Recipe',
    emoji: '🍳',
    description: 'Break down recipes and meal planning',
    icon: ChefHat,
    color: '#E8A838',
    centerNode: 'Recipe Name',
    children: [
      { name: 'Ingredients', type: 'thing', children: [
        { name: 'Fresh', type: 'thing' },
        { name: 'Pantry', type: 'thing' },
        { name: 'Spices', type: 'thing' },
      ]},
      { name: 'Preparation', type: 'note', children: [
        { name: 'Prep Work', type: 'note' },
        { name: 'Cooking Steps', type: 'note' },
        { name: 'Plating', type: 'note' },
      ]},
      { name: 'Timing', type: 'event', children: [
        { name: 'Prep Time', type: 'note' },
        { name: 'Cook Time', type: 'note' },
        { name: 'Rest Time', type: 'note' },
      ]},
      { name: 'Tips & Tricks', type: 'idea' },
      { name: 'Variations', type: 'idea', children: [
        { name: 'Vegetarian', type: 'idea' },
        { name: 'Spicy', type: 'idea' },
        { name: 'Quick Version', type: 'idea' },
      ]},
      { name: 'Pairings', type: 'thing', children: [
        { name: 'Side Dishes', type: 'thing' },
        { name: 'Drinks', type: 'thing' },
      ]},
    ],
  },
  {
    id: 'project',
    name: 'Project',
    emoji: '🏗️',
    description: 'Plan and manage any project',
    icon: Briefcase,
    color: '#059669',
    centerNode: 'Project Name',
    children: [
      { name: 'Goals', type: 'idea', children: [
        { name: 'Primary Goal', type: 'idea' },
        { name: 'Milestones', type: 'event' },
        { name: 'Success Metrics', type: 'note' },
      ]},
      { name: 'Tasks', type: 'thing', children: [
        { name: 'To Do', type: 'thing' },
        { name: 'In Progress', type: 'thing' },
        { name: 'Done', type: 'thing' },
        { name: 'Blocked', type: 'thing' },
      ]},
      { name: 'Team', type: 'group', children: [
        { name: 'Lead', type: 'person' },
        { name: 'Contributors', type: 'group' },
        { name: 'Stakeholders', type: 'group' },
      ]},
      { name: 'Resources', type: 'thing', children: [
        { name: 'Budget', type: 'note' },
        { name: 'Tools', type: 'thing' },
        { name: 'Documents', type: 'thing' },
      ]},
      { name: 'Timeline', type: 'event', children: [
        { name: 'Phase 1', type: 'event' },
        { name: 'Phase 2', type: 'event' },
        { name: 'Deadline', type: 'event' },
      ]},
      { name: 'Risks', type: 'note' },
    ],
  },
  {
    id: 'neighbourhood',
    name: 'Neighbourhood',
    emoji: '🏠',
    description: 'Map your local area and community',
    icon: Home,
    color: '#0d9488',
    centerNode: 'My Area',
    children: [
      { name: 'Neighbours', type: 'group', children: [
        { name: 'Left Side', type: 'person' },
        { name: 'Right Side', type: 'person' },
        { name: 'Across', type: 'person' },
      ]},
      { name: 'Food & Shops', type: 'place', children: [
        { name: 'Supermarket', type: 'place' },
        { name: 'Restaurants', type: 'place' },
        { name: 'Cafes', type: 'place' },
        { name: 'Takeaway', type: 'place' },
      ]},
      { name: 'Services', type: 'place', children: [
        { name: 'Doctor', type: 'place' },
        { name: 'Dentist', type: 'place' },
        { name: 'Mechanic', type: 'place' },
        { name: 'Post Office', type: 'place' },
      ]},
      { name: 'Outdoors', type: 'place', children: [
        { name: 'Parks', type: 'place' },
        { name: 'Walking Tracks', type: 'place' },
        { name: 'Playgrounds', type: 'place' },
      ]},
      { name: 'Schools', type: 'place' },
      { name: 'Transport', type: 'thing', children: [
        { name: 'Bus Stops', type: 'place' },
        { name: 'Train Station', type: 'place' },
      ]},
    ],
  },
  {
    id: 'idea',
    name: 'Idea',
    emoji: '💡',
    description: 'Flesh out an idea from concept to action',
    icon: Lightbulb,
    color: '#A78BFA',
    centerNode: 'My Idea',
    children: [
      { name: 'Problem', type: 'note', children: [
        { name: 'Pain Points', type: 'note' },
        { name: 'Who Has It', type: 'group' },
        { name: 'Current Solutions', type: 'note' },
      ]},
      { name: 'Solution', type: 'idea', children: [
        { name: 'Core Concept', type: 'idea' },
        { name: 'Key Features', type: 'idea' },
        { name: 'Differentiator', type: 'idea' },
      ]},
      { name: 'Audience', type: 'group', children: [
        { name: 'Primary Users', type: 'group' },
        { name: 'Secondary Users', type: 'group' },
      ]},
      { name: 'Validation', type: 'thing', children: [
        { name: 'Research', type: 'note' },
        { name: 'Feedback', type: 'note' },
        { name: 'Competitors', type: 'note' },
      ]},
      { name: 'Next Steps', type: 'thing', children: [
        { name: 'MVP', type: 'thing' },
        { name: 'Resources Needed', type: 'thing' },
        { name: 'Timeline', type: 'event' },
      ]},
      { name: 'Inspiration', type: 'idea' },
    ],
  },
];

function getPresetForType(type: string) {
  return NODE_PRESETS.find((p) => p.type === type) || NODE_PRESETS[0];
}

// ─── Template Picker Modal ──────────────────────────────────────────
function TemplatePicker({ onSelect, onBlank, onClose }: { onSelect: (template: MapTemplate) => void; onBlank: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto custom-scrollbar animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-surface-container">
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Create New Map</h3>
            <p className="text-sm text-on-surface-variant mt-0.5">Start from a template or blank</p>
          </div>
          <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5">
          {/* Blank option */}
          <button
            onClick={onBlank}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-surface-container-high hover:border-primary/40 hover:bg-primary/5 transition-all mb-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center group-hover:bg-primary/10 transition">
              <FileText size={22} className="text-on-surface-variant group-hover:text-primary transition" />
            </div>
            <div className="text-left">
              <p className="font-headline font-bold text-on-surface">Blank Map</p>
              <p className="text-sm text-on-surface-variant">Start from scratch with a custom center node</p>
            </div>
          </button>

          {/* Templates */}
          <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Or start from a template</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MAP_TEMPLATES.map((t) => {
              const Icon = t.icon;
              const totalNodes = t.children.reduce((sum, c) => sum + 1 + (c.children?.length || 0), 0);
              return (
                <button
                  key={t.id}
                  onClick={() => onSelect(t)}
                  className="flex items-start gap-3 p-4 rounded-2xl border border-surface-container-high hover:border-current/30 hover:shadow-md transition-all text-left group"
                  style={{ color: t.color }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.color + '15' }}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg">{t.emoji}</span>
                      <p className="font-headline font-bold text-sm text-on-surface">{t.name}</p>
                      <span className="text-[10px] font-headline text-on-surface-variant/50">{totalNodes} nodes</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{t.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.children.map((c) => (
                        <span key={c.name} className="text-[10px] font-headline px-2 py-0.5 rounded-full" style={{ background: t.color + '12', color: t.color }}>{c.name}{c.children ? ` +${c.children.length}` : ''}</span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template Setup Modal ───────────────────────────────────────────
function TemplateSetupModal({ template, onSave, onClose }: { template: MapTemplate; onSave: (data: { name: string; emoji: string; description: string; centerNode: string }) => void; onClose: () => void }) {
  const [name, setName] = useState(template.name);
  const [emoji, setEmoji] = useState(template.emoji);
  const [centerNode, setCenterNode] = useState(template.centerNode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto custom-scrollbar animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <h3 className="font-headline font-bold text-lg text-on-surface">{template.name} Map</h3>
          </div>
          <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e || 'none'} onClick={() => setEmoji(e)} className="w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all" style={{ borderColor: emoji === e ? template.color : 'transparent', background: emoji === e ? template.color + '10' : '#f0edec' }}>{e || '⊘'}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Map Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="e.g. Japan Trip, Study Notes" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Center Node Name</label>
            <input value={centerNode} onChange={(e) => setCenterNode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder={template.centerNode} />
          </div>
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Starter structure</label>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
              {template.children.map((c) => {
                const preset = getPresetForType(c.type);
                return (
                  <div key={c.name}>
                    <span className="text-xs font-headline font-semibold px-2.5 py-1 rounded-full inline-block" style={{ background: preset.outer_color + '15', color: preset.outer_color }}>{c.name}</span>
                    {c.children && c.children.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 ml-4">
                        {c.children.map((gc) => {
                          const gp = getPresetForType(gc.type);
                          return <span key={gc.name} className="text-[10px] font-headline px-2 py-0.5 rounded-full" style={{ background: gp.outer_color + '10', color: gp.outer_color }}>{gc.name}</span>;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-surface-container">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition">Cancel</button>
          <button onClick={() => { if (!name.trim() || !centerNode.trim()) return; onSave({ name: name.trim(), emoji, description: template.description, centerNode: centerNode.trim() }); }} disabled={!name.trim() || !centerNode.trim()} className="flex-1 text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${template.color}, ${template.color}dd)` }}>Create Map</button>
        </div>
      </div>
    </div>
  );
}

// ─── Create/Edit Map Modal ──────────────────────────────────────────
function MapModal({ initial, onSave, onClose }: { initial?: MapRecord; onSave: (data: { name: string; emoji: string; description: string }) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [emoji, setEmoji] = useState(initial?.emoji || '🗺️');
  const [description, setDescription] = useState(initial?.description || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high w-full max-w-md mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-surface-container">
          <h3 className="font-headline font-bold text-lg text-on-surface">{initial ? 'Edit Map' : 'Create New Map'}</h3>
          <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e || 'none'} onClick={() => setEmoji(e)} className="w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all" style={{ borderColor: emoji === e ? '#3525cd' : 'transparent', background: emoji === e ? '#3525cd10' : '#f0edec' }}>{e || '⊘'}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Map Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" placeholder="e.g. My People, Japan Trip, Study Notes" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-y min-h-[60px]" placeholder="What is this map for?" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-surface-container">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition">Cancel</button>
          <button onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), emoji, description: description.trim() }); }} disabled={!name.trim()} className="flex-1 silk-gradient text-white py-3 rounded-xl font-headline font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-40">{initial ? 'Save Changes' : 'Create Map'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Map Card ───────────────────────────────────────────────────────
function MapCard({ map, nodeCount, onOpen, onEdit, onDelete }: { map: MapRecord; nodeCount: number; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const timeAgo = getTimeAgo(map.updated_at);
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-6 flex flex-col justify-between min-h-[200px] hover:shadow-lg transition-shadow cursor-pointer group" onClick={onOpen}>
      <div>
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{map.emoji}</span>
          <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition"><Pencil size={14} /></button>
            <button onClick={() => { if (window.confirm(`Delete "${map.name}" and all its nodes?`)) onDelete(); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-error/60 hover:bg-error/5 transition"><Trash2 size={14} /></button>
          </div>
        </div>
        <h3 className="font-headline font-bold text-lg text-on-surface mb-1">{map.name}</h3>
        {map.description && <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">{map.description}</p>}
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-container">
        <span className="text-xs text-on-surface-variant font-headline">{nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}</span>
        <span className="text-xs text-on-surface-variant/60 font-headline">{timeAgo}</span>
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
        <h2 className="font-headline font-extrabold text-2xl text-on-surface mb-2">Create your first map</h2>
        <p className="text-on-surface-variant text-sm mb-8 max-w-sm mx-auto">Maps are visual mind maps for anything you want to remember — people, places, ideas, projects. Start with one and add as many as you need.</p>
        <button onClick={onCreate} className="silk-gradient text-white px-8 py-3.5 rounded-xl font-headline font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98] inline-flex items-center gap-2"><Plus size={18} /> Create Your First Map</button>
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
  const [showPicker, setShowPicker] = useState(false);
  const [showBlankModal, setShowBlankModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MapTemplate | null>(null);
  const [editingMap, setEditingMap] = useState<MapRecord | null>(null);
  const [creating, setCreating] = useState(false);

  const [nodeCounts, setNodeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from('map_nodes').select('map_id').eq('user_id', user.id);
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((n: { map_id: string | null }) => { if (n.map_id) counts[n.map_id] = (counts[n.map_id] || 0) + 1; });
        setNodeCounts(counts);
      }
    })();
  }, [user?.id, maps]);

  const handleCreateBlank = async (data: { name: string; emoji: string; description: string }) => {
    const result = await createMap(data);
    setShowBlankModal(false);
    setShowPicker(false);
    if (result?.data) router.push(`/map/${result.data.id}`);
  };

  const handleCreateFromTemplate = async (data: { name: string; emoji: string; description: string; centerNode: string }) => {
    if (creating || !user || !selectedTemplate) return;
    setCreating(true);

    const result = await createMap({ name: data.name, emoji: data.emoji, description: data.description });
    if (!result?.data) { setCreating(false); return; }

    const mapId = result.data.id;
    const supabase = createClient();
    const accentColor = settings?.accent_color || '#3525cd';

    // Create center node
    const { data: rootNode } = await supabase.from('map_nodes').insert({
      user_id: user.id, map_id: mapId, parent_id: null,
      name: data.centerNode, type: 'user', hint: null, description: null, address: null, relationship: null,
      meta: {}, position_x: null, position_y: null,
      color: accentColor, display_mode: 'abc', shape: 'circle', abc: data.centerNode.charAt(0).toUpperCase(),
      outer_shape: 'circle', outer_color: accentColor, outer_size: 38, outer_solid: true,
      inner_shape: 'circle', inner_color: '#ffffff', inner_size: 16, inner_solid: true,
      image_url: null, tags: [],
    }).select().single();

    if (rootNode) {
      // Helper to build node data with circle-in-circle style
      const buildTemplateNode = (name: string, type: string, parentId: string) => {
        const preset = getPresetForType(type);
        return {
          user_id: user.id, map_id: mapId, parent_id: parentId,
          name, type, hint: null, description: null, address: null, relationship: null,
          meta: {}, position_x: null, position_y: null,
          color: preset.outer_color, display_mode: 'shape' as const, shape: 'circle',
          abc: name.charAt(0).toUpperCase(),
          outer_shape: 'circle', outer_color: preset.outer_color, outer_size: 28, outer_solid: false,
          inner_shape: 'circle', inner_color: preset.outer_color, inner_size: 5, inner_solid: true,
          image_url: null, tags: [],
        };
      };

      // Create children
      const childInserts = selectedTemplate.children.map((child) => buildTemplateNode(child.name, child.type, rootNode.id));
      const { data: childNodes } = await supabase.from('map_nodes').insert(childInserts).select();

      // Create grandchildren
      if (childNodes) {
        const grandchildInserts: any[] = [];
        selectedTemplate.children.forEach((child, i) => {
          if (child.children && childNodes[i]) {
            child.children.forEach((gc) => {
              grandchildInserts.push(buildTemplateNode(gc.name, gc.type, childNodes[i].id));
            });
          }
        });
        if (grandchildInserts.length > 0) {
          await supabase.from('map_nodes').insert(grandchildInserts);
        }
      }
    }

    setSelectedTemplate(null);
    setShowPicker(false);
    setCreating(false);
    router.push(`/map/${mapId}`);
  };

  const handleEdit = async (data: { name: string; emoji: string; description: string }) => {
    if (!editingMap) return;
    await updateMap(editingMap.id, data);
    setEditingMap(null);
  };

  if (userLoading || mapsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <NoddicLoader size={48} />
      </div>
    );
  }

  if (!user) { router.push('/login'); return null; }

  if (maps.length === 0) {
    return (
      <>
        <EmptyState onCreate={() => setShowPicker(true)} />
        {showPicker && <TemplatePicker onSelect={(t) => { setSelectedTemplate(t); setShowPicker(false); }} onBlank={() => { setShowPicker(false); setShowBlankModal(true); }} onClose={() => setShowPicker(false)} />}
        {showBlankModal && <MapModal onSave={handleCreateBlank} onClose={() => setShowBlankModal(false)} />}
        {selectedTemplate && <TemplateSetupModal template={selectedTemplate} onSave={handleCreateFromTemplate} onClose={() => setSelectedTemplate(null)} />}
      </>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-6 py-10 page-enter">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline font-extrabold text-3xl text-on-surface">My Maps</h1>
            <p className="text-on-surface-variant text-sm mt-1">{maps.length} {maps.length === 1 ? 'map' : 'maps'}</p>
          </div>
          <button onClick={() => setShowPicker(true)} className="silk-gradient text-white px-5 py-2.5 rounded-xl font-headline font-bold text-sm shadow-lg transition-all active:scale-[0.98] flex items-center gap-2"><Plus size={16} /> New Map</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {maps.map((map) => (
            <MapCard key={map.id} map={map} nodeCount={nodeCounts[map.id] || 0} onOpen={() => router.push(`/map/${map.id}`)} onEdit={() => setEditingMap(map)} onDelete={() => deleteMap(map.id)} />
          ))}
        </div>
      </div>

      {showPicker && <TemplatePicker onSelect={(t) => { setSelectedTemplate(t); setShowPicker(false); }} onBlank={() => { setShowPicker(false); setShowBlankModal(true); }} onClose={() => setShowPicker(false)} />}
      {showBlankModal && <MapModal onSave={handleCreateBlank} onClose={() => setShowBlankModal(false)} />}
      {selectedTemplate && <TemplateSetupModal template={selectedTemplate} onSave={handleCreateFromTemplate} onClose={() => setSelectedTemplate(null)} />}
      {editingMap && <MapModal initial={editingMap} onSave={handleEdit} onClose={() => setEditingMap(null)} />}
    </div>
  );
}
