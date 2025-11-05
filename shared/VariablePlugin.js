import { useEffect, useRef } from 'react';

import { createHeadlessEditor } from '@lexical/headless';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isTableCellNode, $isTableNode, $isTableRowNode } from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import { $applyNodeReplacement, $nodesOfType, $setSelection, COMMAND_PRIORITY_LOW, FOCUS_COMMAND } from 'lexical';

import { $isExtendedTextNode, ExtendedTextNode } from '../../ExtendedTextNode';
import { editorConfig, exportLexicalHtml, importLexicalHtml } from '../../lexicalUtil';
import { AddressNode } from '../nodes/AddressNode';
import AlienNumberBarcode from '../nodes/AlienNumberBarcode';
import ContactsNode from '../nodes/ContactsNode';
import DhsSeal from '../nodes/DhsSeal';
import LetterDateNode from '../nodes/LetterDateNode';
import LetterDetailsNode from '../nodes/LetterDetailsNode';
import { OrganizationAddress } from '../nodes/OrganizationAddress';
import OrganizationNameNode from '../nodes/OrganizationNameNode';
import PageBreakNode from '../nodes/PageBreakNode';
import ReceiptNumberBarcode from '../nodes/ReceiptNumberBarcode';
import ReceiptNumberNode from '../nodes/ReceiptNumberNode';

const VARIABLE_NODES = [
  ReceiptNumberNode,
  AddressNode,
  AlienNumberBarcode,
  ReceiptNumberBarcode,
  DhsSeal,
  OrganizationAddress,
  OrganizationNameNode,
  LetterDateNode,
  PageBreakNode,
];

const NODES_WITH_MULTIPLE_VARIABLES = [ContactsNode, LetterDetailsNode];
const ALL_VARIABLE_NODES = VARIABLE_NODES.concat(NODES_WITH_MULTIPLE_VARIABLES);

const isCustomNode = (node) => ALL_VARIABLE_NODES.find((nodeClass) => Object.prototype.isPrototypeOf.call(nodeClass, node));

const $variableTransform = (node, draft, options) => {
  if (!node?.isSimpleText() || isCustomNode(node)) return;

  ALL_VARIABLE_NODES.forEach((nodeClass) => {
    const result = nodeClass.searchText();
    const variableSearchTextSupportedByNode = Array.isArray(result) ? result : [result];

    // loop through each variable supported by the node ([[[FirstName]]], [[[LastName]]])
    variableSearchTextSupportedByNode.forEach((searchText) => {
      const text = node.getTextContent(); // gets the text out of the paragraph/heading

      // While typing in the paragraph. Searches for the variable ex: [[[A_NUMBER]]] in the text
      // ex: 'hi [[[A_NUMBER]]]' - index where found would be 3
      const upperCasedText = text.toUpperCase();
      let startIndex = 0;
      let indexWhereVariableNameIsFound = upperCasedText.indexOf(searchText, startIndex);
      const allIndexesWhereVariableNameIsFound = [];

      // If the variable [[[A_NUMBER]]] was found (index > 0)
      // Add the index of where it is found to the indices array
      // keep looking through the string for the varialble, and keep adding location indexes to the indicies array
      while (indexWhereVariableNameIsFound > -1) {
        allIndexesWhereVariableNameIsFound.push(indexWhereVariableNameIsFound);
        startIndex = indexWhereVariableNameIsFound + searchText.length;
        indexWhereVariableNameIsFound = upperCasedText.indexOf(searchText, startIndex);
      }

      // For each place in the paragraph we find the variable - ex:[[[A_NUMBER]]], replace with ANUMBER_NODE
      allIndexesWhereVariableNameIsFound.forEach((searchTextIndex) => {
        const format = node.getFormat();

        // Split the nodes
        // ex: 'hi [[[A_NUMBER]]]' will split into 2 extended text nodes. 1 for 'hi' and 1 for 'A_NUMBER'
        // Gets the extended text node with the variableName [[[A_NUMBER]]]
        // replaces that node with a alienNumber Node
        const splitNodes = node.splitText(searchTextIndex, searchTextIndex + searchText.length);
        const targetNode = searchTextIndex === 0 ? splitNodes[0] : splitNodes[1];
        const { editorIsOpen } = options;

        // let variableNode = nodeClass.createFromEditor(draft, editorIsOpen, options);
        let variableNode;

        // TODO temporary until refactor is complete. Starting with primaryApplicant
        if (nodeClass === ContactsNode || nodeClass === LetterDetailsNode) {
          variableNode = nodeClass.createFromEditor(draft, editorIsOpen, searchText);
        } else {
          variableNode = nodeClass.createFromEditor(draft, editorIsOpen, options);
        }

        variableNode = $applyNodeReplacement(variableNode);

        if ($isExtendedTextNode(variableNode)) variableNode.setFormat(format);

        targetNode.replace(variableNode);
      });
    });
  });
};

