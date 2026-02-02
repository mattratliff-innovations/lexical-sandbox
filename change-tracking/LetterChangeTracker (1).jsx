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
 * @param {Object} currentLetter - Current letter data
 * @param {Object} initialLetter - Initial/saved letter data
 * @returns {Object} - { checkStructureChanges, resetStructure }
 */
export function useLetterStructureTracking(currentLetter, initialLetter) {
  const checkStructureChanges = useCallback(() => {
    if (!initialLetter || !currentLetter) {
      return { hasChanges: false, changeType: null };
    }

    // 1. Check if sections were added/removed
    const sectionsCountChanged = currentLetter.sectionsAttributes?.length !== initialLetter.sectionsAttributes?.length;

    // 2. Check if sections were reordered
    const sectionsReordered = checkSectionsReordered(currentLetter.sectionsAttributes, initialLetter.sectionsAttributes);

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
  }, [currentLetter, initialLetter]);

  return { checkStructureChanges };
}

/**
 * Check if sections have been reordered by comparing ID sequence
 */
function checkSectionsReordered(currentSections, initialSections) {
  if (!currentSections || !initialSections) return false;
  if (currentSections.length !== initialSections.length) return false;

  // Sort by order and compare ID sequence
  const currentIds = [...currentSections].sort((a, b) => a.order - b.order).map((s) => s.id);

  const initialIds = [...initialSections].sort((a, b) => a.order - b.order).map((s) => s.id);

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
export function LetterChangeTracker({ letter, initialLetter, children }) {
  // Track structure changes
  const { checkStructureChanges } = useLetterStructureTracking(letter, initialLetter);

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
    // Methods
    checkForChanges,
    registerSectionEditor,
    unregisterSectionEditor,
    handleSectionEditorDirty,
    markAllClean,

    // Tracking objects (for debugging)
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
  // Setup dirty tracking for this editor
  const tracking = useEditorDirtyTracking(editor, section.id, onEditorDirty, {
    ignoreInitialLoad: true,
    debounceMs: 100,
  });

  // Register this editor with parent tracker
  useEffect(() => {
    if (editor && registerEditor) {
      registerEditor(section.id, editor, tracking);
    }

    return () => {
      if (unregisterEditor) {
        unregisterEditor(section.id);
      }
    };
  }, [section.id, editor, tracking, registerEditor, unregisterEditor]);

  return children({ tracking });
}
