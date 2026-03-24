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

  const root = nodes.find((n) => n.type === 'user');
  if (!root) return {};

  // Build children map
  const childrenMap: Record<string, string[]> = {};
  nodes.forEach((n) => {
    if (n.parent_id) {
      if (!childrenMap[n.parent_id]) childrenMap[n.parent_id] = [];
      childrenMap[n.parent_id].push(n.id);
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
    const radius = depth * spacing;
    const angleMid = (angleStart + angleEnd) / 2;
    positions[id] = {
      x: Math.cos(angleMid) * radius,
      y: Math.sin(angleMid) * radius,
    };

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
