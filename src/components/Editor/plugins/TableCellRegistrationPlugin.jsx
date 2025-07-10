import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TableCellNode, INSERT_TABLE_COMMAND } from '@lexical/table';
import CustomTableCellNode from './CustomTableCellNode';
import ReactDOM from 'react-dom';
import React from 'react';
import TableCellActionMenu from './TableCellActionMenu';

// Define custom table action commands
const INSERT_TABLE_ROW_COMMAND = 'INSERT_TABLE_ROW_COMMAND';
const INSERT_TABLE_COLUMN_COMMAND = 'INSERT_TABLE_COLUMN_COMMAND';
const DELETE_TABLE_ROW_COMMAND = 'DELETE_TABLE_ROW_COMMAND';
const DELETE_TABLE_COLUMN_COMMAND = 'DELETE_TABLE_COLUMN_COMMAND';

/**
 * Function to add our action menu to a cell DOM element
 */
function addActionMenuToCell(cellElement, editor) {
  // Create containers for the menu
  const menuContainer = document.createElement('div');
  menuContainer.className = 'table-cell-action-container';
  menuContainer.style.position = 'relative';
  
  // Add chevron button
  const chevronButton = document.createElement('button');
  chevronButton.className = 'table-cell-action-button chevron-down hidden';
  chevronButton.setAttribute('aria-label', 'Table cell actions');
  chevronButton.setAttribute('type', 'button');
  chevronButton.innerHTML = '<i class="chevron-down"></i>';
  
  // Add menu container
  const actionMenuContainer = document.createElement('div');
  actionMenuContainer.className = 'table-cell-menu-container hidden';
  
  menuContainer.appendChild(chevronButton);
  menuContainer.appendChild(actionMenuContainer);
  cellElement.appendChild(menuContainer);
  
  // Add event listeners for showing/hiding the chevron
  cellElement.addEventListener('mouseenter', () => {
    chevronButton.classList.remove('hidden');
  });
  
  cellElement.addEventListener('mouseleave', () => {
    if (!actionMenuContainer.classList.contains('active')) {
      chevronButton.classList.add('hidden');
    }
  });
  
  // Handle click to show menu
  chevronButton.addEventListener('click', (e) => {
    e.stopPropagation();
    
    const isActive = actionMenuContainer.classList.toggle('active');
    actionMenuContainer.classList.toggle('hidden', !isActive);
    
    if (isActive) {
      // Create direct HTML menu instead of trying to use ReactDOM
      createDirectHTMLMenu(actionMenuContainer, cellElement, editor, () => {
        actionMenuContainer.classList.remove('active');
        actionMenuContainer.classList.add('hidden');
        chevronButton.classList.add('hidden');
      });
    } else {
      // Clear the menu content when hiding
      actionMenuContainer.innerHTML = '';
    }
  });
}

/**
 * Creates a direct HTML menu with attached event handlers
 */
function createDirectHTMLMenu(container, cellElement, editor, onClose) {
  // Create menu HTML
  container.innerHTML = `
    <div class="table-actions-dropdown" role="menu" aria-label="Table actions">
      <button type="button" class="item" data-action="insert-row-above" role="menuitem" aria-label="Insert row above">
        <span class="text">Insert row above</span>
      </button>
      <button type="button" class="item" data-action="insert-row-below" role="menuitem" aria-label="Insert row below">
        <span class="text">Insert row below</span>
      </button>
      <hr aria-orientation="horizontal" />
      <button type="button" class="item" data-action="insert-column-left" role="menuitem" aria-label="Insert column left">
        <span class="text">Insert column left</span>
      </button>
      <button type="button" class="item" data-action="insert-column-right" role="menuitem" aria-label="Insert column right">
        <span class="text">Insert column right</span>
      </button>
      <hr aria-orientation="horizontal" />
      <button type="button" class="item" data-action="delete-column" role="menuitem" aria-label="Delete column">
        <span class="text">Delete column</span>
      </button>
      <button type="button" class="item" data-action="delete-row" role="menuitem" aria-label="Delete row">
        <span class="text">Delete row</span>
      </button>
      <button type="button" class="item" data-action="delete-table" role="menuitem" aria-label="Delete table">
        <span class="text">Delete table</span>
      </button>
    </div>
  `;
  
  // Attach event handlers
  const buttons = container.querySelectorAll('button[data-action]');
  buttons.forEach(button => {
    button.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault(); // Prevent focus loss
      const action = button.getAttribute('data-action');
      
      // Find the cell's parent row and table
      const row = findParentWithClass(cellElement, 'scribe_lexical_tableRow');
      const table = findParentWithClass(cellElement, 'scribe_lexical_table');
      
      if (!row || !table) {
        console.error('Could not find table or row');
        return;
      }
      
      // Get table structure info
      const rowIndex = getChildIndex(row);
      const cellIndex = getChildIndex(cellElement);
      const rowCount = table.querySelectorAll('.scribe_lexical_tableRow').length;
      const colCount = row.querySelectorAll('.scribe_lexical_tableCell').length;
      
      // Execute the action
      editor.update(() => {
        executeTableAction(action, editor, rowIndex, cellIndex, rowCount, colCount, table);
        onClose();
      });
    });
  });
}

