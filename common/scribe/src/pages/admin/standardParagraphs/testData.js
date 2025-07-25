const MODEL_ID = '6e09ca5e-f10e-489a-9158-082d34004868';

export const formData = [
  {
    id: 'af2d3517-c8f5-4987-ab27-c430c6f3ff76',
    name: 'N-300',
    description: 'This is inactive form type description 1.0',
    active: false,
    createdAt: '2024-10-28T19:03:51.261Z',
    updatedAt: '2024-10-28T19:03:51.261Z',
    code: 'N300',
  },
];

const testXref = {
  id: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed10',
  standardParagraphId: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed1a',
  createdAt: '2024-10-28T19:03:51.536Z',
  updatedAt: '2024-10-28T19:03:51.536Z',
  letterType: {
    id: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed11',
    name: 'Letter Type 2 - Gettysburg - 0.25" Margins',
  },
  formType: { id: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed12', name: 'N-300' },
};

export const mockData = {
  id: MODEL_ID,
  code: 'BOND007',
  name: 'Name Bond',
  description: 'This is a standard paragraph description 1.0',
  content: '<p>This is a standard paragraph content 1.0</p>',
  active: true,
  locked: false,
  standardParagraphFormLetterXrefs: [testXref],
  createdAt: '2023-09-08T13:20:48.062Z',
  updatedAt: '2023-09-08T13:20:48.062Z',
};
