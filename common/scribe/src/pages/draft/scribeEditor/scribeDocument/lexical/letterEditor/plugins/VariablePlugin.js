import { useEffect } from 'react';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FOCUS_COMMAND, COMMAND_PRIORITY_LOW, $nodesOfType, $setSelection, $applyNodeReplacement } from 'lexical';
import { createHeadlessEditor } from '@lexical/headless';
import ReceiptNumberNode from '../nodes/ReceiptNumberNode';
import { AddressNode } from '../nodes/AddressNode';
import AlienNumberBarcode from '../nodes/AlienNumberBarcode';
import ReceiptNumberBarcode from '../nodes/ReceiptNumberBarcode';
import DhsSeal from '../nodes/DhsSeal';
import { OrganizationAddress } from '../nodes/OrganizationAddress';
import OrganizationNameNode from '../nodes/OrganizationNameNode';
import { ExtendedTextNode, $isExtendedTextNode } from '../../ExtendedTextNode';
import { importLexicalHtml, exportLexicalHtml, editorConfig } from '../../lexicalUtil';
import LetterDateNode from '../nodes/LetterDateNode';
import AlienNumberNode from '../nodes/AlienNumberNode';

const VARIABLE_NODES = [
  ReceiptNumberNode,
  AddressNode,
  AlienNumberBarcode,
  ReceiptNumberBarcode,
  DhsSeal,
  OrganizationAddress,
  OrganizationNameNode,
  LetterDateNode,
  AlienNumberNode,
];

const isCustomNode = (node) => VARIABLE_NODES.find((nodeClass) => Object.prototype.isPrototypeOf.call(nodeClass, node));

const $variableTransform = (node, draft, options) => {
  if (!node?.isSimpleText() || isCustomNode(node)) return;

  VARIABLE_NODES.forEach((nodeClass) => {
    const text = node.getTextContent();
    const variableValue = nodeClass.searchText();

    const upperCasedText = text.toUpperCase();
    let startIndex = 0;
    let index = upperCasedText.indexOf(variableValue, startIndex);
    const indices = [];

    while (index > -1) {
      indices.push(index);
      startIndex = index + variableValue.length;
      index = upperCasedText.indexOf(variableValue, startIndex);
    }

    indices.forEach((searchTextIndex) => {
      const format = node.getFormat();
      const splitNodes = node.splitText(searchTextIndex, searchTextIndex + variableValue.length);
      const targetNode = searchTextIndex === 0 ? splitNodes[0] : splitNodes[1];
      const { editorIsOpen } = options;
      let variableNode = nodeClass.createFromEditor(draft, editorIsOpen, options);
      variableNode = $applyNodeReplacement(variableNode);

      if ($isExtendedTextNode(variableNode)) variableNode.setFormat(format);

      targetNode.replace(variableNode);
    });
  });
};

export const showVariableValues = (editor, draftState) => {
  editor.update(
    () => {
      VARIABLE_NODES.forEach((nodeClass) => {
        const nodes = $nodesOfType(nodeClass);
        nodes.forEach((node) => node.updateFromDraft(draftState, {}));
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
      nodes.forEach((node) => node.updateFromDraft(draft, options));
    },
    { discrete: true }
  );
  return exportLexicalHtml(editor);
};

export default function VariablePlugin({ draft }) {
  const [editor] = useLexicalComposerContext();

  const $variableTransformFromEditor = (node) => {
    const editorIsOpen = editor.getRootElement() === document.activeElement;
    $variableTransform(node, draft, { editorIsOpen });
  };

  useEffect(() => {
    editor.registerNodeTransform(ExtendedTextNode, $variableTransformFromEditor);

    mergeRegister(
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          editor.update(() => {
            VARIABLE_NODES.forEach((nodeClass) => {
              const nodes = $nodesOfType(nodeClass);
              nodes.forEach((node) => node.showVariable());
            });
          });

          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);
}

export { $variableTransform, hydrateVariablesHeadlessly };
