export type NodeType = string;

export interface MapRecord {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MapNode {
  id: string;
  user_id: string;
  parent_id: string | null;
  map_id: string | null;
  name: string;
  type: string;
  hint: string | null;
  description: string | null;
  address: string | null;
  relationship: string | null;
  meta: Record<string, any>;
  position_x: number | null;
  position_y: number | null;
  color: string | null;
  display_mode: string | null;
  shape: string | null;
  abc: string | null;
  outer_shape: string | null;
  outer_color: string | null;
  outer_size: number | null;
  outer_solid: boolean | null;
  inner_shape: string | null;
  inner_color: string | null;
  inner_size: number | null;
  inner_solid: boolean | null;
  image_url: string | null;
  tags: string[];
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  display_name: string;
  node_label: string;
  person_label: string;
  place_label: string;
  context_label: string;
  accent_color: string;
  secondary_color: string;
  map_bg_color: string;
  created_at: string;
  updated_at: string;
}

export interface NodePreset {
  type: string;
  label: string;
  outer_color: string;
  inner_color: string;
  outer_shape: string;
  inner_shape: string;
  outer_size: number;
  inner_size: number;
  outer_solid: boolean;
  inner_solid: boolean;
  display_mode: 'shape' | 'abc';
  icon: string;
}

export const SHAPES = [
  { key: 'circle', label: 'Circle' },
  { key: 'square', label: 'Square' },
  { key: 'diamond', label: 'Diamond' },
  { key: 'triangle', label: 'Triangle' },
  { key: 'hexagon', label: 'Hexagon' },
  { key: 'star', label: 'Star' },
  { key: 'pentagon', label: 'Pentagon' },
  { key: 'octagon', label: 'Octagon' },
];

export const NODE_COLORS = [
  '#3525cd',
  '#4f46e5',
  '#4ECDC4',
  '#FF6B6B',
  '#A78BFA',
  '#E8A838',
  '#059669',
  '#e11d48',
  '#0d9488',
  '#d97706',
  '#7c3aed',
  '#475569',
];

export const NODE_PRESETS: NodePreset[] = [
  { type: 'person', label: 'Person', outer_color: '#4ECDC4', inner_color: '#4ECDC4', outer_shape: 'circle', inner_shape: 'circle', outer_size: 28, inner_size: 5, outer_solid: false, inner_solid: true, display_mode: 'shape', icon: '●' },
  { type: 'place', label: 'Place', outer_color: '#FF6B6B', inner_color: '#FF6B6B', outer_shape: 'diamond', inner_shape: 'diamond', outer_size: 28, inner_size: 6, outer_solid: false, inner_solid: true, display_mode: 'shape', icon: '◆' },
  { type: 'context', label: 'Context', outer_color: '#4f46e5', inner_color: '#4f46e5', outer_shape: 'square', inner_shape: 'square', outer_size: 28, inner_size: 5, outer_solid: false, inner_solid: true, display_mode: 'shape', icon: '■' },
  { type: 'thing', label: 'Thing', outer_color: '#E8A838', inner_color: '#E8A838', outer_shape: 'triangle', inner_shape: 'triangle', outer_size: 28, inner_size: 6, outer_solid: false, inner_solid: true, display_mode: 'shape', icon: '▲' },
  { type: 'idea', label: 'Idea', outer_color: '#A78BFA', inner_color: '#A78BFA', outer_shape: 'star', inner_shape: 'star', outer_size: 28, inner_size: 7, outer_solid: false, inner_solid: true, display_mode: 'shape', icon: '★' },
  { type: 'event', label: 'Event', outer_color: '#059669', inner_color: '#059669', outer_shape: 'hexagon', inner_shape: 'circle', outer_size: 28, inner_size: 5, outer_solid: false, inner_solid: true, display_mode: 'shape', icon: '⬡' },
  { type: 'group', label: 'Group', outer_color: '#0d9488', inner_color: '#0d9488', outer_shape: 'pentagon', inner_shape: 'circle', outer_size: 28, inner_size: 5, outer_solid: false, inner_solid: true, display_mode: 'shape', icon: '⬠' },
  { type: 'note', label: 'Note', outer_color: '#475569', inner_color: '#475569', outer_shape: 'octagon', inner_shape: 'circle', outer_size: 28, inner_size: 5, outer_solid: false, inner_solid: true, display_mode: 'shape', icon: '⯃' },
];

export const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  display_name: '',
  node_label: 'Node',
  person_label: 'Person',
  place_label: 'Place',
  context_label: 'Context',
  accent_color: '#3525cd',
  secondary_color: '#4f46e5',
  map_bg_color: '#fcf9f8',
};

// ─── Helper getters ─────────────────────────────────────────────────

export function getNodeOuterColor(node: MapNode, settings?: UserSettings | null): string {
  if (node.outer_color) return node.outer_color;
  if (node.color) return node.color;
  if (node.type === 'user') return settings?.accent_color || '#3525cd';
  const preset = NODE_PRESETS.find((p) => p.type === node.type);
  return preset?.outer_color || '#4f46e5';
}

export function getNodeInnerColor(node: MapNode, settings?: UserSettings | null): string {
  if (node.inner_color) return node.inner_color;
  if (node.color) return node.color;
  if (node.type === 'user') return '#ffffff';
  const preset = NODE_PRESETS.find((p) => p.type === node.type);
  return preset?.inner_color || '#4f46e5';
}

export function getNodeOuterShape(node: MapNode): string {
  return node.outer_shape || node.shape || 'circle';
}

export function getNodeInnerShape(node: MapNode): string {
  return node.inner_shape || 'circle';
}

export function getNodeOuterSize(node: MapNode, isRoot: boolean): number {
  if (node.outer_size) return node.outer_size;
  return isRoot ? 38 : 28;
}

export function getNodeInnerSize(node: MapNode, isRoot: boolean): number {
  if (node.inner_size) return node.inner_size;
  return isRoot ? 16 : 5;
}

export function getNodeOuterSolid(node: MapNode, isRoot: boolean): boolean {
  if (node.outer_solid != null) return node.outer_solid;
  return isRoot;
}

export function getNodeInnerSolid(node: MapNode): boolean {
  if (node.inner_solid != null) return node.inner_solid;
  return true;
}

export function getNodeDisplayMode(node: MapNode): 'shape' | 'abc' {
  if (node.display_mode === 'abc') return 'abc';
  if (node.type === 'user' && !node.display_mode) return 'abc';
  return (node.display_mode as 'shape' | 'abc') || 'shape';
}

export function getNodeAbc(node: MapNode): string {
  if (node.abc) return node.abc;
  return node.name.charAt(0).toUpperCase();
}