import { NoteFolder } from '../models/NoteFolder.js';

/** folderId -> parentId (null = 顶层) */
export type ParentMap = Map<string, string | null>;

/** 一次查询取得所有文件夹的父子关系，避免在遍历中反复查库 */
export async function loadFolderParentMap(): Promise<ParentMap> {
  const docs = await NoteFolder.find({}, { parentId: 1 }).lean();
  const map: ParentMap = new Map();
  for (const doc of docs) {
    map.set(
      doc._id.toString(),
      doc.parentId ? doc.parentId.toString() : null
    );
  }
  return map;
}

/** 由父子关系表构建 父id -> 子id[] 的索引 */
export function buildChildrenMap(parentOf: ParentMap): Map<string, string[]> {
  const childrenOf = new Map<string, string[]>();
  for (const [id, parent] of parentOf) {
    if (parent === null) continue;
    const siblings = childrenOf.get(parent);
    if (siblings) siblings.push(id);
    else childrenOf.set(parent, [id]);
  }
  return childrenOf;
}

/**
 * 返回 rootId 及其全部子孙的 id（含自身）。
 * 用 visited 集合兜底，即使数据里存在环也不会死循环。
 */
export function collectSubtreeIds(parentOf: ParentMap, rootId: string): string[] {
  const childrenOf = buildChildrenMap(parentOf);
  const visited = new Set<string>();
  const result: string[] = [];
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (visited.has(id)) continue;
    visited.add(id);
    result.push(id);
    const children = childrenOf.get(id);
    if (children) queue.push(...children);
  }

  return result;
}

/**
 * 判断把 movedId 挂到 newParentId 之下是否形成环。
 * 做法：从目标父节点向上回溯，若遇到 movedId 则说明目标在 movedId 的子树内。
 * 数据中既有环（不含 movedId）时提前返回 false，不会误判也不会死循环。
 */
export function wouldCreateCycle(
  parentOf: ParentMap,
  movedId: string,
  newParentId: string
): boolean {
  if (newParentId === movedId) return true;

  const visited = new Set<string>([movedId]);
  let current: string | null = newParentId;

  while (current !== null) {
    if (current === movedId) return true;
    if (visited.has(current)) return false;
    visited.add(current);
    // 父节点缺失（悬空引用）时按顶层处理，自然终止
    current = parentOf.get(current) ?? null;
  }

  return false;
}
