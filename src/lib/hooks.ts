'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MapNode, UserSettings } from '@/lib/types';
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

// ─── Nodes Hook ───────────────────────────────────────────────────
export function useNodes(userId: string | undefined) {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNodes = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('map_nodes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    setNodes(data || []);
    setLoading(false);
  }, [userId]);

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
      .insert({ ...node, user_id: userId })
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
    // Collect all descendant IDs to remove from local state
    const toDelete = new Set<string>();
    const collect = (nid: string) => {
      toDelete.add(nid);
      nodes.filter((n) => n.parent_id === nid).forEach((n) => collect(n.id));
    };
    collect(id);

    const supabase = createClient();
    // Cascade delete is handled by FK, just delete the root
    const { error } = await supabase.from('map_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
    }
    return { error };
  };

  const deleteAllNodes = async () => {
    if (!userId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('map_nodes')
      .delete()
      .eq('user_id', userId);
    if (!error) setNodes([]);
    return { error };
  };

  return { nodes, loading, addNode, updateNode, deleteNode, deleteAllNodes, refetch: fetchNodes };
}
