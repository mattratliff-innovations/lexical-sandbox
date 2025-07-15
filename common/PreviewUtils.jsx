import React from 'react';
import { toast, Flip } from 'react-toastify';
import { renderToStaticMarkup } from 'react-dom/server';
import printJS from 'print-js';
import fileDownload from 'js-file-download';
import { createAuthenticatedAxios, PDF_ENDPOINT, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import renderPdfHtml from '../htmlTo508CompliantPdfHtml';
import { draftToPdfHtml, supportingDocumentToPdfHtml } from '../scribeEditor/scribeDocument/ScribeDocumentUtil';
import PrintedFooter from '../PrintedFooter';
import * as Util from '../../contacts/ContactUtils';

export const PAGE_BREAK = '<div style="break-after: page;"></div>';

export const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const pdfScale = () => {
  const root = document.documentElement;
  const scale = getComputedStyle(root).getPropertyValue('--us-letter-inline-pdf-scale').trim();
  return scale;
};

export const letterFileName = (draft) => ['scribe', draft?.registration?.receiptNumber, draft?.letterCategory?.name].join('_').replace(/ /g, '_');

export const splitSupportingDocuments = (supportingDocuments, recipient = { mainCopy: true }) => {
  const prependSupportingDocuments = [];
  const appendSupportingDocuments = [];

  supportingDocuments?.forEach((sd) => {
    if (!recipient.mainCopy && !sd.courtesy) return;

    const htmlDocument = renderPdfHtml(supportingDocumentToPdfHtml(sd), sd);

    (sd.prepend ? prependSupportingDocuments : appendSupportingDocuments).push(htmlDocument);
  });

  return { prependSupportingDocuments, appendSupportingDocuments };
};

// This is the actual call to the pdf generation service.
export const pdfGenerationCall = async (injectedHtml, endpoint = `${PDF_ENDPOINT}/from_html`) => {
  const axios = createAuthenticatedAxios();

  try {
    const response = await axios.post(endpoint, injectedHtml, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/html' },
    });
    return response;
  } catch (error) {
    toast.error('Encountered an unknown error generating the PDF.', {
      position: 'top-center',
      transition: Flip,
      theme: 'dark',
    });
    return null;
  }
};

export const generateFinalHtml = (recipientId, draft, supportingDocuments, totalPageCount) => {
  const contacts = () => draft?.contacts || [];
  const recipients = Util.letterRecipients(contacts());
  const html = draftToPdfHtml(draft, { recipientId, totalPageCountForHeader: totalPageCount });
  const pdfHtml = renderPdfHtml(html, draft);
  const recipient = recipients.find((item) => item.id === recipientId);

  const { prependSupportingDocuments, appendSupportingDocuments } = splitSupportingDocuments(supportingDocuments, recipient);

  const htmlDocumentFinalPageBreak = [...prependSupportingDocuments, pdfHtml, ...appendSupportingDocuments].join(PAGE_BREAK);
  const printedFooter = renderToStaticMarkup(<PrintedFooter draft={draft} />);
  const finalHtml = printedFooter + htmlDocumentFinalPageBreak; // We don't want to join printedFooter with the page break, theres no reason to.

  return finalHtml;
};

export const uploadPdfHtmlToAws = async (pdfHtmlFormData, draftId) => {
  console.log("uploadPdfHtmlToAws??")
  const axios = createAuthenticatedAxios();

  const config = { headers: { 'content-type': 'multipart/form-data' } };

  console.log(".post(`${APP_API_ENDPOINT}/letters/${draftId}/upload_pdf`, pdfHtmlFormData, config)", `${APP_API_ENDPOINT}/letters/${draftId}/upload_pdf`, pdfHtmlFormData, config)

  await axios
    .post(`${APP_API_ENDPOINT}/letters/${draftId}/upload_pdf`, pdfHtmlFormData, config)
    .then(() => {
      console.log('PDF Letter Generated Successfully!')
      toast.success('PDF Letter Generated Successfully!', {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'draft',
      });
    })
    .catch(() => {
      toast.error('Encountered an unknown error finalizing the PDF.', {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
      });
    });
};

