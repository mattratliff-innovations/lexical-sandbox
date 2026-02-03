/* eslint-disable import-x/extensions */
/* eslint-disable no-use-before-define */
import { useCallback, useEffect, useState } from 'react';

import { useEditorDirtyTracking } from './useEditorDirtyTracking.js';

/**
 * LetterChangeTracker
 * Used to track structural changes in the letter
 * 1. Section content changes - Lexical editor modifications within section editors (excluding startsWith/endsWith)
 * 2. Add/Remove sections - Changes to the sectionAttributes length
 * 3. Reordering sections - Change to section ID sequence based on order
 * 
 * Note: This tracker does NOT continuously check for changes. Instead, it provides a 
 * checkForChanges() function that should be called on-demand (e.g., before navigation).
 */

/**
 * Hook to track changes to letter structure
 * Handles: add/remove sections, reorder sections
 *
 * @param {Function} getCurrentLetter - Function that returns current letter data
 * @param {Object} initialLetter - Initial/saved letter data
 * @returns {Object} - { checkStructureChanges }
 */
export function useLetterStructureTracking(getCurrentLetter, initialLetter) {
  const checkStructureChanges = useCallback(() => {
    const currentLetter = getCurrentLetter();
    
    if (!initialLetter || !currentLetter) {
      return { hasChanges: false, changeType: null };
    }

    // Filter out sections marked for destruction (_destroy)
    const currentActiveSections = (currentLetter.sectionsAttributes || currentLetter.sections || [])
      .filter(s => s._destroy === undefined || s._destroy === false || s._destroy === 0);
    const initialActiveSections = (initialLetter.sectionsAttributes || initialLetter.sections || [])
      .filter(s => s._destroy === undefined || s._destroy === false || s._destroy === 0);

    // 1. Check if sections were added/removed
    const sectionsCountChanged = currentActiveSections.length !== initialActiveSections.length;

    // 2. Check if sections were reordered
    const sectionsReordered = checkSectionsReordered(currentActiveSections, initialActiveSections);

    const hasChanges = sectionsCountChanged || sectionsReordered;

    let changeType = null;
    if (hasChanges) {
      if (sectionsCountChanged) {
        changeType = 'sections_count';
      } else if (sectionsReordered) {
        changeType = 'sections_reorder';
      }
    }

    return { hasChanges, changeType };
  }, [getCurrentLetter, initialLetter]);

  return { checkStructureChanges };
}

/**
 * Check if sections have been reordered by comparing ID sequence
 * Compares array position, not the 'order' field (which may not be updated during reordering)
 */
function checkSectionsReordered(currentSections, initialSections) {
  if (!currentSections || !initialSections) return false;
  if (currentSections.length !== initialSections.length) return false;

  // Compare ID sequence in array order (don't sort by 'order' field)
  // The array position IS the order after reordering via swapSections
  const currentIds = currentSections.map((s) => s.id || s.frontEndId);
  const initialIds = initialSections.map((s) => s.id || s.frontEndId);

  return !arraysEqual(currentIds, initialIds);
}

/**
 * Compare two arrays for equality
 */
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * Main component that coordinates letter change tracking
 * Tracks structural changes (add/remove/reorder sections) and editor content changes
 * 
 * Does NOT continuously check - provides checkForChanges() function instead
 */
export function LetterChangeTracker({ letterEditorRef, initialLetter, children }) {
  // Get current letter from ref (always up-to-date)
  const getCurrentLetter = useCallback(() => {
    return letterEditorRef.current?.draftState || null;
  }, [letterEditorRef]);

  // Track structure changes
  const { checkStructureChanges } = useLetterStructureTracking(getCurrentLetter, initialLetter);

  // Track section editor content changes
  const [dirtySectionEditors, setDirtySectionEditors] = useState(new Set());
  const [sectionEditorTracking, setSectionEditorTracking] = useState({});

  // Callback when individual section editor becomes dirty
  const handleSectionEditorDirty = useCallback((sectionId, isDirty) => {
    setDirtySectionEditors((prev) => {
      const next = new Set(prev);
      if (isDirty) {
        next.add(sectionId);
      } else {
        next.delete(sectionId);
      }
      return next;
    });
  }, []);

  // Register section editor tracking
  const registerSectionEditor = useCallback((sectionId, editor, tracking) => {
    setSectionEditorTracking((prev) => ({
      ...prev,
      [sectionId]: { editor, tracking },
    }));
  }, []);

  // Unregister section editor tracking
  const unregisterSectionEditor = useCallback((sectionId) => {
    setSectionEditorTracking((prev) => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
    setDirtySectionEditors((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  }, []);

  // Mark all editors as clean (after save)
  const markAllClean = useCallback(() => {
    // Reset all section editors
    Object.values(sectionEditorTracking).forEach(({ tracking }) => {
      tracking?.markClean();
    });

    setDirtySectionEditors(new Set());
  }, [sectionEditorTracking]);

  // Manual check for changes - call this before navigation
  const checkForChanges = useCallback(() => {
    const { hasChanges: hasStructureChanges, changeType: structureChangeType } = checkStructureChanges();
    const hasEditorChanges = dirtySectionEditors.size > 0;
    const hasAnyChanges = hasStructureChanges || hasEditorChanges;

    return {
      hasChanges: hasAnyChanges,
      hasStructureChanges,
      hasEditorChanges,
      structureChangeType,
      dirtySections: Array.from(dirtySectionEditors),
      changeDetails: {
        sectionsCount: structureChangeType === 'sections_count',
        sectionsReorder: structureChangeType === 'sections_reorder',
        sectionContent: hasEditorChanges,
      },
    };
  }, [checkStructureChanges, dirtySectionEditors]);

  // Provide context to children
  return children({
    // State for button display (doesn't trigger structure check)
    hasDirtyEditors: dirtySectionEditors.size > 0,
    dirtyEditorsCount: dirtySectionEditors.size,
    
    // Methods
    checkForChanges, // Call this on-demand only
    registerSectionEditor,
    unregisterSectionEditor,
    handleSectionEditorDirty,
    markAllClean,

    // Debug info
    sectionEditorTracking,
    dirtySectionEditors,
  });
}

/**
 * Component wrapper for individual section editors
 * Handles Lexical editor dirty tracking for a single section
 * DO NOT use this for startsWith or endsWith editors - only for section editors
 */
export function TrackedSectionEditor({ section, editor, onEditorDirty, registerEditor, unregisterEditor, children }) {
  const [isRegistered, setIsRegistered] = useState(false);

  // Setup dirty tracking for this editor
  const tracking = useEditorDirtyTracking(editor, section.id, onEditorDirty, {
    ignoreInitialLoad: true,
    debounceMs: 100,
  });

  // Register this editor with parent tracker
  // Only run once when editor becomes available
  useEffect(() => {
    if (editor && registerEditor && !isRegistered) {
      registerEditor(section.id, editor, tracking);
      setIsRegistered(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id, !!editor]); // Only depend on section.id and whether editor exists

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unregisterEditor && isRegistered) {
        unregisterEditor(section.id);
      }
    };
  }, [section.id, unregisterEditor, isRegistered]);

  return children({ tracking });
}
