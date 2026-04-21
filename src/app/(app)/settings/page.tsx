'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSettings, useMaps } from '@/lib/hooks';
import { DEFAULT_SETTINGS } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, Check, RotateCcw, Palette, Tag, User, Map, Trash2 } from 'lucide-react';

const ACCENT_PRESETS = [
  { name: 'Indigo', value: '#3525cd', secondary: '#4f46e5' },
  { name: 'Teal', value: '#0d9488', secondary: '#14b8a6' },
  { name: 'Rose', value: '#e11d48', secondary: '#f43f5e' },
  { name: 'Amber', value: '#d97706', secondary: '#f59e0b' },
  { name: 'Violet', value: '#7c3aed', secondary: '#8b5cf6' },
  { name: 'Emerald', value: '#059669', secondary: '#10b981' },
  { name: 'Slate', value: '#475569', secondary: '#64748b' },
  { name: 'Fuchsia', value: '#c026d3', secondary: '#d946ef' },
];

const BG_PRESETS = [
  { name: 'Default', value: '#fcf9f8' },
  { name: 'White', value: '#ffffff' },
  { name: 'Warm Gray', value: '#f5f0eb' },
  { name: 'Cool Gray', value: '#f0f2f5' },
  { name: 'Cream', value: '#faf7f0' },
  { name: 'Slate', value: '#e8ecf1' },
  { name: 'Dark', value: '#1c1b1b' },
  { name: 'Navy', value: '#0f172a' },
  { name: 'Charcoal', value: '#27272a' },
  { name: 'Midnight', value: '#111827' },
];

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser();
  const { settings, loading: settingsLoading, updateSettings } = useSettings(user?.id);
  const { maps } = useMaps(user?.id);
  const router = useRouter();

  const [form, setForm] = useState({
    display_name: DEFAULT_SETTINGS.display_name,
    node_label: DEFAULT_SETTINGS.node_label,
    person_label: DEFAULT_SETTINGS.person_label,
    place_label: DEFAULT_SETTINGS.place_label,
    context_label: DEFAULT_SETTINGS.context_label,
    accent_color: DEFAULT_SETTINGS.accent_color,
    secondary_color: DEFAULT_SETTINGS.secondary_color,
    map_bg_color: '#fcf9f8',
  });
  const [saved, setSaved] = useState(false);
  const [eraseConfirm, setEraseConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        display_name: settings.display_name,
        node_label: settings.node_label,
        person_label: settings.person_label,
        place_label: settings.place_label,
        context_label: settings.context_label,
        accent_color: settings.accent_color,
        secondary_color: settings.secondary_color,
        map_bg_color: settings.map_bg_color || '#fcf9f8',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleEraseData = async () => {
    if (!user) return;
    const supabase = createClient();
    // Delete all maps (cascades to nodes)
    await supabase.from('maps').delete().eq('user_id', user.id);
    // Delete any orphan nodes without map_id
    await supabase.from('map_nodes').delete().eq('user_id', user.id);
    setEraseConfirm(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (res.ok) {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account');
        setDeleting(false);
      }
    } catch {
      alert('Failed to delete account');
      setDeleting(false);
    }
  };

  if (userLoading || settingsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-surface-container-high border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) { router.push('/login'); return null; }

  const selectedAccent = ACCENT_PRESETS.find((p) => p.value === form.accent_color);
  const totalNodes = 0; // We don't have a quick count here, but that's fine

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto px-6 py-10 page-enter">
        <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-2">Settings</h1>
        <p className="text-on-surface-variant mb-10">Customize your Noddic experience.</p>

        {/* ── Profile ──────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <User size={18} className="text-primary" />
            </div>
            <h2 className="font-headline font-bold text-lg text-on-surface">Profile</h2>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-6 space-y-4">
            <div>
              <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Display Name</label>
              <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Email</label>
              <div className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant font-body text-sm">{user.email}</div>
            </div>
          </div>
        </section>

        {/* ── Terminology ──────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface">Terminology</h2>
              <p className="text-xs text-on-surface-variant">Rename the default labels to match how you think</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                { key: 'node_label' as const, label: 'Generic Node Label', placeholder: 'e.g. Connection, Dot, Pin', hint: 'Used in buttons like "Add [Node]"' },
                { key: 'person_label' as const, label: 'Person Label', placeholder: 'e.g. Person, Contact, Friend' },
                { key: 'place_label' as const, label: 'Place Label', placeholder: 'e.g. Place, Location, Spot' },
                { key: 'context_label' as const, label: 'Context Label', placeholder: 'e.g. Context, Group, Circle' },
              ]).map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{field.label}</label>
                  <input value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm" placeholder={field.placeholder} />
                  {field.hint && <p className="text-[11px] text-on-surface-variant/60 mt-1">{field.hint}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Accent Color ─────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface">Accent Color</h2>
              <p className="text-xs text-on-surface-variant">Changes your root nodes and UI highlights</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-6">
            <div className="flex flex-wrap gap-3">
              {ACCENT_PRESETS.map((preset) => (
                <button key={preset.value} onClick={() => setForm({ ...form, accent_color: preset.value, secondary_color: preset.secondary })} className="group relative w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${preset.value}, ${preset.secondary})`, borderColor: form.accent_color === preset.value ? preset.value : 'transparent', transform: form.accent_color === preset.value ? 'scale(1.1)' : 'scale(1)' }} title={preset.name}>
                  {form.accent_color === preset.value && <Check size={18} className="text-white" />}
                </button>
              ))}
            </div>
            {selectedAccent && <p className="text-sm text-on-surface-variant mt-3 font-headline">{selectedAccent.name}</p>}
            <div className="mt-4 flex items-center gap-3">
              <label className="text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider">Custom</label>
              <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value, secondary_color: e.target.value + 'cc' })} className="w-8 h-8 rounded-lg border border-outline-variant cursor-pointer" />
              <span className="text-xs text-on-surface-variant font-mono">{form.accent_color}</span>
            </div>
          </div>
        </section>

        {/* ── Map Background Color ─────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Map size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface">Map Background</h2>
              <p className="text-xs text-on-surface-variant">Default background color for your map canvas</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-6">
            <div className="flex flex-wrap gap-3 mb-4">
              {BG_PRESETS.map((preset) => {
                const isSelected = form.map_bg_color === preset.value;
                const isDark = ['#1c1b1b', '#0f172a', '#27272a', '#111827'].includes(preset.value);
                return (
                  <button key={preset.value} onClick={() => setForm({ ...form, map_bg_color: preset.value })} className="group flex flex-col items-center gap-1.5" title={preset.name}>
                    <div className="w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center" style={{ background: preset.value, borderColor: isSelected ? form.accent_color : isDark ? '#3a3a3a' : '#e5e2e1', transform: isSelected ? 'scale(1.1)' : 'scale(1)' }}>
                      {isSelected && <Check size={16} className={isDark ? 'text-white' : 'text-on-surface'} />}
                    </div>
                    <span className="text-[10px] font-headline text-on-surface-variant">{preset.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider">Custom</label>
              <input type="color" value={form.map_bg_color} onChange={(e) => setForm({ ...form, map_bg_color: e.target.value })} className="w-8 h-8 rounded-lg border border-outline-variant cursor-pointer" />
              <span className="text-xs text-on-surface-variant font-mono">{form.map_bg_color}</span>
            </div>
            {/* Preview */}
            <div className="mt-4">
              <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Preview</label>
              <div className="h-24 rounded-xl border border-surface-container-high overflow-hidden relative" style={{ background: form.map_bg_color }}>
                <svg width="100%" height="100%" className="absolute inset-0">
                  <pattern id="settings-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="0.6" fill={['#1c1b1b', '#0f172a', '#27272a', '#111827'].includes(form.map_bg_color) ? '#ffffff' : '#c7c4d8'} opacity="0.3" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#settings-grid)" />
                  {/* Mini node preview */}
                  <circle cx="50%" cy="50%" r="12" fill={form.accent_color} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="800" fontFamily="Manrope, sans-serif">Y</text>
                  <circle cx="30%" cy="40%" r="8" fill="none" stroke="#4ECDC4" strokeWidth="1.5" />
                  <circle cx="70%" cy="40%" r="8" fill="none" stroke="#FF6B6B" strokeWidth="1.5" />
                  <circle cx="40%" cy="70%" r="8" fill="none" stroke="#4f46e5" strokeWidth="1.5" />
                  <line x1="50%" y1="50%" x2="30%" y2="40%" stroke="#4ECDC4" strokeWidth="1" opacity="0.3" />
                  <line x1="50%" y1="50%" x2="70%" y2="40%" stroke="#FF6B6B" strokeWidth="1" opacity="0.3" />
                  <line x1="50%" y1="50%" x2="40%" y2="70%" stroke="#4f46e5" strokeWidth="1" opacity="0.3" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* ── Save Button ──────────────────────────────────── */}
        <div className="mb-10">
          <button onClick={handleSave} className="text-white px-10 py-3.5 rounded-xl font-headline font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${form.accent_color}, ${form.secondary_color})` }}>
            {saved ? (<><Check size={18} /> Saved!</>) : 'Save Settings'}
          </button>
        </div>

        {/* ── Danger Zone ──────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center">
              <AlertTriangle size={18} className="text-error" />
            </div>
            <h2 className="font-headline font-bold text-lg text-error">Danger Zone</h2>
          </div>

          {/* Erase Data */}
          <div className="bg-surface-container-lowest rounded-2xl border border-error/20 p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-headline font-semibold text-on-surface">Erase All Map Data</p>
                <p className="text-sm text-on-surface-variant">
                  Delete all maps ({maps.length}) and their nodes. Your account and settings will be kept. This cannot be undone.
                </p>
              </div>
              {!eraseConfirm ? (
                <button onClick={() => setEraseConfirm(true)} className="flex-shrink-0 px-5 py-2.5 rounded-xl border border-error/30 text-error font-headline font-semibold text-sm hover:bg-error/5 transition flex items-center gap-2">
                  <RotateCcw size={14} /> Erase Data
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEraseConfirm(false)} className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-headline font-semibold text-sm hover:bg-surface-container transition">Cancel</button>
                  <button onClick={handleEraseData} className="px-5 py-2.5 rounded-xl bg-error text-white font-headline font-bold text-sm transition-all active:scale-[0.98]">Yes, erase everything</button>
                </div>
              )}
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-surface-container-lowest rounded-2xl border border-error/20 p-6">
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-headline font-semibold text-on-surface">Delete Account</p>
                <p className="text-sm text-on-surface-variant">
                  Permanently delete your account, all maps, all nodes, all images, and all settings. This action is irreversible.
                </p>
              </div>
              {!deleteConfirm ? (
                <button onClick={() => setDeleteConfirm(true)} className="self-start px-5 py-2.5 rounded-xl border border-error/30 text-error font-headline font-semibold text-sm hover:bg-error/5 transition flex items-center gap-2">
                  <Trash2 size={14} /> Delete Account
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-error font-headline font-semibold">
                    Type DELETE to confirm
                  </p>
                  <input value={deleteText} onChange={(e) => setDeleteText(e.target.value.toUpperCase())} className="w-full max-w-xs px-4 py-3 rounded-xl border border-error/30 bg-white text-on-surface font-mono text-center focus:outline-none focus:ring-2 focus:ring-error/20 transition" placeholder="DELETE" />
                  <div className="flex gap-2">
                    <button onClick={() => { setDeleteConfirm(false); setDeleteText(''); }} className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-headline font-semibold text-sm hover:bg-surface-container transition">Cancel</button>
                    <button onClick={handleDeleteAccount} disabled={deleteText !== 'DELETE' || deleting} className="px-5 py-2.5 rounded-xl bg-error text-white font-headline font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40 flex items-center gap-2">
                      {deleting ? 'Deleting…' : 'Permanently Delete Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
