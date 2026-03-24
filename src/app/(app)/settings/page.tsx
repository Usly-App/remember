'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSettings, useNodes } from '@/lib/hooks';
import { DEFAULT_SETTINGS } from '@/lib/types';
import { AlertTriangle, Check, RotateCcw, Palette, Tag, User } from 'lucide-react';

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

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser();
  const { settings, loading: settingsLoading, updateSettings } = useSettings(user?.id);
  const { nodes, deleteAllNodes } = useNodes(user?.id);
  const router = useRouter();

  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [eraseConfirm, setEraseConfirm] = useState(false);

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
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleErase = async () => {
    await deleteAllNodes();
    setEraseConfirm(false);
  };

  if (userLoading || settingsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-surface-container-high border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const selectedPreset = ACCENT_PRESETS.find((p) => p.value === form.accent_color);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto px-6 py-10 page-enter">
        <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-2">Settings</h1>
        <p className="text-on-surface-variant mb-10">
          Customize your map experience.
        </p>

        {/* ── Profile ────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <User size={18} className="text-primary" />
            </div>
            <h2 className="font-headline font-bold text-lg text-on-surface">Profile</h2>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-6 space-y-4">
            <div>
              <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant font-body text-sm">
                {user.email}
              </div>
            </div>
          </div>
        </section>

        {/* ── Terminology ────────────────────────────────── */}
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
              {[
                { key: 'node_label' as const, label: 'Generic Node Label', placeholder: 'e.g. Connection, Dot, Pin', hint: 'Used in buttons like "Add [Node]"' },
                { key: 'person_label' as const, label: 'Person Label', placeholder: 'e.g. Person, Contact, Friend' },
                { key: 'place_label' as const, label: 'Place Label', placeholder: 'e.g. Place, Location, Spot' },
                { key: 'context_label' as const, label: 'Context Label', placeholder: 'e.g. Context, Group, Circle' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    {field.label}
                  </label>
                  <input
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                    placeholder={field.placeholder}
                  />
                  {field.hint && (
                    <p className="text-[11px] text-on-surface-variant/60 mt-1">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Accent Color ───────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface">Accent Color</h2>
              <p className="text-xs text-on-surface-variant">Changes your root node and UI highlights</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-6">
            <div className="flex flex-wrap gap-3">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() =>
                    setForm({
                      ...form,
                      accent_color: preset.value,
                      secondary_color: preset.secondary,
                    })
                  }
                  className="group relative w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${preset.value}, ${preset.secondary})`,
                    borderColor: form.accent_color === preset.value ? preset.value : 'transparent',
                    transform: form.accent_color === preset.value ? 'scale(1.1)' : 'scale(1)',
                  }}
                  title={preset.name}
                >
                  {form.accent_color === preset.value && (
                    <Check size={18} className="text-white" />
                  )}
                </button>
              ))}
            </div>
            {selectedPreset && (
              <p className="text-sm text-on-surface-variant mt-3 font-headline">
                {selectedPreset.name}
              </p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <label className="text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider">
                Custom
              </label>
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accent_color: e.target.value,
                    secondary_color: e.target.value + 'cc',
                  })
                }
                className="w-8 h-8 rounded-lg border border-outline-variant cursor-pointer"
              />
              <span className="text-xs text-on-surface-variant font-mono">
                {form.accent_color}
              </span>
            </div>
          </div>
        </section>

        {/* ── Save Button ────────────────────────────────── */}
        <div className="mb-10">
          <button
            onClick={handleSave}
            className="silk-gradient text-white px-10 py-3.5 rounded-xl font-headline font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${form.accent_color}, ${form.secondary_color})`,
            }}
          >
            {saved ? (
              <>
                <Check size={18} /> Saved!
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>

        {/* ── Danger Zone ────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center">
              <AlertTriangle size={18} className="text-error" />
            </div>
            <h2 className="font-headline font-bold text-lg text-error">Danger Zone</h2>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-error/20 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-headline font-semibold text-on-surface">Erase All Map Data</p>
                <p className="text-sm text-on-surface-variant">
                  Delete all {nodes.length} nodes and start with a fresh map. This cannot be undone.
                </p>
              </div>
              {!eraseConfirm ? (
                <button
                  onClick={() => setEraseConfirm(true)}
                  className="flex-shrink-0 px-5 py-2.5 rounded-xl border border-error/30 text-error font-headline font-semibold text-sm hover:bg-error/5 transition flex items-center gap-2"
                >
                  <RotateCcw size={14} /> Erase Data
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEraseConfirm(false)}
                    className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-headline font-semibold text-sm hover:bg-surface-container transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleErase}
                    className="px-5 py-2.5 rounded-xl bg-error text-white font-headline font-bold text-sm transition-all active:scale-[0.98]"
                  >
                    Yes, erase everything
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