export const printMergedPdf = async (draft, supportingDocuments) => {
  const htmlFormData = new FormData();

  const contacts = () => draft?.contacts || [];
  const recipients = Util.letterRecipients(contacts());

  // Recipient PDFs
  const htmlContentArray = recipients.map((recipient) => {
    const htmlContent = draftToPdfHtml(draft, { recipientId: recipient.id });
    const htmlDocument = renderPdfHtml(htmlContent, draft);

    const { prependSupportingDocuments, appendSupportingDocuments } = splitSupportingDocuments(supportingDocuments, recipient);

    const htmlDocumentFinal = [...prependSupportingDocuments, htmlDocument, ...appendSupportingDocuments].join(PAGE_BREAK);
    htmlFormData.append(`html_letter[${recipient.id}]`, htmlDocumentFinal); // form data of letter with supporting doc
    return htmlContent; // array without supporting doc
  });

  // All Inclusive PDF
  const { prependSupportingDocuments, appendSupportingDocuments } = splitSupportingDocuments(supportingDocuments, { mainCopy: true });

  const htmlContentPageBreak = htmlContentArray.join(PAGE_BREAK);
  const htmlDocumentAll = renderPdfHtml(htmlContentPageBreak, draft);
  const htmlDocumentAllFinal = [...prependSupportingDocuments, htmlDocumentAll, ...appendSupportingDocuments].join(PAGE_BREAK);

  const printedFooter = renderToStaticMarkup(<PrintedFooter draft={draft} />);
  const finalHtml = printedFooter + htmlDocumentAllFinal; // We don't want to join printedFooter with the page break, theres no reason to.

  const pdfResponseAll = await pdfGenerationCall(finalHtml);
  htmlFormData.append('html_letter[all]', finalHtml);

  printJS(URL.createObjectURL(pdfResponseAll.data));
  await uploadPdfHtmlToAws(htmlFormData, draft.id);
};

export const generatePdf = (draft, recipientId, supportingDocuments, pdfData, setPdfData, totalPages = 0) => {
  if (!draft) return;

  const finalHtml = generateFinalHtml(recipientId, draft, supportingDocuments, totalPages);

  pdfGenerationCall(finalHtml).then((response) => {
    if (response && response.data) {
      if (pdfData) URL.revokeObjectURL(pdfData);

      const urlPdf = URL.createObjectURL(response.data);
      setPdfData(urlPdf);
    }
  });
};

export async function buildAllInclusivePdf(draft, supportingDocuments) {
  const htmlFormData = new FormData();

  const contacts = () => draft?.contacts || [];
  const recipients = Util.letterRecipients(contacts());  
  // Recipient PDFs
  const htmlContentArray = recipients.map((recipient) => {
    const htmlContent = draftToPdfHtml(draft, { recipientId: recipient.id });
    const htmlDocument = renderPdfHtml(htmlContent, draft);

    const { prependSupportingDocuments, appendSupportingDocuments } = splitSupportingDocuments(supportingDocuments, recipient);

    const htmlDocumentFinal = [...prependSupportingDocuments, htmlDocument, ...appendSupportingDocuments].join(PAGE_BREAK);
    htmlFormData.append(`html_letter[${recipient.id}]`, htmlDocumentFinal); // form data of letter with supporting doc
    return htmlContent; // array without supporting doc
  });
  // All Inclusive PDF
  const { prependSupportingDocuments, appendSupportingDocuments } = splitSupportingDocuments(supportingDocuments, { mainCopy: true });
  const htmlContentPageBreak = htmlContentArray.join(PAGE_BREAK);
  const htmlDocumentAll = renderPdfHtml(htmlContentPageBreak, draft);
  const htmlDocumentAllFinal = [...prependSupportingDocuments, htmlDocumentAll, ...appendSupportingDocuments].join(PAGE_BREAK);

  const printedFooter = renderToStaticMarkup(<PrintedFooter draft={draft} />);
  const finalHtml = printedFooter + htmlDocumentAllFinal; // We don't want to join printedFooter with the page break, theres no reason to.

  const pdfResponseAll = await pdfGenerationCall(finalHtml);
  htmlFormData.append('html_letter[all]', finalHtml);
  return { pdfResponseAll, htmlFormData };
}

export const downloadAllLetters = async (draft, supportingDocuments, setPdfData, pdfData) => {
   console.log('downloadAllLetters!', draft, supportingDocuments, setPdfData, pdfData);

  if (!draft) {
    console.log('******* RETURNING')
    return;
  }

  console.log('buildingallinclusivepdf')
  const { pdfResponseAll, htmlFormData } = await buildAllInclusivePdf(draft, supportingDocuments);
  console.log('htmlFormData!', htmlFormData)

  console.log('PREVIEWUTILS1', pdfResponseAll)

  if (pdfData) URL.revokeObjectURL(pdfData);
  console.log('PREVIEWUTILS2', pdfResponseAll)

  const urlPdf = URL.createObjectURL(pdfResponseAll.data);
  setPdfData(urlPdf);

  fileDownload(pdfResponseAll.data, `${letterFileName(draft)}.pdf`);
  console.log("pre uploadpdfhtmltoaws")

  await uploadPdfHtmlToAws(htmlFormData, draft.id);
  console.log("post uploadpdfhtmltoaws")
};
