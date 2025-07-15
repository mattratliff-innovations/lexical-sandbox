import React from 'react';
import { uploadPdfHtmlToAws, downloadAllLetters, letterFileName, capitalizeFirstLetter, buildAllInclusivePdf } from './PreviewUtils';
import * as PreviewUtils from './PreviewUtils';
import fileDownload from 'js-file-download';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { PDF_ENDPOINT } from '../../../http/authenticatedAxios';
import { waitFor } from '@testing-library/dom';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { letterRecipients } from '../../contacts/ContactUtils';
import { CONTACT_TYPE_APPLICANT } from '../../contacts/ContactUtils';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

jest.mock('js-file-download', () => ({
  __esModule: true,
  default: jest.fn(), // Mock the default export
}));

jest.mock('js-file-download');

describe('.letterFileName', () => {
  const createDraft = (receiptNumber, name) => ({ registration: { receiptNumber }, letterCategory: { name } });

  it('generates the correct filename when all properties are present', () => {
    const draft = createDraft('12345', 'Category Name');
    const expectedFileName = 'scribe_12345_Category_Name';
    expect(letterFileName(draft)).toBe(expectedFileName);
  });

  it('handles missing registration', () => {
    const draft = createDraft(undefined, 'Category Name');
    const expectedFileName = 'scribe__Category_Name';
    expect(letterFileName(draft)).toBe(expectedFileName);
  });

  it('handles missing letterCategory', () => {
    const draft = createDraft('12345', undefined);
    const expectedFileName = 'scribe_12345_';
    expect(letterFileName(draft)).toBe(expectedFileName);
  });

  it('handles missing both registration and letterCategory', () => {
    const draft = createDraft(undefined, undefined);
    const expectedFileName = 'scribe__';
    expect(letterFileName(draft)).toBe(expectedFileName);
  });

  it('replaces spaces with underscores', () => {
    const draft = createDraft('123 45', 'Category Name');
    const expectedFileName = 'scribe_123_45_Category_Name';
    expect(letterFileName(draft)).toBe(expectedFileName);
  });
});

describe('.capitalizeFirstLetter', () => {
  it('returns an empty string when input is null or undefined', () => {
    expect(capitalizeFirstLetter(null)).toBe('');
    expect(capitalizeFirstLetter(undefined)).toBe('');
  });

  it('capitalizes the first letter of a single word', () => {
    expect(capitalizeFirstLetter('hello')).toBe('Hello');
  });

  it('capitalizes the first letter of a single character', () => {
    expect(capitalizeFirstLetter('a')).toBe('A');
  });

  it('does not change the rest of the string', () => {
    expect(capitalizeFirstLetter('hello world')).toBe('Hello world');
  });

  it('handles strings that are already capitalized', () => {
    expect(capitalizeFirstLetter('Hello')).toBe('Hello');
  });

  it('handles strings with special characters', () => {
    expect(capitalizeFirstLetter('!hello')).toBe('!hello');
    expect(capitalizeFirstLetter('123hello')).toBe('123hello');
  });

  it('handles empty strings', () => {
    expect(capitalizeFirstLetter('')).toBe('');
  });
});

describe('.downloadAllLetters', () => {
  it('does not proceed if draft is null', async () => {
    jest.spyOn(PreviewUtils, 'buildAllInclusivePdf').mockImplementation(() => 'mocked value');

    const retval = await downloadAllLetters(null, {}, null, null);

    expect(retval).toBe(undefined);
    expect(buildAllInclusivePdf).not.toHaveBeenCalled();
  });

  it('revokes existing pdfData if provided', async () => {
  const pdfResponseAll = { data: new Blob() };
  const htmlFormData = new FormData(); // Use actual FormData instead of string
  const contacts = [
    { id: 1, first_name: 'bob',  primaryApplicant: true, letterRecipient: true,  type: CONTACT_TYPE_APPLICANT }, 
    { id: 2, first_name: 'jane', primaryApplicant: false, letterRecipient: true,  type: CONTACT_TYPE_APPLICANT }, 
    { id: 3, first_name: 'joe',  primaryApplicant: false, letterRecipient: false, type: CONTACT_TYPE_APPLICANT }
  ];
  const draft = { 
    id: '42', 
    registration: { receiptNumber: 'SRC2407050071' }, 
    letterCategory: { name: 'DDPC' }, 
    contacts 
  };
  const supportingDocuments = [];
  const pdfData = "EXISTING PDF DATA";

  const setPdfData = jest.fn();
  
  // Mock the buildAllInclusivePdf function to return the expected structure
  jest.spyOn(PreviewUtils, 'buildAllInclusivePdf').mockResolvedValue({ 
    pdfResponseAll, 
    htmlFormData 
  });
  jest.spyOn(PreviewUtils, 'uploadPdfHtmlToAws').mockResolvedValue();
  
  URL.createObjectURL = jest.fn().mockReturnValue('newPdfUrl');
  URL.revokeObjectURL = jest.fn();
  
  mockAxios.onPost(`${APP_API_ENDPOINT}/letters/${draft.id}/upload_pdf`).reply(200, {});
  
  await downloadAllLetters(draft, supportingDocuments, setPdfData, pdfData);

  expect(URL.revokeObjectURL).toHaveBeenCalledWith(pdfData);
  expect(URL.createObjectURL).toHaveBeenCalled();
  expect(setPdfData).toHaveBeenCalledWith('newPdfUrl');
  expect(fileDownload).toHaveBeenCalledWith(pdfResponseAll.data, 'scribe_SRC2407050071_DDPC.pdf');
});

  // it('revokes existing pdfData if provided', async () => {
  //   const pdfResponseAll = { data: new Blob() };
  //   const htmlFormData = "<html><body><p>lol</p></body></html>";
  //   const contacts = [
  //     { id: 1, first_name: 'bob',  primaryApplicant: true, letterRecipient: true,  type: CONTACT_TYPE_APPLICANT }, 
  //     { id: 2, first_name: 'jane', primaryApplicant: false, letterRecipient: true,  type: CONTACT_TYPE_APPLICANT }, 
  //     { id: 3, first_name: 'joe',  primaryApplicant: false, letterRecipient: false, type: CONTACT_TYPE_APPLICANT }]
  //   const draft = { id: '42', 
  //     registration: { receiptNumber: 'SRC2407050071', }, 
  //     letterCategory: { name: 'DDPC' }, 
  //     contacts };
  //   const supportingDocuments = [];
  //   const pdfData = "EXISTING PDF DATA";

  //   const setPdfData = jest.fn();
  //   jest.spyOn(PreviewUtils, 'buildAllInclusivePdf').mockImplementation(() => ({ pdfResponseAll, htmlFormData }));
  //   jest.spyOn(PreviewUtils, 'uploadPdfHtmlToAws').mockImplementation(() => {});
  //   URL.createObjectURL = jest.fn().mockReturnValue('newPdfUrl');
  //   URL.revokeObjectURL = jest.fn();
  //   mockAxios.onPost(`${APP_API_ENDPOINT}/letters/${draft.id}/upload_pdf`).reply(200, {});
  //   mockAxios.onPost(`${PDF_ENDPOINT}/from_html`).reply(200, pdfResponseAll);
    
  //   await downloadAllLetters(draft, supportingDocuments, setPdfData, pdfData);

  //   expect(URL.revokeObjectURL).toHaveBeenCalledWith(pdfData);
  //   expect(URL.createObjectURL).toHaveBeenCalled();
  //   expect(setPdfData).toHaveBeenCalledWith('newPdfUrl');
  // });
});
