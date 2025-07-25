export const multiModeData = {
  formOptions: [
    {
      name: 'Form Type A',
      label: 'Form Type A',
      id: 'formTypeA',
    },

    {
      name: 'Form Type B',
      label: 'Form Type B',
      id: 'formTypeB',
    },
  ],
  selected: [],
};

export const letterRequestData = [
  {
    id: 'letterid1',
    name: 'Letter type test 1',
    formLetterTypeXrefs: [{ id: 'xrefidletter1' }],
  },
];

export const letterTypes = [
  {
    id: 'Letter type test 1',
    name: 'Letter type test 1',
    label: 'Letter type test 1',
    value: 'Letter type test 1',
    selected: false,
    formType: 'Form Type A',
  },
  {
    id: 'Letter type test 2',
    name: 'Letter type test 2',
    label: 'Letter type test 2',
    value: 'Letter type test 2',
    selected: false,
    formType: 'Form Type A',
  },
  {
    id: 'Letter type test 3',
    name: 'Letter type test 3',
    label: 'Letter type test 3',
    value: 'Letter type test 3',
    selected: false,
    formType: 'Form Type B',
  },
  {
    id: 'Letter type test 4',
    name: 'Letter type test 4',
    label: 'Letter type test 4',
    value: 'Letter type test 4',
    selected: false,
    formType: 'Form Type B',
  },
];
