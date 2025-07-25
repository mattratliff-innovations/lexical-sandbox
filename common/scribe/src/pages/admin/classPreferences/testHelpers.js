import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';

const setupMockFormTypesCall = (mockAxios) => {
  const mockFormTypes = [
    {
      id: '6b3ba701-78e1-4574-a0ac-2f45856540dd',
      name: 'N-400',
      description: 'This is form type for N-400',
      active: true,
      created_at: '2023-10-11T14:24:33.121Z',
      updated_at: '2023-10-11T14:24:33.121Z',
    },
    {
      id: '6b3ba701-78e1-4574-a0ac-2f45856540dd',
      name: 'S-200',
      description: 'This is form type for S-200',
      active: true,
      created_at: '2024-10-11T14:24:33.121a',
      updated_at: '2024-10-11T14:24:33.121a',
    },
  ];

  mockAxios.onGet(`${APP_API_ENDPOINT}/form_types/available_form_types_for_class_preference`).reply(200, mockFormTypes);
};

const setupMockFormTypesFailureCall = (mockAxios) =>
  mockAxios.onGet(`${APP_API_ENDPOINT}/form_types/available_form_types_for_class_preference`).reply(400);

export { setupMockFormTypesCall, setupMockFormTypesFailureCall };
