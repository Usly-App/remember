export type NodeType = 'user' | 'person' | 'place' | 'context';

export interface MapNode {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  type: NodeType;
  hint: string | null;
  description: string | null;
  address: string | null;
  relationship: string | null;
  meta: Record<string, any>;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  display_name: string;
  node_label: string; // custom terminology — default "Node"
  person_label: string;
  place_label: string;
  context_label: string;
  accent_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
}

export interface NodeTypeConfig {
  key: NodeType;
  label: string;
  color: string;
  icon: string;
}

export const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  display_name: '',
  node_label: 'Node',
  person_label: 'Person',
  place_label: 'Place',
  context_label: 'Context',
  accent_color: '#3525cd',
  secondary_color: '#4f46e5',
};

export function getNodeTypes(settings?: UserSettings | null): NodeTypeConfig[] {
  return [
    {
      key: 'user',
      label: 'You',
      color: settings?.accent_color || '#3525cd',
      icon: '◉',
    },
    {
      key: 'person',
      label: settings?.person_label || 'Person',
      color: '#4ECDC4',
      icon: '●',
    },
    {
      key: 'place',
      label: settings?.place_label || 'Place',
      color: '#FF6B6B',
      icon: '◆',
    },
    {
      key: 'context',
      label: settings?.context_label || 'Context',
      color: settings?.secondary_color || '#4f46e5',
      icon: '■',
    },
  ];
}
