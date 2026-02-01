import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditorDirtyTracking } from './useEditorDirtyTracking.js';

/**
 * Hook to track changes to letter structure (everything except section text content)
 * Handles: outer fields, add/remove sections, reorder sections
 * 
 * This uses LAZY CHECKING - only checks when explicitly called via checkForChanges()
 * 
 * @param {Object} currentLetter - Current letter data
 * @param {Object} initialLetter - Initial/saved letter data
 * @returns {Object} - { hasStructureChanges, structureChangeType, checkForChanges, resetStructure }
 */
export function useLetterStructureTracking(currentLetter, initialLetter) {
  const [hasStructureChanges, setHasStructureChanges] = useState(false);
  const [structureChangeType, setStructureChangeType] = useState(null);
  
  // Store refs so we always have current values when checking
  const currentLetterRef = useRef(currentLetter);
  const initialLetterRef = useRef(initialLetter);
  
  useEffect(() => {
    currentLetterRef.current = currentLetter;
  }, [currentLetter]);
  
  useEffect(() => {
    initialLetterRef.current = initialLetter;
  }, [initialLetter]);
  
  // Function to explicitly check for changes (called on navigation)
  const checkForChanges = useCallback(() => {
    const current = currentLetterRef.current;
    const initial = initialLetterRef.current;
    
    if (!initial || !current) {
      setHasStructureChanges(false);
      setStructureChangeType(null);
      return false;
    }

    // 1. Check outer letter changes (excluding sectionsAttributes and text content)
    const outerFieldsChanged = checkOuterFieldsChanged(current, initial);
    
    // 2. Check if sections were added/removed
    // Handle both 'sections' and 'sectionsAttributes' field names
    const currentSections = getSectionsArray(current);
    const initialSections = getSectionsArray(initial);
    
    const sectionsCountChanged = currentSections.length !== initialSections.length;
    
    // 3. Check if sections were reordered
    const sectionsReordered = checkSectionsReordered(currentSections, initialSections);

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
    
    return hasChanges;
  }, []);

  const resetStructure = useCallback(() => {
    setHasStructureChanges(false);
    setStructureChangeType(null);
  }, []);

  return {
    hasStructureChanges,
    structureChangeType,
    checkForChanges, // NEW: Explicit check function
    resetStructure
  };
}

/**
 * Get sections array from letter object
 * Handles both 'sections' and 'sectionsAttributes' field names
 */
function getSectionsArray(letter) {
  if (!letter) return [];
  
  // Filter out destroyed sections (marked with _destroy)
  const sections = letter.sectionsAttributes || letter.sections || [];
  return sections.filter(s => !s._destroy);
}

/**
 * Check if outer fields (non-sectionsAttributes) have changed
 */
function checkOuterFieldsChanged(current, initial) {
  const outerFields = [
    'row1Col1', 'row1Col2', 'row2Col1', 'row2Col2', 
    'row3Col1', 'row3Col2', 'startsWith', 'endsWith', 'endNotes'
  ];

  return outerFields.some(field => {
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
  const currentIds = [...currentSections]
    .sort((a, b) => a.order - b.order)
    .map(s => s.id || s.frontEndId); // Handle both id and frontEndId
  
  const initialIds = [...initialSections]
    .sort((a, b) => a.order - b.order)
    .map(s => s.id || s.frontEndId); // Handle both id and frontEndId

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
 * - Structure changes (requirements 1-3): Checked on navigation/beforeunload
 * - Editor changes (requirement 4): Tracked reactively
 */
export function LetterChangeTracker({
  letter,
  initialLetter,
  onLetterChange,
  children
}) {
  // Track structure changes (lazy - only checked on navigation)
  const { 
    hasStructureChanges, 
    structureChangeType, 
    checkForChanges,
    resetStructure 
  } = useLetterStructureTracking(letter, initialLetter);

  // Track section editor changes (reactive - tracked on every edit)
  const [dirtySectionEditors, setDirtySectionEditors] = useState(new Set());
  const [sectionEditorTracking, setSectionEditorTracking] = useState({});

  const hasEditorChanges = dirtySectionEditors.size > 0;
  
  // Combined check - structure is only checked when explicitly requested
  const hasAnyChanges = hasStructureChanges || hasEditorChanges;

  // Callback when individual section editor becomes dirty
  const handleSectionEditorDirty = useCallback((sectionId, isDirty) => {
    setDirtySectionEditors(prev => {
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
    setSectionEditorTracking(prev => ({
      ...prev,
      [sectionId]: { editor, tracking }
    }));
  }, []);

  // Unregister section editor tracking
  const unregisterSectionEditor = useCallback((sectionId) => {
    setSectionEditorTracking(prev => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
    setDirtySectionEditors(prev => {
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

  // Notify parent of changes (only editor changes tracked reactively)
  useEffect(() => {
    if (onLetterChange) {
      onLetterChange({
        hasChanges: hasAnyChanges,
        hasStructureChanges,
        hasEditorChanges,
        structureChangeType,
        dirtySections: Array.from(dirtySectionEditors),
        checkForChanges, // Pass function to check structure changes on demand
        changeDetails: {
          outerFields: structureChangeType === 'outer_fields',
          sectionsCount: structureChangeType === 'sections_count',
          sectionsReorder: structureChangeType === 'sections_reorder',
          sectionContent: hasEditorChanges
        }
      });
    }
  }, [
    hasAnyChanges, 
    hasStructureChanges, 
    hasEditorChanges, 
    structureChangeType,
    dirtySectionEditors,
    checkForChanges,
    onLetterChange
  ]);

  // Provide context to children
  return children({
    // State
    hasChanges: hasAnyChanges,
    hasStructureChanges,
    hasEditorChanges,
    structureChangeType,
    dirtySections: Array.from(dirtySectionEditors),
    checkForChanges, // NEW: Function to check structure changes on demand
    
    // Methods
    registerSectionEditor,
    unregisterSectionEditor,
    handleSectionEditorDirty,
    markAllClean,
    
    // Tracking objects
    sectionEditorTracking
  });
}

/**
 * Component wrapper for individual section editors
 * Handles Lexical editor dirty tracking for a single section
 */
export function TrackedSectionEditor({
  section,
  editor,
  onEditorDirty,
  registerEditor,
  unregisterEditor,
  children
}) {
  // Setup dirty tracking for this editor
  const tracking = useEditorDirtyTracking(
    editor,
    section.id,
    onEditorDirty,
    {
      ignoreInitialLoad: true,
      debounceMs: 100
    }
  );

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
