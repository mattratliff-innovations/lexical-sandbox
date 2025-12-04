/* eslint-disable no-restricted-syntax */
const issuesByEditor = new Map(); // editorId -> Issue[]
const eligibility = new Map(); // editorId -> boolean (from LexicalEditor.editable)
const listeners = new Set();
const applyListeners = new Map();

function flattenUniqueEligible() {
  const seen = new Set();
  const out = [];
  for (const [id, arr] of issuesByEditor.entries()) {
    // eslint-disable-next-line no-continue
    if (!eligibility.get(id)) continue; // only editors marked eligible
    for (const it of arr || []) {
      // nodeKey is stable; fall back to a composite if missing
      const key = it?.nodeKey || `${id}:${it?.originalText}:${it?.issueType}`;
      if (!seen.has(key)) {
        seen.add(key);
        // out.push(it);
        out.push({ ...it, editorId: id });
      }
    }
  }
  return out;
}

export function setEligible(editorId, isEligible) {
  eligibility.set(editorId, !!isEligible);
  const merged = flattenUniqueEligible();
  listeners.forEach((cb) => cb(merged));
}

export function publishIssues(editorId, issues) {
  issuesByEditor.set(editorId, Array.isArray(issues) ? issues : []);
  const merged = flattenUniqueEligible();
  listeners.forEach((cb) => cb(merged));
}

export function subscribeIssues(cb) {
  listeners.add(cb);
  cb(flattenUniqueEligible()); // immediate snapshot
  return () => listeners.delete(cb);
}

export function registerApplyHandler(editorId, handler) {
  applyListeners.set(editorId, handler);
  return () => applyListeners.delete(editorId);
}

export function requestApplySuggestion(editorId, nodeKey, suggestion, originalText) {
  const handler = applyListeners.get(editorId);
  if (handler) handler(nodeKey, suggestion, originalText);
}

export function requestIgnoreError(editorId, nodeKey, originalText, issueType) {
  const handler = applyListeners.get(editorId);
  if (handler) handler(nodeKey, null, originalText, issueType, 'ignore');
}
