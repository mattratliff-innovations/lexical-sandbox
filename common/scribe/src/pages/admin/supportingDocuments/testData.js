const MODEL_ID = '6e09ca5e-f10e-489a-9158-082d34004868';

export const formData = [
  {
    id: 'af2d3517-c8f5-4987-ab27-c430c6f3ff76',
    name: 'A different name',
    active: false,
    prepend: false,
    marginTop: '1.1',
    marginBottom: '1.2',
    marginLeft: '1.3',
    marginRight: '1.4',
    createdAt: '2024-10-28T19:03:51.261Z',
    updatedAt: '2024-10-28T19:03:51.261Z',
  },
];

const testXref = {
  id: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed10',
  supportingDocumentId: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed1a',
  createdAt: '2024-10-28T19:03:51.536Z',
  updatedAt: '2024-10-28T19:03:51.536Z',
  letterType: {
    id: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed11',
    name: 'Letter Type 2 - Gettysburg - 0.25" Margins',
  },
  formType: { id: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed12', name: 'N-300' },
};

const sections = [
  {
    id: 'f14785a7-2134-42c7-b5eb-29754cf6d068',
    supportingDocumentId: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed1a',
    text: '<p>supporting document content 1</p>',
    order: 1,
    locked: false,
    createdAt: '2025-06-02T16:24:22.326Z',
    updatedAt: '2025-06-02T16:33:59.547Z',
  },
  {
    id: 'eb970a0d-df06-42d9-95f1-a2955f9b1fcd',
    supportingDocumentId: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed1a',
    text: '<p>supporting document content 2</p>',
    order: 2,
    locked: false,
    createdAt: '2025-06-02T17:24:22.326Z',
    updatedAt: '2025-06-02T17:33:59.547Z',
  },
  {
    id: '8737e40b-7175-41b8-a54d-10d4983cd16c',
    supportingDocumentId: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed1a',
    text: '<p>supporting document content 3</p>',
    order: 3,
    locked: false,
    createdAt: '2025-06-02T18:24:22.326Z',
    updatedAt: '2025-06-02T18:30:59.547Z',
  },
];

export const mockData = {
  id: MODEL_ID,
  name: 'supdoc name',
  active: true,
  prepend: true,
  marginTop: '0.65',
  marginBottom: '1.0',
  marginLeft: '1.0',
  marginRight: '1.0',
  supportingDocumentFormLetterXrefs: [testXref],
  supportingDocumentSections: sections,
  createdAt: '2023-09-08T13:20:48.062Z',
  updatedAt: '2023-09-08T13:20:48.062Z',
};
