import type { IPermissionGroup, IPermissionItem } from '../types/roles.types';

export type TGroupSelectionState = 'none' | 'some' | 'all';

/**
 * Computes whether none, some, or all permissions in a group are selected.
 */
export function getGroupSelectionState(
  permissions: IPermissionItem[],
  selectedKeysSet: Set<string>
): TGroupSelectionState {
  if (permissions.length === 0) return 'none';

  let selectedCount = 0;
  for (const p of permissions) {
    if (selectedKeysSet.has(p.key)) {
      selectedCount++;
    }
  }

  if (selectedCount === 0) return 'none';
  if (selectedCount === permissions.length) return 'all';
  return 'some';
}

/**
 * Computes changes between original role permissions and local draft permissions.
 */
export function calculatePermissionChanges(
  originalKeys: string[],
  draftKeys: string[]
): {
  added: string[];
  removed: string[];
  totalChanges: number;
} {
  const origSet = new Set(originalKeys);
  const draftSet = new Set(draftKeys);

  const added = draftKeys.filter((k) => !origSet.has(k));
  const removed = originalKeys.filter((k) => !draftSet.has(k));

  return {
    added,
    removed,
    totalChanges: added.length + removed.length,
  };
}

/**
 * Generic read dependency rule:
 * If a group contains a permission key ending in ':read', any other key in that group implies it.
 * When checking an action key, auto-enable the :read key if not already selected.
 */
export function applyReadDependency(
  group: IPermissionGroup,
  currentKeys: string[],
  checkedKey: string
): { updatedKeys: string[]; autoAddedRead: string | null } {
  const readPerm = group.permissions.find((p) => p.key.endsWith(':read'));
  const currentSet = new Set(currentKeys);

  currentSet.add(checkedKey);

  let autoAddedRead: string | null = null;
  if (readPerm && checkedKey !== readPerm.key && !currentSet.has(readPerm.key)) {
    currentSet.add(readPerm.key);
    autoAddedRead = readPerm.key;
  }

  return {
    updatedKeys: Array.from(currentSet),
    autoAddedRead,
  };
}

/**
 * Toggles a group's grantable permissions.
 * If all toggleable keys in the group are currently checked, unchecks them.
 * Otherwise, checks all toggleable keys (and ensures :read is enabled).
 */
export function toggleGroupKeys(
  group: IPermissionGroup,
  currentKeys: string[],
  grantableKeys: string[],
  canEdit: boolean
): { updatedKeys: string[]; autoAddedRead: boolean } {
  if (!canEdit) {
    return { updatedKeys: currentKeys, autoAddedRead: false };
  }

  const grantableSet = new Set(grantableKeys);
  const currentSet = new Set(currentKeys);
  const toggleable = group.permissions
    .map((p) => p.key)
    .filter((k) => grantableSet.has(k));

  if (toggleable.length === 0) {
    return { updatedKeys: currentKeys, autoAddedRead: false };
  }

  const allToggleableChecked = toggleable.every((k) => currentSet.has(k));
  let autoAddedRead = false;

  if (allToggleableChecked) {
    // Uncheck toggleable keys
    for (const k of toggleable) {
      currentSet.delete(k);
    }
  } else {
    // Check all toggleable keys
    for (const k of toggleable) {
      currentSet.add(k);
    }
    const readPerm = group.permissions.find((p) => p.key.endsWith(':read'));
    if (readPerm && !currentSet.has(readPerm.key) && grantableSet.has(readPerm.key)) {
      currentSet.add(readPerm.key);
      autoAddedRead = true;
    }
  }

  return {
    updatedKeys: Array.from(currentSet),
    autoAddedRead,
  };
}

