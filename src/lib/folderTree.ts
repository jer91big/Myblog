import type { NoteFolder } from '../types';

export interface FolderNode extends NoteFolder {
  children: FolderNode[];
  depth: number;
}

/**
 * 把扁平文件夹列表构建成树。
 * 容错：父节点缺失、自引用或数据成环时，相关节点会被提升为顶层节点，
 * 保证任何文件夹都不会从侧边栏消失，也不会产生无限递归。
 */
export function buildFolderTree(folders: NoteFolder[]): FolderNode[] {
  const nodeById = new Map<string, FolderNode>();
  for (const folder of folders) {
    nodeById.set(folder.id, { ...folder, children: [], depth: 0 });
  }

  const childrenByParent = new Map<string | null, string[]>();
  for (const folder of folders) {
    const parentId =
      folder.parentId && nodeById.has(folder.parentId) && folder.parentId !== folder.id
        ? folder.parentId
        : null;
    const siblings = childrenByParent.get(parentId);
    if (siblings) siblings.push(folder.id);
    else childrenByParent.set(parentId, [folder.id]);
  }

  const visited = new Set<string>();

  // visited 在递归前标记，因此即使 childrenByParent 里存在环也不会重复展开
  const build = (id: string, depth: number): FolderNode => {
    const node = nodeById.get(id) as FolderNode;
    visited.add(id);
    node.depth = depth;
    node.children = (childrenByParent.get(id) ?? [])
      .filter((childId) => !visited.has(childId))
      .map((childId) => build(childId, depth + 1));
    return node;
  };

  const roots: FolderNode[] = [];
  for (const id of childrenByParent.get(null) ?? []) {
    if (!visited.has(id)) roots.push(build(id, 0));
  }
  // 剩下的是因数据成环而无法从顶层到达的节点
  for (const folder of folders) {
    if (!visited.has(folder.id)) roots.push(build(folder.id, 0));
  }

  return roots;
}

/** 先序遍历展平，用于 <select> 这类无法嵌套渲染的场景 */
export function flattenTree(nodes: FolderNode[]): FolderNode[] {
  const result: FolderNode[] = [];
  const walk = (list: FolderNode[]) => {
    for (const node of list) {
      result.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

/** 返回祖先 id，顺序为「顶层 → 直接父级」 */
export function getAncestorIds(folders: NoteFolder[], id: string): string[] {
  const parentById = new Map(folders.map((f) => [f.id, f.parentId]));
  const ancestors: string[] = [];
  const seen = new Set<string>([id]);

  let current = parentById.get(id) ?? null;
  while (current && !seen.has(current)) {
    seen.add(current);
    ancestors.push(current);
    current = parentById.get(current) ?? null;
  }

  return ancestors.reverse();
}

/** 返回全部子孙 id（不含自身） */
export function collectDescendantIds(folders: NoteFolder[], id: string): string[] {
  const childrenOf = new Map<string, string[]>();
  for (const folder of folders) {
    if (!folder.parentId) continue;
    const siblings = childrenOf.get(folder.parentId);
    if (siblings) siblings.push(folder.id);
    else childrenOf.set(folder.parentId, [folder.id]);
  }

  const visited = new Set<string>([id]);
  const result: string[] = [];
  const queue: string[] = [id];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const childId of childrenOf.get(current) ?? []) {
      if (visited.has(childId)) continue;
      visited.add(childId);
      result.push(childId);
      queue.push(childId);
    }
  }

  return result;
}
