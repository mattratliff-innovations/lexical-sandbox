/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-no-bind */
import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { AddContentBtn, ContentSection } from './AddContentModalComponents';

describe('AddContentBtn', () => {
  it('renders with correct text and calls clickHandler on click', () => {
    const handleClick = jest.fn();
    render(<AddContentBtn clickHandler={handleClick} text="Add Item" btnTestId="add-btn" />);
    const button = screen.getByTestId('add-btn');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('ContentSection', () => {
  it('renders a component for each data item', () => {
    const data = [{ id: 1 }, { id: 2 }];
    function DummyComponent({ standardItem }) {
      return <div data-testid={`item-${standardItem.id}`}>{standardItem.id}</div>;
    }
    render(<ContentSection Component={DummyComponent} data={data} />);
    expect(screen.getByTestId('item-1')).toHaveTextContent('1');
    expect(screen.getByTestId('item-2')).toHaveTextContent('2');
  });

  it('passes additional props to each rendered component', () => {
    const data = [{ id: 1 }];
    function DummyComponent({ _standardItem, extra }) {
      return <div data-testid="dummy">{extra}</div>;
    }
    render(<ContentSection Component={DummyComponent} data={data} extra="extra-prop" />);
    expect(screen.getByTestId('dummy')).toHaveTextContent('extra-prop');
  });
});
