import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import LetterEditorGuideModal from './LetterEditorGuideModal';

const renderComponent = async () => {
  await act(async () => {
    render(<LetterEditorGuideModal showModal setShowModal={() => jest.fn()} />);
  });
};

describe('LetterEditorGuideModal', () => {
  beforeEach(async () => {
    await renderComponent();
  });

  it('has expected elements', () => {
    const h1Element = screen.getByTestId('LetterEditorGuideModalHeader');
    expect(h1Element).toHaveTextContent('Letter Editor Guide');
  });
});