// This is called on the page reload and clicking into the editor
export const showVariableValues = (editor, draftState) => {
  editor.update(
    () => {
      VARIABLE_NODES.forEach((nodeClass) => {
        const nodes = $nodesOfType(nodeClass);
        nodes.forEach((node) => {
          if (node.updateFromDraft) {
            node.updateFromDraft(draftState, {}, editor);
          }
        });
      });

      // TODO - after refactor completion we will not need 2 loops
      NODES_WITH_MULTIPLE_VARIABLES.forEach((nodeClass) => {
        const nodes = $nodesOfType(nodeClass);
        nodes.forEach((node) => {
          if (node.updateFromDraft) {
            node.updateFromDraft(draftState, node.getSubType(), {}, editor);
          }
        });
      });

      $setSelection(null);
    },
    { discrete: true }
  );
};

const hydrateVariablesHeadlessly = (value, draft, options = {}) => {
  const editor = createHeadlessEditor(editorConfig);
  const $variableTransformForHeadlessEditor = (node) => $variableTransform(node, draft, options);

  editor.registerNodeTransform(ExtendedTextNode, $variableTransformForHeadlessEditor);
  importLexicalHtml(editor, value);

  editor.update(
    () => {
      const nodes = $nodesOfType(AddressNode);
      nodes.forEach((node) => {
        if (node.updateFromDraft) {
          node.updateFromDraft(draft, options);
        }
      });
    },
    { discrete: true }
  );
  return exportLexicalHtml(editor);
};

export default function VariablePlugin({ draft }) {
  const [editor] = useLexicalComposerContext();
  const isProcessingTableRef = useRef(false);
  const tableProcessingTimeoutRef = useRef(null);

  const $variableTransformFromEditor = (node) => {
    // Skip transforms when processing table operations to prevent freeze
    if (isProcessingTableRef.current) return;

    const editorIsOpen = editor.getRootElement() === document.activeElement;
    $variableTransform(node, draft, { editorIsOpen });
  };

  // Called on page load and when clicking into the editor
  useEffect(() => {
    const unregisterTransform = editor.registerNodeTransform(ExtendedTextNode, $variableTransformFromEditor);

    // Monitor for table operations using mutation listener
    const unregisterMutation = editor.registerMutationListener((mutatedNodes, { prevEditorState, dirtyLeaves }) => {
      // Check if any table-related nodes are being mutated
      editor.getEditorState().read(() => {
        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'created' || mutation === 'updated') {
            try {
              const node = editor.getEditorState()._nodeMap.get(nodeKey);
              if (node && ($isTableNode(node) || $isTableRowNode(node) || $isTableCellNode(node))) {
                // Set flag to skip transforms during table operations
                isProcessingTableRef.current = true;

                // Clear any existing timeout
                if (tableProcessingTimeoutRef.current) {
                  clearTimeout(tableProcessingTimeoutRef.current);
                }

                // Reset flag after a short delay to ensure table processing completes
                tableProcessingTimeoutRef.current = setTimeout(() => {
                  isProcessingTableRef.current = false;
                }, 100);

                break;
              }
            } catch (error) {
              // Node may not exist, continue
              console.error('Error checking node type:', error);
            }
          }
        }
      });
    });

    const unregisterFocus = editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        editor.update(() => {
          VARIABLE_NODES.forEach((nodeClass) => {
            const nodes = $nodesOfType(nodeClass);
            nodes.forEach((node) => {
              if (node.showVariable) {
                node.showVariable();
              }
            });
          });

          // TODO - after refactor completion we will not need 2 loops
          NODES_WITH_MULTIPLE_VARIABLES.forEach((nodeClass) => {
            const nodes = $nodesOfType(nodeClass);
            nodes.forEach((node) => {
              if (node.showVariable) {
                node.showVariable(node.getSubType());
              }
            });
          });
        });

        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterTransform();
      unregisterMutation();
      unregisterFocus();
      if (tableProcessingTimeoutRef.current) {
        clearTimeout(tableProcessingTimeoutRef.current);
      }
    };
  }, [editor, draft]);
}

export { $variableTransform, hydrateVariablesHeadlessly };
