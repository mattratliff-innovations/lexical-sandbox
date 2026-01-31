const standardList = [
  'undo',
  'redo',
  'blockType',
  'bold',
  'italic',
  'underline',
  'highlight',
  'indent',
  'outdent',
  'lists',
  'alignMenu',
  'cut',
  'copy',
  'paste',
  'horizontalrule',
];

const standardToolList = {
  leftSide: standardList,
  rightSide: ['table', 'insert', 'sourceCode'],
};

const headerToolList = {
  leftSide: ['undo', 'redo', 'bold', 'alignMenu'],
  rightSide: ['insert', 'sourceCode'],
};

const snippetToolList = {
  leftSide: standardList,
  rightSide: ['sourceCode'],
};

export { headerToolList, snippetToolList, standardToolList };
