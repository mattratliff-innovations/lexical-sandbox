import React, { render, cleanup } from '@testing-library/react';
import textToBase64Barcode from './barcodeGenerator';

const text = 'HELLOWORLD';

function BarcodeRenderHelper() {
  return (
    <div>
      <img id="testImage" src={textToBase64Barcode(text)} alt="Alt text!" />
    </div>
  );
}

afterEach(cleanup);

beforeEach(async () => {
  render(<BarcodeRenderHelper />);
});

it('renders the barcode with the inputted text', async () => {
  const imgElement = document.querySelector('#testImage');

  expect(imgElement.src).toBe('data:image/png;base64,00');
});
