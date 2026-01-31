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
 * @param {Object} currentLetter - Current letter data
 * @param {Object} initialLetter - Initial/saved letter data
 * @returns {Object} - { hasStructureChanges, structureChangeType, resetStructure }
 */
export function useLetterStructureTracking(currentLetter, initialLetter) {
  const [hasStructureChanges, setHasStructureChanges] = useState(false);
  const [structureChangeType, setStructureChangeType] = useState(null);

  useEffect(() => {
    if (!initialLetter || !currentLetter) {
      setHasStructureChanges(false);
      setStructureChangeType(null);
      return;
    }

    // 1. Check outer letter changes (excluding sectionsAttributes and text content)
    const outerFieldsChanged = checkOuterFieldsChanged(currentLetter, initialLetter);

    // 2. Check if sections were added/removed
    const sectionsCountChanged = currentLetter.sectionsAttributes?.length !== initialLetter.sectionsAttributes?.length;

    // 3. Check if sections were reordered
    const sectionsReordered = checkSectionsReordered(currentLetter.sectionsAttributes, initialLetter.sectionsAttributes);

    const hasChanges = outerFieldsChanged || sectionsCountChanged || sectionsReordered;

    setHasStructureChanges(hasChanges);

    // Determine the type of change for detailed tracking
    if (hasChanges) {
      if (sectionsCountChanged) {
        setStructureChangeType('sections_count');
      } else if (sectionsReordered) {
        setStructureChangeType('sections_reorder');
      } else if (outerFieldsChanged) {
        setStructureChangeType('outer_fields');
      }
    } else {
      setStructureChangeType(null);
    }
  }, [currentLetter, initialLetter]);

  const resetStructure = useCallback(() => {
    setHasStructureChanges(false);
    setStructureChangeType(null);
  }, []);

  return {
    hasStructureChanges,
    structureChangeType,
    resetStructure,
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
 */
export function LetterChangeTracker({ letter, initialLetter, onLetterChange, children }) {
  // Track structure changes (requirements 1-3)
  const { hasStructureChanges, structureChangeType, resetStructure } = useLetterStructureTracking(letter, initialLetter);

  // Track section editor changes (requirement 4)
  const [dirtySectionEditors, setDirtySectionEditors] = useState(new Set());
  const [sectionEditorTracking, setSectionEditorTracking] = useState({});

  const hasEditorChanges = dirtySectionEditors.size > 0;
  const hasAnyChanges = hasStructureChanges || hasEditorChanges;

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
    // Reset structure tracking
    resetStructure();

    // Reset all section editors
    Object.values(sectionEditorTracking).forEach(({ tracking }) => {
      tracking?.markClean();
    });

    setDirtySectionEditors(new Set());
  }, [resetStructure, sectionEditorTracking]);

  // Notify parent of changes
  useEffect(() => {
    if (onLetterChange) {
      onLetterChange({
        hasChanges: hasAnyChanges,
        hasStructureChanges,
        hasEditorChanges,
        structureChangeType,
        dirtySections: Array.from(dirtySectionEditors),
        changeDetails: {
          outerFields: structureChangeType === 'outer_fields',
          sectionsCount: structureChangeType === 'sections_count',
          sectionsReorder: structureChangeType === 'sections_reorder',
          sectionContent: hasEditorChanges,
        },
      });
    }
  }, [hasAnyChanges, hasStructureChanges, hasEditorChanges, structureChangeType, dirtySectionEditors, onLetterChange]);

  // Provide context to children
  return children({
    // State
    hasChanges: hasAnyChanges,
    hasStructureChanges,
    hasEditorChanges,
    structureChangeType,
    dirtySections: Array.from(dirtySectionEditors),

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
