import type { MapNode } from './types';

export interface Position {
  x: number;
  y: number;
}

export function computeRadialLayout(
  nodes: MapNode[],
  spacing = 220
): Record<string, Position> {
  if (!nodes.length) return {};

  const root = nodes.find((n) => !n.parent_id);
  if (!root) return {};

  // Build children map
  const childrenMap: Record<string, string[]> = {};
  nodes.forEach((n) => {
    if (n.parent_id && n.parent_id !== root.id) {
      if (!childrenMap[n.parent_id]) childrenMap[n.parent_id] = [];
      childrenMap[n.parent_id].push(n.id);
    } else if (n.id !== root.id) {
      // Orphan nodes (no parent_id or undefined) — attach to root
      if (!childrenMap[root.id]) childrenMap[root.id] = [];
      childrenMap[root.id].push(n.id);
    }
  });

  // Also add nodes that explicitly have root as parent
  nodes.forEach((n) => {
    if (n.parent_id === root.id) {
      if (!childrenMap[root.id]) childrenMap[root.id] = [];
      if (!childrenMap[root.id].includes(n.id)) {
        childrenMap[root.id].push(n.id);
      }
    }
  });

  const positions: Record<string, Position> = {};

  const countDescendants = (id: string): number => {
    const ch = childrenMap[id] || [];
    if (ch.length === 0) return 1;
    return ch.reduce((sum, c) => sum + countDescendants(c), 0);
  };

  const layoutNode = (
    id: string,
    depth: number,
    angleStart: number,
    angleEnd: number
  ) => {
    // Use saved position if it exists
    const node = nodes.find((n) => n.id === id);
    if (node?.position_x != null && node?.position_y != null) {
      positions[id] = { x: node.position_x, y: node.position_y };
    } else {
      const radius = depth * spacing;
      const angleMid = (angleStart + angleEnd) / 2;
      positions[id] = {
        x: Math.cos(angleMid) * radius,
        y: Math.sin(angleMid) * radius,
      };
    }

    const children = childrenMap[id] || [];
    if (children.length === 0) return;

    const totalWeight = children.reduce(
      (s, c) => s + countDescendants(c),
      0
    );
    let currentAngle = angleStart;

    children.forEach((cid) => {
      const weight = countDescendants(cid);
      const slice = ((angleEnd - angleStart) * weight) / totalWeight;
      layoutNode(cid, depth + 1, currentAngle, currentAngle + slice);
      currentAngle += slice;
    });
  };

  layoutNode(root.id, 0, 0, 2 * Math.PI);
  return positions;
}