// Helper function to find parent with class
function findParentWithClass(element, className) {
  let current = element;
  while (current && !current.classList.contains(className)) {
    current = current.parentElement;
  }
  return current;
}

// Helper function to get child index
function getChildIndex(element) {
  return Array.from(element.parentElement.children).indexOf(element);
}

// Execute table action
function executeTableAction(action, editor, rowIndex, cellIndex, rowCount, colCount, tableElement) {
  switch (action) {
    case 'insert-row-above':
      editor.dispatchCommand(INSERT_TABLE_ROW_COMMAND, { rowIndex, shouldInsertAfter: false });
      break;
    case 'insert-row-below':
      editor.dispatchCommand(INSERT_TABLE_ROW_COMMAND, { rowIndex, shouldInsertAfter: true });
      break;
    case 'insert-column-left':
      editor.dispatchCommand(INSERT_TABLE_COLUMN_COMMAND, { columnIndex: cellIndex, shouldInsertAfter: false });
      break;
    case 'insert-column-right':
      editor.dispatchCommand(INSERT_TABLE_COLUMN_COMMAND, { columnIndex: cellIndex, shouldInsertAfter: true });
      break;
    case 'delete-row':
      editor.dispatchCommand(DELETE_TABLE_ROW_COMMAND, { rowIndex });
      break;
    case 'delete-column':
      editor.dispatchCommand(DELETE_TABLE_COLUMN_COMMAND, { columnIndex: cellIndex });
      break;
    case 'delete-table':
      if (tableElement) {
        tableElement.remove();
      }
      break;
  }
}

/**
 * A plugin that adds menu functionality to table cells
 * This approach avoids node replacement issues by working with the DOM directly
 */
export default function TableCellRegistrationPlugin() {
    const [editor] = useLexicalComposerContext();
    
    useEffect(() => {
      // Register our custom implementation within the editor context
      if (!editor.hasNodes([CustomTableCellNode])) {
        editor.registerNodes([CustomTableCellNode]);
      }
      
      // Note: We're not adding the MutationObserver or other event handlers
      // because CustomTableCellNode already handles this
  
      // Return cleanup function
      return () => {
        // No cleanup needed
      };
    }, [editor]);
    
    // This is a utility plugin, no DOM output
    return null;
  }

/**
 * Register custom table action commands with the Lexical editor
 */
