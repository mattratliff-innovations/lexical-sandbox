import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import * as React from 'react';
import { createPortal } from 'react-dom';

import TableCellActionMenuContainer from './TableActionMenuContainer';

export default function TableActionMenuPlugin({
  anchorElem = document.body,
  cellMerge = false,
}) {
  const isEditable = useLexicalEditable();
  return createPortal(
    isEditable ? (
      <TableCellActionMenuContainer
        anchorElem={anchorElem}
        cellMerge={cellMerge}
      />
    ) : null,
    anchorElem,
  );
}
