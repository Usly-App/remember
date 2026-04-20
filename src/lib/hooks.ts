'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MapNode, UserSettings, MapRecord } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

// ─── Auth Hook ────────────────────────────────────────────────────
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

// ─── Settings Hook ────────────────────────────────────────────────
export function useSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    setSettings(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!userId || !settings) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (!error && data) setSettings(data);
    return { data, error };
  };

  return { settings, loading, updateSettings, refetch: fetchSettings };
}

// ─── Maps Hook ────────────────────────────────────────────────────
export function useMaps(userId: string | undefined) {
  const [maps, setMaps] = useState<MapRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaps = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('maps')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    setMaps(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  const createMap = async (map: { name: string; emoji?: string; description?: string }) => {
    if (!userId) return null;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('maps')
      .insert({
        user_id: userId,
        name: map.name,
        emoji: map.emoji || '🗺️',
        description: map.description || null,
      })
      .select()
      .single();
    if (!error && data) {
      setMaps((prev) => [data, ...prev]);
    }
    return { data, error };
  };

  const updateMap = async (id: string, updates: Partial<MapRecord>) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('maps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      setMaps((prev) => prev.map((m) => (m.id === id ? data : m)));
    }
    return { data, error };
  };

  const deleteMap = async (id: string) => {
    const supabase = createClient();
    // Nodes are cascade-deleted by FK
    const { error } = await supabase.from('maps').delete().eq('id', id);
    if (!error) {
      setMaps((prev) => prev.filter((m) => m.id !== id));
    }
    return { error };
  };

  return { maps, loading, createMap, updateMap, deleteMap, refetch: fetchMaps };
}

// ─── Nodes Hook (scoped to a map) ────────────────────────────────
export function useNodes(userId: string | undefined, mapId?: string) {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNodes = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    let query = supabase
      .from('map_nodes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (mapId) {
      query = query.eq('map_id', mapId);
    }

    const { data } = await query;
    setNodes(data || []);
    setLoading(false);
  }, [userId, mapId]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const addNode = async (
    node: Omit<MapNode, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!userId) return null;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('map_nodes')
      .insert({ ...node, user_id: userId, map_id: node.map_id || mapId || null })
      .select()
      .single();
    if (!error && data) {
      setNodes((prev) => [...prev, data]);
    }
    return { data, error };
  };

  const updateNode = async (id: string, updates: Partial<MapNode>) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('map_nodes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      setNodes((prev) => prev.map((n) => (n.id === id ? data : n)));
    }
    return { data, error };
  };

  const deleteNode = async (id: string) => {
    const toDelete = new Set<string>();
    const collect = (nid: string) => {
      toDelete.add(nid);
      nodes.filter((n) => n.parent_id === nid).forEach((n) => collect(n.id));
    };
    collect(id);

    const supabase = createClient();
    const { error } = await supabase.from('map_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
    }
    return { error };
  };

  const deleteAllNodes = async () => {
    if (!userId) return;
    const supabase = createClient();
    let query = supabase.from('map_nodes').delete().eq('user_id', userId);
    if (mapId) {
      query = query.eq('map_id', mapId);
    }
    const { error } = await query;
    if (!error) setNodes([]);
    return { error };
  };

  return { nodes, loading, addNode, updateNode, deleteNode, deleteAllNodes, refetch: fetchNodes };
}