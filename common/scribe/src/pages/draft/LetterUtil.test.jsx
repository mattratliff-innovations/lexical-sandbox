import * as React from 'react';
import { render, screen } from '@testing-library/react';
import deepCamelCase from '../../../testSetup/util';
import { generateSignatureContent, LETTER_CLOSING, convertInchesToPixels, GeneratePdfObject, findOrganizationSignature } from './LetterUtil';
import * as letterData from './LetterTestData';

const renderComponent = (signature) => {
  render(<>{generateSignatureContent(signature)}</>);
};

describe('generateSignatureContent', () => {
  it('renders the signature', async () => {
    const signature = {
      signatoryName: 'John Jay',
      encodedSignature: 'abc123',
      signatoryTitle: 'Justice',
    };

    renderComponent(signature);
    const component = screen.getByTestId('signature');

    expect(component).toHaveTextContent(LETTER_CLOSING);
    expect(component).toHaveTextContent(signature.signatoryName);
    expect(component).toHaveTextContent(signature.signatoryTitle);
    const image = component.querySelector('img');
    expect(image.src).toContain(signature.encodedSignature);
  });

  it('does not throw an exception if the signature is not set', async () => {
    renderComponent(null);
    const component = screen.getByTestId('signature');

    expect(component).toHaveTextContent(LETTER_CLOSING);
  });
});

describe('convertInchesToPixels', () => {
  it('converts the value', () => {
    const result = convertInchesToPixels(1);

    expect(Math.floor(result)).toBe(96);
  });
});

describe('findOrganizationSignature', () => {
  it('returns the default signature if there is no default signature selected', () => {
    const noSignatureSelectedDraft = {
      ...deepCamelCase(letterData.draftDataNoSectionsNoContact),
      organizationSignatureId: null,
    };

    const result = findOrganizationSignature(noSignatureSelectedDraft);

    expect(result.id).toEqual(letterData.defaultSignature.id);
  });

  it('safely returns null if there is no signature included', () => {
    const signatureNotIncludedDraft = {
      ...deepCamelCase(letterData.draftDataNoSectionsNoContact),
      letterType: { signatureIncluded: false },
    };

    const result = findOrganizationSignature(signatureNotIncludedDraft);

    expect(result).toBeNull();
  });

  it('returns the selected signature', () => {
    const result = findOrganizationSignature(deepCamelCase(letterData.draftDataNoSectionsNoContact));

    expect(result.id).toEqual(letterData.defaultSignature.id);
  });
});

describe('GeneratePdfObject', () => {
  it('generate a PDF object', async () => {
    const pdfData = 'http://www.ufo-uap.com/d7eb8c84-e470-4d3a-8b03-c05b354b0a98';
    const inlinePdfScale = 138;
    const { getByTestId } = render(<GeneratePdfObject pdfData={pdfData} inlinePdfScale={inlinePdfScale} />);
    const pdfObject = getByTestId('inline-pdf');

    expect(pdfObject).toBeInTheDocument();
    expect(pdfObject).toHaveAttribute('data', `${pdfData}#toolbar=0&zoom=${inlinePdfScale}`);
    expect(pdfObject).toHaveAttribute('type', 'application/pdf');
    expect(pdfObject).toHaveClass('inlinePdf');
  });
});
