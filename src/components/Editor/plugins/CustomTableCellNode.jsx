import { TableCellNode } from '@lexical/table';
import React from 'react';
import ReactDOM from 'react-dom';
import { $getNodeType, $applyNodeReplacement } from 'lexical';
import TableCellActionMenu from './TableCellActionMenu';

class CustomTableCellNode extends TableCellNode {
  static getType() {
    // Use a unique type name for our custom node
    return 'custom-tablecell';
  }
  
  static importJSON(serializedNode) {
    // Properly handle the import from JSON
    const node = $createCustomTableCellNode(
      serializedNode.headerState,
      serializedNode.colSpan,
      serializedNode.width
    );
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }
  
  static clone(node) {
    return new CustomTableCellNode(
      node.__headerState,
      node.__colSpan,
      node.__width,
      node.__key
    );
  }
  
  // Override createDOM to add action menu container
  createDOM(config) {
    const dom = super.createDOM(config);
    
    // Add a container for the action menu that will be positioned relative to the cell
    const menuContainer = document.createElement('div');
    menuContainer.className = 'table-cell-action-container';
    menuContainer.style.position = 'relative';
    
    // Add chevron button that will be absolutely positioned
    const chevronButton = document.createElement('button');
    chevronButton.className = 'table-cell-action-button';
    chevronButton.setAttribute('aria-label', 'Table cell actions');
    chevronButton.setAttribute('type', 'button');
    chevronButton.innerHTML = '<i class="chevron-down"></i>';
    
    // Initially hide the chevron
    chevronButton.style.display = 'none';
    
    // Add menu container
    const actionMenuContainer = document.createElement('div');
    actionMenuContainer.className = 'table-cell-menu-container';
    actionMenuContainer.style.display = 'none';
    
    menuContainer.appendChild(chevronButton);
    menuContainer.appendChild(actionMenuContainer);
    dom.appendChild(menuContainer);
    
    // Show the chevron on mouseenter
    dom.addEventListener('mouseenter', () => {
      chevronButton.style.display = 'block';
    });
    
    // Hide the chevron on mouseleave
    dom.addEventListener('mouseleave', () => {
      if (actionMenuContainer.style.display !== 'block') {
        chevronButton.style.display = 'none';
      }
    });
    
    // Toggle menu on click
    chevronButton.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const isActive = actionMenuContainer.style.display !== 'block';
      actionMenuContainer.style.display = isActive ? 'block' : 'none';
      
      if (isActive) {
        // Get the editor from context
        const editor = this.getLatest().__lexicalEditor;
        const tableCellNode = this;
        
        // Render the React component into the container
        ReactDOM.render(
          <TableCellActionMenu 
            tableCellNode={tableCellNode} 
            editor={editor}
            onClose={() => {
              actionMenuContainer.style.display = 'none';
              chevronButton.style.display = 'none';
            }}
          />,
          actionMenuContainer
        );
      } else {
        // Clean up React component
        ReactDOM.unmountComponentAtNode(actionMenuContainer);
      }
    });
    
    return dom;
  }
  
  // Override updateDOM to preserve our custom elements
  updateDOM(prevNode, dom) {
    const hasUpdate = super.updateDOM(prevNode, dom);
    // We've already created our containers, no need to update them
    return hasUpdate;
  }
}

// Factory function for creating the custom node
export function $createCustomTableCellNode(
  headerState,
  colSpan = 1,
  width = null
) {
  return new CustomTableCellNode(headerState, colSpan, width);
}

// Export the class directly - we'll handle registration differently
export default CustomTableCellNode;