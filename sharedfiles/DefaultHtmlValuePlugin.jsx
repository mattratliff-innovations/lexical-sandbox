import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $createTextNode, $isTextNode } from 'lexical';
import { useEffect } from 'react';
import { $createEndnoteNode, $isEndnoteNode } from './EndnotePlugin';

export default function DefaultHtmlValuePlugin({ initialValue = '', onChange = () => {} }) {
  const [editor] = useLexicalComposerContext();

  // Function to convert endnote HTML spans to EndnoteNodes during import
  const convertEndnoteSpansToNodes = (dom) => {
    // Find all spans that look like endnotes (contain sup with [number] format)
    const allSpans = dom.querySelectorAll('span');
    
    allSpans.forEach(span => {
      const supElement = span.querySelector('sup');
      if (supElement && supElement.textContent.match(/\[(\d+)\]/)) {
        const match = supElement.textContent.match(/\[(\d+)\]/);
        const footnoteId = parseInt(match[1]);
        
        // Extract the text content (excluding the sup element)
        let textContent = '';
        Array.from(span.childNodes).forEach(node => {
          if (node.nodeName !== 'SUP') {
            textContent += node.textContent || '';
          }
        });
        textContent = textContent.trim();
        
        // Get the endnote value from data attributes or global manager
        let endnoteValue = span.getAttribute('data-endnote-value') || '';
        
        // If not found in attributes, try to get from global endnote manager
        if (!endnoteValue && window.endnoteManager) {
          const globalEndnotes = window.endnoteManager.getAllEndnotes();
          const matchingEndnote = globalEndnotes.find(note => parseInt(note.index) === footnoteId);
          if (matchingEndnote) {
            endnoteValue = matchingEndnote.value || '';
          }
        }
        
        console.log(`Converting span to endnote: ID=${footnoteId}, text="${textContent}", value="${endnoteValue}"`);
        
        // Mark this span for conversion by adding special attributes
        span.setAttribute('data-convert-to-endnote', 'true');
        span.setAttribute('data-endnote-id', footnoteId.toString());
        span.setAttribute('data-endnote-text', textContent);
        span.setAttribute('data-endnote-value', endnoteValue);
        
        // Clear the span's content and replace with just the text (no sup)
        span.innerHTML = textContent;
      }
    });
    
    return dom;
  };

  // Process nodes recursively to convert marked spans to EndnoteNodes
  const processNodesForEndnotes = (nodes) => {
    const processedNodes = [];
    
    nodes.forEach(node => {
      if (node.getType && node.getType() === 'text') {
        // Check if this text node contains endnote patterns from converted spans
        const textContent = node.getTextContent();
        const convertedNodes = processTextNodeForEndnotes(textContent);
        processedNodes.push(...convertedNodes);
      } else if (node.getChildren && typeof node.getChildren === 'function') {
        // Process child nodes recursively
        const children = node.getChildren();
        const processedChildren = processNodesForEndnotes(children);
        
        // Clone the node and replace its children
        const clonedNode = node.clone();
        clonedNode.clear();
        clonedNode.append(...processedChildren);
        processedNodes.push(clonedNode);
      } else {
        processedNodes.push(node);
      }
    });
    
    return processedNodes;
  };

  // Process text content to identify and create EndnoteNodes
  const processTextNodeForEndnotes = (textContent) => {
    // Check if we have marked endnote data in the DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textContent;
    
    const markedSpans = tempDiv.querySelectorAll('span[data-convert-to-endnote="true"]');
    
    if (markedSpans.length > 0) {
      const nodes = [];
      
      markedSpans.forEach(span => {
        const footnoteId = parseInt(span.getAttribute('data-endnote-id'));
        const endnoteText = span.getAttribute('data-endnote-text');
        const endnoteValue = span.getAttribute('data-endnote-value') || '';
        
        console.log(`Creating EndnoteNode: ID=${footnoteId}, text="${endnoteText}", value="${endnoteValue}"`);
        
        // Create EndnoteNode
        const endnoteNode = $createEndnoteNode(endnoteText, footnoteId, endnoteValue);
        nodes.push(endnoteNode);
      });
      
      return nodes;
    }
    
    // Look for endnote patterns in plain text: text[number] format
    const endnoteRegex = /(.+?)\[(\d+)\]/g;
    const nodes = [];
    let lastIndex = 0;
    let match;
    
    while ((match = endnoteRegex.exec(textContent)) !== null) {
      const [fullMatch, endnoteText, footnoteId] = match;
      const startIndex = match.index;
      
      // Add text before the endnote as regular text node
      if (startIndex > lastIndex) {
        const beforeText = textContent.substring(lastIndex, startIndex);
        if (beforeText) {
          nodes.push($createTextNode(beforeText));
        }
      }
      
      // Get endnote value from global manager
      let endnoteValue = '';
      if (window.endnoteManager) {
        const globalEndnotes = window.endnoteManager.getAllEndnotes();
        const matchingEndnote = globalEndnotes.find(note => parseInt(note.index) === parseInt(footnoteId));
        if (matchingEndnote) {
          endnoteValue = matchingEndnote.value || '';
        }
      }
      
      console.log(`Creating EndnoteNode from pattern: ID=${footnoteId}, text="${endnoteText.trim()}", value="${endnoteValue}"`);
      
      // Create EndnoteNode
      const endnoteNode = $createEndnoteNode(endnoteText.trim(), parseInt(footnoteId), endnoteValue);
      nodes.push(endnoteNode);
      
      lastIndex = endnoteRegex.lastIndex;
    }
    
    // Add remaining text after last endnote
    if (lastIndex < textContent.length) {
      const remainingText = textContent.substring(lastIndex);
      if (remainingText) {
        nodes.push($createTextNode(remainingText));
      }
    }
    
    // If no endnotes found, return original text as single node
    if (nodes.length === 0) {
      nodes.push($createTextNode(textContent));
    }
    
    return nodes;
  };

  useEffect(() => {
    if (initialValue && initialValue.trim() !== '') {
      console.log('DefaultHtmlValuePlugin processing initial value:', initialValue);
      
      editor.update(() => {
        const root = $getRoot();
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialValue, 'text/html');
        
        // Convert endnote spans before generating nodes
        const processedDom = convertEndnoteSpansToNodes(dom);
        
        // Generate nodes from the processed DOM
        const nodes = $generateNodesFromDOM(editor, processedDom);
        
        // Clear existing content
        root.clear();
        
        // Instead of complex recursive processing, use a simpler approach
        // Just append the nodes and let Lexical handle the conversion
        const finalNodes = [];
        
        nodes.forEach(node => {
          if (node.getType && node.getType() === 'text') {
            const textContent = node.getTextContent();
            // Check if this text contains endnote patterns
            const endnoteNodes = processTextNodeForEndnotes(textContent);
            finalNodes.push(...endnoteNodes);
          } else {
            finalNodes.push(node);
          }
        });
        
        console.log(`Generated ${finalNodes.length} final nodes`);
        
        // Append processed nodes to root
        if (finalNodes.length > 0) {
          root.append(...finalNodes);
        }
        
        // Trigger onChange after processing
        setTimeout(() => {
          onChange();
        }, 100);
      });
    }
  }, [initialValue, editor, onChange]);

  return null;
}