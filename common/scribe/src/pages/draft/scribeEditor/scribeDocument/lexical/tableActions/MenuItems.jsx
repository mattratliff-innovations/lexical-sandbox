import React from 'react';
import styled from '@emotion/styled/macro';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const AlignTableContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

function AlignTable() {
  return (
    <AlignTableContainer>
      Align Table
      <ChevronRightIcon />
    </AlignTableContainer>
  );
}

export default function getMenuItems({ isColumnsDisabled, actions }) {
  const {
    insertTableRowAtSelection,
    insertTableColumnAtSelection,
    deleteTableColumnAtSelection,
    deleteTableRowAtSelection,
    deleteTableAtSelection,
    toggleTableRowIsHeader,
    toggleTableColumnIsHeader,
    canMergeCells,
    canUnmergeCell,
    mergeTableCellsAtSelection,
    unmergeTableCellsAtSelection,
    alignTableAction,
  } = actions;

  const mainMenuItems = [
    {
      id: 'table-align',
      testId: 'table-align',
      text: <AlignTable />,
    },
    {
      id: 'table-delete-table',
      testId: 'table-delete-table',
      text: 'Delete table',
      onClick: deleteTableAtSelection,
    },
    { id: 'divider-1', type: 'divider', key: 'divider-1' },
    {
      id: 'table-merge-cells',
      testId: 'table-merge-cells',
      disabled: !canMergeCells,
      text: 'Merge cells',
      onClick: mergeTableCellsAtSelection,
    },
    {
      id: 'table-unmerge-cells',
      testId: 'table-unmerge-cells',
      disabled: !canUnmergeCell,
      text: 'Unmerge cells',
      onClick: unmergeTableCellsAtSelection,
    },
    { id: 'divider-2', type: 'divider', key: 'divider-2' },

    {
      id: 'table-insert-row-above',
      testId: 'table-insert-row-above',
      text: 'Insert row above',
      onClick: () => insertTableRowAtSelection(false),
    },
    {
      id: 'table-insert-row-below',
      testId: 'table-insert-row-below',
      text: 'Insert row below',
      onClick: () => insertTableRowAtSelection(true),
    },
    { id: 'divider-3', type: 'divider', key: 'divider-3' },
    {
      id: 'table-insert-column-left',
      testId: 'table-insert-column-left',
      text: 'Insert column left',
      disabled: isColumnsDisabled,
      onClick: () => insertTableColumnAtSelection(false),
    },
    {
      id: 'table-insert-column-right',
      testId: 'table-insert-column-right',
      text: 'Insert column right',
      disabled: isColumnsDisabled,
      onClick: () => insertTableColumnAtSelection(true),
    },
    { id: 'divider-4', type: 'divider', key: 'divider-4' },
    {
      id: 'table-delete-column',
      testId: 'table-delete-column',
      text: 'Delete column',
      onClick: deleteTableColumnAtSelection,
    },
    {
      id: 'table-delete-row',
      testId: 'table-delete-row',
      text: 'Delete row',
      onClick: deleteTableRowAtSelection,
    },
    { id: 'divider-5', type: 'divider', key: 'divider-5 ' },
    {
      id: 'table-toggle-row-header',
      testId: 'table-toggle-row-header',
      text: 'Toggle row header',
      onClick: toggleTableRowIsHeader,
    },
    {
      id: 'table-toggle-column-header',
      testId: 'table-toggle-column-header',
      text: 'Toggle column header',
      onClick: toggleTableColumnIsHeader,
    },
  ];

  const alignMenuItems = [
    {
      id: 'align-table-left',
      align: 'left',
      testId: 'align-table-left',
      text: 'Align table left',
      onClick: () => alignTableAction('left'),
    },
    {
      id: 'align-table-center',
      align: 'center',
      testId: 'align-table-center',
      text: 'Align table center',
      onClick: () => alignTableAction('center'),
    },
    {
      id: 'align-table-right',
      align: 'right',
      testId: 'align-table-right',
      text: 'Align table right',
      onClick: () => alignTableAction('right'),
    },
  ];

  return { mainMenuItems, alignMenuItems };
}
