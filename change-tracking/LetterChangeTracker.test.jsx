import { renderHook, act } from '@testing-library/react';
import { useCallback } from 'react';
import { 
  useLetterStructureTracking, 
  LetterChangeTracker, 
  TrackedSectionEditor 
} from './LetterChangeTracker';

// Mock useEditorDirtyTracking
jest.mock('./useEditorDirtyTracking.js', () => ({
  useEditorDirtyTracking: jest.fn((editor, sectionId, onDirtyChange) => ({
    markClean: jest.fn(),
    markSpellCheckStart: jest.fn(),
    markSpellCheckEnd: jest.fn(),
  })),
}));

describe('LetterChangeTracker', () => {
  describe('useLetterStructureTracking', () => {
    describe('Section Count Changes', () => {
      it('should detect when sections are added', () => {
        const initialLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
          ],
        };

        const currentLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
            { id: null, frontEndId: '3', text: 'Section 3', order: 2 },
          ],
        };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(true);
        expect(changeState.changeType).toBe('sections_count');
      });

      it('should detect when sections are removed', () => {
        const initialLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
            { id: 3, frontEndId: '3', text: 'Section 3', order: 2 },
          ],
        };

        const currentLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
          ],
        };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(true);
        expect(changeState.changeType).toBe('sections_count');
      });

      it('should not detect changes when section count is the same', () => {
        const initialLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
          ],
        };

        const currentLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
          ],
        };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(false);
        expect(changeState.changeType).toBe(null);
      });
    });

    describe('Section Reordering', () => {
      it('should detect when sections are reordered', () => {
        const initialLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
            { id: 3, frontEndId: '3', text: 'Section 3', order: 2 },
          ],
        };

        const currentLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 3, frontEndId: '3', text: 'Section 3', order: 2 }, // Swapped
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 }, // Swapped
          ],
        };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(true);
        expect(changeState.changeType).toBe('sections_reorder');
      });

      it('should use array position, not order field for comparison', () => {
        const initialLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
            { id: 3, frontEndId: '3', text: 'Section 3', order: 2 },
          ],
        };

        // order field unchanged, but array positions swapped (simulates swapSections behavior)
        const currentLetter = {
          sections: [
            { id: 3, frontEndId: '3', text: 'Section 3', order: 2 }, // Position 0, order still 2
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 }, // Position 1, order still 0
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 }, // Position 2, order still 1
          ],
        };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(true);
        expect(changeState.changeType).toBe('sections_reorder');
      });

      it('should not detect reorder when sections return to original position', () => {
        const initialLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
            { id: 3, frontEndId: '3', text: 'Section 3', order: 2 },
          ],
        };

        const currentLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
            { id: 3, frontEndId: '3', text: 'Section 3', order: 2 },
          ],
        };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(false);
        expect(changeState.changeType).toBe(null);
      });

      it('should use frontEndId when id is null (new sections)', () => {
        const initialLetter = {
          sections: [
            { id: null, frontEndId: 'uuid-1', text: 'Section 1', order: 0 },
            { id: null, frontEndId: 'uuid-2', text: 'Section 2', order: 1 },
          ],
        };

        const currentLetter = {
          sections: [
            { id: null, frontEndId: 'uuid-2', text: 'Section 2', order: 1 }, // Swapped
            { id: null, frontEndId: 'uuid-1', text: 'Section 1', order: 0 }, // Swapped
          ],
        };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(true);
        expect(changeState.changeType).toBe('sections_reorder');
      });
    });

    describe('_destroy Flag Handling', () => {
      it('should filter out sections marked with _destroy', () => {
        const initialLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
          ],
        };

        // Section 2 marked for deletion, but still in array
        const currentLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1, _destroy: 1 },
          ],
        };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        // Should detect as deletion (active sections: 2 → 1)
        expect(changeState.hasChanges).toBe(true);
        expect(changeState.changeType).toBe('sections_count');
      });

      it('should not count sections with _destroy: 0 or false as deleted', () => {
        const initialLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
          ],
        };

        const currentLetter = {
          sections: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0, _destroy: false },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1, _destroy: 0 },
          ],
        };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(false);
        expect(changeState.changeType).toBe(null);
      });
    });

    describe('Edge Cases', () => {
      it('should handle null currentLetter', () => {
        const initialLetter = {
          sections: [{ id: 1, frontEndId: '1', text: 'Section 1', order: 0 }],
        };

        const getCurrentLetter = () => null;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(false);
        expect(changeState.changeType).toBe(null);
      });

      it('should handle null initialLetter', () => {
        const currentLetter = {
          sections: [{ id: 1, frontEndId: '1', text: 'Section 1', order: 0 }],
        };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, null)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(false);
        expect(changeState.changeType).toBe(null);
      });

      it('should handle empty sections arrays', () => {
        const initialLetter = { sections: [] };
        const currentLetter = { sections: [] };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(false);
        expect(changeState.changeType).toBe(null);
      });

      it('should handle sectionsAttributes field instead of sections', () => {
        const initialLetter = {
          sectionsAttributes: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
          ],
        };

        const currentLetter = {
          sectionsAttributes: [
            { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
            { id: 3, frontEndId: '3', text: 'Section 3', order: 2 },
          ],
        };

        const getCurrentLetter = () => currentLetter;

        const { result } = renderHook(() =>
          useLetterStructureTracking(getCurrentLetter, initialLetter)
        );

        const changeState = result.current.checkStructureChanges();

        expect(changeState.hasChanges).toBe(true);
        expect(changeState.changeType).toBe('sections_count');
      });
    });
  });

  describe('LetterChangeTracker Component', () => {
    it('should provide checkForChanges function to children', () => {
      const letterEditorRef = {
        current: {
          draftState: {
            sections: [
              { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
            ],
          },
        },
      };

      const initialLetter = {
        sections: [
          { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
        ],
      };

      let capturedProps = null;

      const { result } = renderHook(() =>
        LetterChangeTracker({
          letterEditorRef,
          initialLetter,
          children: (props) => {
            capturedProps = props;
            return null;
          },
        })
      );

      expect(capturedProps).toBeTruthy();
      expect(typeof capturedProps.checkForChanges).toBe('function');
      expect(typeof capturedProps.registerSectionEditor).toBe('function');
      expect(typeof capturedProps.unregisterSectionEditor).toBe('function');
      expect(typeof capturedProps.handleSectionEditorDirty).toBe('function');
      expect(typeof capturedProps.markAllClean).toBe('function');
    });

    it('should track dirty editors', () => {
      const letterEditorRef = {
        current: {
          draftState: {
            sections: [{ id: 1, frontEndId: '1', text: 'Section 1', order: 0 }],
          },
        },
      };

      const initialLetter = {
        sections: [{ id: 1, frontEndId: '1', text: 'Section 1', order: 0 }],
      };

      let capturedProps = null;

      renderHook(() =>
        LetterChangeTracker({
          letterEditorRef,
          initialLetter,
          children: (props) => {
            capturedProps = props;
            return null;
          },
        })
      );

      expect(capturedProps.hasDirtyEditors).toBe(false);
      expect(capturedProps.dirtyEditorsCount).toBe(0);

      // Mark editor as dirty
      act(() => {
        capturedProps.handleSectionEditorDirty('section-1', true);
      });

      // Re-render to get updated props
      renderHook(() =>
        LetterChangeTracker({
          letterEditorRef,
          initialLetter,
          children: (props) => {
            capturedProps = props;
            return null;
          },
        })
      );

      expect(capturedProps.hasDirtyEditors).toBe(true);
      expect(capturedProps.dirtyEditorsCount).toBe(1);
    });

    it('should combine structure and editor changes', () => {
      const initialLetter = {
        sections: [
          { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
          { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
        ],
      };

      const letterEditorRef = {
        current: {
          draftState: {
            sections: [
              { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
              { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
              { id: 3, frontEndId: '3', text: 'Section 3', order: 2 }, // Added
            ],
          },
        },
      };

      let capturedProps = null;

      renderHook(() =>
        LetterChangeTracker({
          letterEditorRef,
          initialLetter,
          children: (props) => {
            capturedProps = props;
            return null;
          },
        })
      );

      // Mark editor as dirty
      act(() => {
        capturedProps.handleSectionEditorDirty('section-1', true);
      });

      // Check for changes
      const changeState = capturedProps.checkForChanges();

      expect(changeState.hasChanges).toBe(true);
      expect(changeState.hasStructureChanges).toBe(true); // Section added
      expect(changeState.hasEditorChanges).toBe(true); // Editor dirty
      expect(changeState.structureChangeType).toBe('sections_count');
      expect(changeState.dirtySections).toContain('section-1');
    });

    it('should clear all changes when markAllClean is called', () => {
      const letterEditorRef = {
        current: {
          draftState: {
            sections: [{ id: 1, frontEndId: '1', text: 'Section 1', order: 0 }],
          },
        },
      };

      const initialLetter = {
        sections: [{ id: 1, frontEndId: '1', text: 'Section 1', order: 0 }],
      };

      let capturedProps = null;
      const mockTracking = {
        markClean: jest.fn(),
      };

      renderHook(() =>
        LetterChangeTracker({
          letterEditorRef,
          initialLetter,
          children: (props) => {
            capturedProps = props;
            return null;
          },
        })
      );

      // Register an editor and mark it dirty
      act(() => {
        const mockEditor = {};
        capturedProps.registerSectionEditor('section-1', mockEditor, mockTracking);
        capturedProps.handleSectionEditorDirty('section-1', true);
      });

      // Mark all clean
      act(() => {
        capturedProps.markAllClean();
      });

      expect(mockTracking.markClean).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should detect no changes after save and sync', () => {
      const savedLetter = {
        sections: [
          { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
          { id: 2, frontEndId: '2', text: 'Section 2', order: 1 },
        ],
      };

      const letterEditorRef = {
        current: {
          draftState: savedLetter,
        },
      };

      let capturedProps = null;

      renderHook(() =>
        LetterChangeTracker({
          letterEditorRef,
          initialLetter: savedLetter,
          children: (props) => {
            capturedProps = props;
            return null;
          },
        })
      );

      const changeState = capturedProps.checkForChanges();

      expect(changeState.hasChanges).toBe(false);
      expect(changeState.hasStructureChanges).toBe(false);
      expect(changeState.hasEditorChanges).toBe(false);
    });

    it('should handle complete workflow: add, edit, save', () => {
      const initialLetter = {
        sections: [
          { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
        ],
      };

      let currentDraftState = { ...initialLetter };

      const letterEditorRef = {
        current: {
          get draftState() {
            return currentDraftState;
          },
        },
      };

      let capturedProps = null;

      // Initial render
      const { rerender } = renderHook(() =>
        LetterChangeTracker({
          letterEditorRef,
          initialLetter,
          children: (props) => {
            capturedProps = props;
            return null;
          },
        })
      );

      // Step 1: Add a section
      currentDraftState = {
        sections: [
          { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
          { id: null, frontEndId: '2', text: 'Section 2', order: 1 },
        ],
      };

      rerender();

      let changeState = capturedProps.checkForChanges();
      expect(changeState.hasChanges).toBe(true);
      expect(changeState.structureChangeType).toBe('sections_count');

      // Step 2: Edit the section
      act(() => {
        capturedProps.handleSectionEditorDirty('section-2', true);
      });

      changeState = capturedProps.checkForChanges();
      expect(changeState.hasChanges).toBe(true);
      expect(changeState.hasEditorChanges).toBe(true);

      // Step 3: Save (sync initial with current)
      const savedState = {
        sections: [
          { id: 1, frontEndId: '1', text: 'Section 1', order: 0 },
          { id: 2, frontEndId: '2', text: 'Section 2', order: 1 }, // Got ID from server
        ],
      };

      currentDraftState = savedState;

      const { rerender: rerender2 } = renderHook(() =>
        LetterChangeTracker({
          letterEditorRef,
          initialLetter: savedState, // Updated after save
          children: (props) => {
            capturedProps = props;
            return null;
          },
        })
      );

      act(() => {
        capturedProps.markAllClean();
      });

      changeState = capturedProps.checkForChanges();
      expect(changeState.hasChanges).toBe(false);
    });
  });
});
