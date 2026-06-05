export function markChecklistDone(userId: string, itemId: string) {
  const key = `checklist_${userId}`;
  const existing: Record<string, boolean> = (() => {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
  })();
  localStorage.setItem(key, JSON.stringify({ ...existing, [itemId]: true }));
  window.dispatchEvent(new CustomEvent('checklist-updated'));
}
