import { render, screen } from '@testing-library/react';

import LetterEditorGuideModal from './LetterEditorGuideModal';

describe('LetterEditorGuideModal', () => {
  it('has expected elements', () => {
    render(<LetterEditorGuideModal showModal setShowModal={() => jest.fn()} />);
    const h1Element = screen.getByTestId('LetterEditorGuideModalHeader');
    expect(h1Element).toHaveTextContent('Letter Editor Guide');
  });
});
