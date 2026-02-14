/* eslint-disable import-x/extensions */
/* eslint-disable no-use-before-define */
import { useCallback, useEffect, useState } from 'react';

import { useEditorDirtyTracking } from './useEditorDirtyTracking.js';
/**
 * LetterChangeTrackerani
 * Used to track the different types of changes in the letter
 * 1. Outer letter changes - Any field except the letter contents stored in sectionAttributes
 * 2. Add/Remove sections - Changes to the sectionAttributes length
 * 3. Reordering sections - Change to section ID sequence based on order
 * 4. Section content changes - Lexical editor modifications within the sectionAttributes
 */

/**
 * Hook to track changes to letter structure (everything except section text content)
 * Handles: outer fields, add/remove sections, reorder sections
 *
 * Uses lazy checking - only computes changes when checkStructureChanges() is called
 *
 * @param {Object} currentLetterRef - Ref to current letter data
 * @param {Object} initialLetterRef - Ref to initial/saved letter data
 * @returns {Object} - { checkStructureChanges }
 */
export function useLetterStructureTracking(currentLetterRef, initialLetterRef) {
  const checkStructureChanges = useCallback(() => {
    const currentLetter = currentLetterRef.current;
    const initialLetter = initialLetterRef.current;

    if (!initialLetter || !currentLetter) {
      return {
        hasStructureChanges: false,
        structureChangeType: null,
      };
    }

    // 1. Check outer letter changes (excluding sectionsAttributes and text content)
    const outerFieldsChanged = checkOuterFieldsChanged(currentLetter, initialLetter);

    // 2. Check if sections were added/removed
    const sectionsCountChanged = currentLetter.sectionsAttributes?.length !== initialLetter.sectionsAttributes?.length;

    // 3. Check if sections were reordered
    const sectionsReordered = checkSectionsReordered(currentLetter.sectionsAttributes, initialLetter.sectionsAttributes);

    const hasChanges = outerFieldsChanged || sectionsCountChanged || sectionsReordered;

    // Determine the type of change for detailed tracking
    let structureChangeType = null;
    if (hasChanges) {
      if (sectionsCountChanged) {
        structureChangeType = 'sections_count';
      } else if (sectionsReordered) {
        structureChangeType = 'sections_reorder';
      } else if (outerFieldsChanged) {
        structureChangeType = 'outer_fields';
      }
    }

    return {
      hasStructureChanges: hasChanges,
      structureChangeType,
    };
  }, [currentLetterRef, initialLetterRef]);

  return {
    checkStructureChanges,
  };
}

/**
 * Check if outer fields (non-sectionsAttributes) have changed
 */
function checkOuterFieldsChanged(current, initial) {
  const outerFields = ['row1Col1', 'row1Col2', 'row2Col1', 'row2Col2', 'row3Col1', 'row3Col2', 'startsWith', 'endsWith', 'endNotes'];

  return outerFields.some((field) => {
    const currentValue = normalizeHTML(current[field]);
    const initialValue = normalizeHTML(initial[field]);
    return currentValue !== initialValue;
  });
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
 * Normalize HTML for comparison (remove whitespace variations)
 */
function normalizeHTML(html) {
  if (!html) return '';
  if (Array.isArray(html)) return JSON.stringify(html);
  if (typeof html === 'object') return JSON.stringify(html);
  return html.replace(/\s+/g, ' ').trim();
}

/**
 * Compare two arrays for equality
 */
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * Main component that coordinates all letter change tracking
 * Combines structure tracking + section editor tracking
 * Uses lazy checking - only computes when checkForChanges() is called
 */
export function LetterChangeTracker({ currentLetterRef, initialLetterRef, children }) {
  // Track structure changes (requirements 1-3) - lazy checking
  const { checkStructureChanges } = useLetterStructureTracking(currentLetterRef, initialLetterRef);

  // Track section editor changes (requirement 4)
  const [sectionEditorTracking, setSectionEditorTracking] = useState({});

  // Callback when individual section editor becomes dirty
  const handleSectionEditorDirty = useCallback((sectionId, isDirty) => {
    setSectionEditorTracking((prev) => {
      const next = { ...prev };
      if (!next[sectionId]) return next;
      
      next[sectionId] = {
        ...next[sectionId],
        isDirty,
      };
      return next;
    });
  }, []);

  // Register section editor tracking
  const registerSectionEditor = useCallback((sectionId, editor, tracking) => {
    setSectionEditorTracking((prev) => ({
      ...prev,
      [sectionId]: { editor, tracking, isDirty: false },
    }));
  }, []);

  // Unregister section editor tracking
  const unregisterSectionEditor = useCallback((sectionId) => {
    setSectionEditorTracking((prev) => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  }, []);

  // Check for editor changes by querying each editor's dirty state
  const checkEditorChanges = useCallback(() => {
    const dirtySections = [];
    let hasEditorChanges = false;

    Object.entries(sectionEditorTracking).forEach(([sectionId, { tracking, isDirty }]) => {
      // Use tracking.checkIsDirty() if available, otherwise use stored isDirty
      const currentlyDirty = tracking?.checkIsDirty?.() ?? isDirty ?? false;
      if (currentlyDirty) {
        hasEditorChanges = true;
        dirtySections.push(sectionId);
      }
    });

    return {
      hasEditorChanges,
      dirtySections,
    };
  }, [sectionEditorTracking]);

  // Main change checking function - called on-demand (e.g., during navigation)
  const checkForChanges = useCallback(() => {
    const structureResult = checkStructureChanges();
    const editorResult = checkEditorChanges();

    const hasAnyChanges = structureResult.hasStructureChanges || editorResult.hasEditorChanges;

    return {
      hasChanges: hasAnyChanges,
      hasStructureChanges: structureResult.hasStructureChanges,
      hasEditorChanges: editorResult.hasEditorChanges,
      structureChangeType: structureResult.structureChangeType,
      dirtySections: editorResult.dirtySections,
      changeDetails: {
        outerFields: structureResult.structureChangeType === 'outer_fields',
        sectionsCount: structureResult.structureChangeType === 'sections_count',
        sectionsReorder: structureResult.structureChangeType === 'sections_reorder',
        sectionContent: editorResult.hasEditorChanges,
      },
    };
  }, [checkStructureChanges, checkEditorChanges]);

  // Mark all editors as clean (after save)
  const markAllClean = useCallback(() => {
    // Reset all section editors
    Object.values(sectionEditorTracking).forEach(({ tracking }) => {
      tracking?.markClean();
    });

    // Update isDirty flags
    setSectionEditorTracking((prev) => {
      const next = {};
      Object.entries(prev).forEach(([sectionId, data]) => {
        next[sectionId] = { ...data, isDirty: false };
      });
      return next;
    });
  }, [sectionEditorTracking]);

  // For UI convenience, provide a simple boolean indicating if any editors are dirty
  // This is lightweight and doesn't check structure
  const hasDirtyEditors = Object.values(sectionEditorTracking).some(({ isDirty }) => isDirty);
  const dirtyEditorsCount = Object.values(sectionEditorTracking).filter(({ isDirty }) => isDirty).length;

  // Provide context to children
  return children({
    // Main checking function
    checkForChanges,

    // Lightweight indicators
    hasDirtyEditors,
    dirtyEditorsCount,

    // Methods
    registerSectionEditor,
    unregisterSectionEditor,
    handleSectionEditorDirty,
    markAllClean,

    // Tracking objects
    sectionEditorTracking,
  });
}

/**
 * Component wrapper for individual section editors
 * Handles Lexical editor dirty tracking for a single section
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