function registerTableActionCommands(editor) {
  // Register command to insert a table row
  editor.registerCommand(
    INSERT_TABLE_ROW_COMMAND,
    (payload) => {
      const { rowIndex, shouldInsertAfter } = payload;
      
      // Find the table in the DOM
      const editorElement = editor.getRootElement();
      if (!editorElement) return false;
      
      const tables = editorElement.querySelectorAll('.scribe_lexical_table');
      if (tables.length === 0) return false;
      
      // Assuming we're working with the active table
      const table = tables[0];
      const rows = table.querySelectorAll('.scribe_lexical_tableRow');
      
      if (rowIndex < 0 || rowIndex >= rows.length) return false;
      
      // Create new row
      const targetRow = rows[rowIndex];
      const newRow = targetRow.cloneNode(true);
      
      // Clear content of cells in the new row
      const cells = newRow.querySelectorAll('.scribe_lexical_tableCell');
      cells.forEach(cell => {
        const contentElements = cell.querySelectorAll('[data-lexical-node]');
        contentElements.forEach(el => {
          // Keep only the paragraph, remove all content
          if (el.getAttribute('data-lexical-type') === 'paragraph') {
            el.innerHTML = '<br>';
          } else {
            el.remove();
          }
        });
        
        // Make sure cell has our action menu
        if (!cell.querySelector('.table-cell-action-container')) {
          addActionMenuToCell(cell, editor);
        }
      });
      
      // Insert the new row
      if (shouldInsertAfter) {
        targetRow.after(newRow);
      } else {
        targetRow.before(newRow);
      }
      
      // Force Lexical to reconcile with DOM
      editor.update(() => {});
      
      return true;
    },
    0
  );
  
  // Register command to insert a table column
  editor.registerCommand(
    INSERT_TABLE_COLUMN_COMMAND,
    (payload) => {
      const { columnIndex, shouldInsertAfter } = payload;
      
      // Find the table in the DOM
      const editorElement = editor.getRootElement();
      if (!editorElement) return false;
      
      const tables = editorElement.querySelectorAll('.scribe_lexical_table');
      if (tables.length === 0) return false;
      
      // Assuming we're working with the active table
      const table = tables[0];
      const rows = table.querySelectorAll('.scribe_lexical_tableRow');
      
      // For each row, insert a new cell
      rows.forEach(row => {
        const cells = row.querySelectorAll('.scribe_lexical_tableCell');
        
        if (columnIndex < 0 || columnIndex >= cells.length) return;
        
        const targetCell = cells[columnIndex];
        const newCell = targetCell.cloneNode(true);
        
        // Clear content of the new cell
        const contentElements = newCell.querySelectorAll('[data-lexical-node]');
        contentElements.forEach(el => {
          // Keep only the paragraph, remove all content
          if (el.getAttribute('data-lexical-type') === 'paragraph') {
            el.innerHTML = '<br>';
          } else {
            el.remove();
          }
        });
        
        // Make sure cell has our action menu
        if (!newCell.querySelector('.table-cell-action-container')) {
          addActionMenuToCell(newCell, editor);
        }
        
        // Insert the new cell
        if (shouldInsertAfter) {
          targetCell.after(newCell);
        } else {
          targetCell.before(newCell);
        }
      });
      
      // Force Lexical to reconcile with DOM
      editor.update(() => {});
      
      return true;
    },
    0
  );
  
  // Register command to delete a table row
  editor.registerCommand(
    DELETE_TABLE_ROW_COMMAND,
    (payload) => {
      const { rowIndex } = payload;
      
      // Find the table in the DOM
      const editorElement = editor.getRootElement();
      if (!editorElement) return false;
      
      const tables = editorElement.querySelectorAll('.scribe_lexical_table');
      if (tables.length === 0) return false;
      
      // Assuming we're working with the active table
      const table = tables[0];
      const rows = table.querySelectorAll('.scribe_lexical_tableRow');
      
      if (rowIndex < 0 || rowIndex >= rows.length) return false;
      
      // Don't delete if it's the last row
      if (rows.length <= 1) return false;
      
      // Remove the row
      rows[rowIndex].remove();
      
      // Force Lexical to reconcile with DOM
      editor.update(() => {});
      
      return true;
    },
    0
  );
  
  // Register command to delete a table column
  editor.registerCommand(
    DELETE_TABLE_COLUMN_COMMAND,
    (payload) => {
      const { columnIndex } = payload;
      
      // Find the table in the DOM
      const editorElement = editor.getRootElement();
      if (!editorElement) return false;
      
      const tables = editorElement.querySelectorAll('.scribe_lexical_table');
      if (tables.length === 0) return false;
      
      // Assuming we're working with the active table
      const table = tables[0];
      const rows = table.querySelectorAll('.scribe_lexical_tableRow');
      
      // Check first row to get column count
      const firstRow = rows[0];
      const cells = firstRow.querySelectorAll('.scribe_lexical_tableCell');
      
      if (columnIndex < 0 || columnIndex >= cells.length) return false;
      
      // Don't delete if it's the last column
      if (cells.length <= 1) return false;
      
      // For each row, delete the cell at columnIndex
      rows.forEach(row => {
        const rowCells = row.querySelectorAll('.scribe_lexical_tableCell');
        if (columnIndex < rowCells.length) {
          rowCells[columnIndex].remove();
        }
      });
      
      // Force Lexical to reconcile with DOM
      editor.update(() => {});
      
      return true;
    },
    0
  );
}